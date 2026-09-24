import { getWorldById } from "@/lib/db/queries/worlds";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";
import type { WorldData } from "@/types/world";

export type PlayableWorldResult =
  | { ok: true; world: WorldData }
  | { ok: false; status: 403 | 404 };

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parseJsonStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Loads a world the requester may play: a prebuilt world, a public world, or
 * one they own. Game routes use this instead of trusting a client-supplied
 * world, whose prompt-bearing fields would otherwise go straight to the model.
 */
export async function resolvePlayableWorld(
  id: string,
  requesterId: string | null,
): Promise<PlayableWorldResult> {
  const prebuilt = PREBUILT_WORLDS.find((w) => w.id === id);
  if (prebuilt) return { ok: true, world: prebuilt };

  const world = await getWorldById(id);
  if (!world) return { ok: false, status: 404 };

  const canPlay = world.isPublic || (requesterId && world.ownerId === requesterId);
  if (!canPlay) return { ok: false, status: 403 };

  // Extract mechanics from the game bible's parsed data (uploaded worlds only)
  let classes: Array<{ name: string; description: string }> | undefined;
  let backgrounds: Array<{ name: string; description: string }> | undefined;
  let rulesNotes: string | undefined;
  let statRules: { perStatMin?: number; perStatMax?: number; totalPointPool?: number | null } | undefined;
  if (world.gameBible?.parsedData) {
    try {
      const bible = JSON.parse(world.gameBible.parsedData) as {
        classes?: Array<{ name: string; description: string }>;
        backgrounds?: Array<{ name: string; description: string }>;
        rulesNotes?: string;
        statRules?: { perStatMin?: number; perStatMax?: number; totalPointPool?: number | null };
      };
      if (bible.classes?.length) classes = bible.classes;
      if (bible.backgrounds?.length) backgrounds = bible.backgrounds;
      if (bible.rulesNotes) rulesNotes = bible.rulesNotes;
      if (bible.statRules && typeof bible.statRules === "object") statRules = bible.statRules;
    } catch {
      // parsedData malformed — skip mechanics
    }
  }

  return {
    ok: true,
    world: {
      id: world.id,
      name: world.name,
      description: world.description,
      genre: world.genre,
      tone: world.tone,
      systemPrompt: world.systemPrompt,
      isPrebuilt: world.isPrebuilt,
      imageUrl: world.imageUrl,
      ...(classes && { classes }),
      ...(backgrounds && { backgrounds }),
      ...(rulesNotes && { rulesNotes }),
      ...(statRules && { statRules }),
      locations: world.locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        shortDesc: loc.shortDesc,
        ambientSound: loc.ambientSound,
        connectedTo: parseJsonStringArray(loc.connectedTo),
        properties: parseJsonObject(loc.properties),
      })),
      npcs: world.npcs.map((npc) => ({
        id: npc.id,
        name: npc.name,
        role: npc.role,
        personality: npc.personality,
        voiceDescription: npc.voiceDescription,
        relationship: npc.relationship as WorldData["npcs"][number]["relationship"],
        isAlive: npc.isAlive,
        locationId: npc.locationId,
      })),
    },
  };
}
