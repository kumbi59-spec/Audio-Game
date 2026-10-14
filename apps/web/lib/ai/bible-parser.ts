import { randomUUID } from "node:crypto";
import type { ParsedGameBible } from "@/types/world";
import { BIBLE_PARSE_SYSTEM } from "./prompts/bible-parse";
import { getAnthropicClient, messageText, modelParams, MODEL } from "./client";
import { prisma } from "@/lib/db";
import { resolveWorldCoverImage } from "@/lib/worlds/cover-art-resolver";

const MAX_INPUT_CHARS = 80_000;
const MAX_TOKENS = 8192;

export async function parseGameBible(rawText: string): Promise<ParsedGameBible> {
  const truncated =
    rawText.length > MAX_INPUT_CHARS
      ? rawText.slice(0, MAX_INPUT_CHARS) +
        "\n\n[NOTE: Text truncated at 80,000 characters for processing.]"
      : rawText;

  const response = await getAnthropicClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    ...modelParams(),
    system: BIBLE_PARSE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Extract the world data from the following Game Bible text:\n\n${truncated}`,
      },
    ],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "The world description produced too much data for the AI to complete. Try a shorter document (under 5,000 words)."
    );
  }

  const text = messageText(response);
  if (!text) {
    throw new Error("Unexpected response type from Claude");
  }

  // Strip code fences Claude sometimes adds
  let jsonText = text
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  // If Claude added prose before/after the JSON, extract the object boundaries
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace > 0 || lastBrace < jsonText.length - 1) {
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      "Claude returned invalid JSON — please try a different file or rephrase your Game Bible."
    );
  }

  return normalizeParsedBible(parsed);
}

type Loose = Record<string, unknown>;

function isObject(v: unknown): v is Loose {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Maps each object entry of a list through `pick`, dropping entries with no name. */
function namedEntries<T extends { name: string }>(v: unknown, pick: (o: Loose) => T): T[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObject).map(pick).filter((e) => e.name.trim() !== "");
}

function finiteNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * The model's reply is only JSON, not necessarily the shape we asked for, and
 * fields it leaves out would otherwise throw in buildSystemPromptFromBible or
 * fail the world insert. Strings default to "", lists to [], and list entries
 * without a name are dropped.
 */
export function normalizeParsedBible(raw: unknown): ParsedGameBible {
  const b = isObject(raw) ? raw : {};

  const statRulesRaw = isObject(b["statRules"]) ? b["statRules"] : null;
  let statRules: ParsedGameBible["statRules"];
  if (statRulesRaw) {
    statRules = {};
    const perStatMin = finiteNumber(statRulesRaw["perStatMin"]);
    const perStatMax = finiteNumber(statRulesRaw["perStatMax"]);
    const totalPointPool = statRulesRaw["totalPointPool"] === null ? null : finiteNumber(statRulesRaw["totalPointPool"]);
    if (perStatMin !== undefined) statRules.perStatMin = perStatMin;
    if (perStatMax !== undefined) statRules.perStatMax = perStatMax;
    if (totalPointPool !== undefined) statRules.totalPointPool = totalPointPool;
  }

  return {
    worldName: str(b["worldName"]).trim() || "Untitled World",
    genre: str(b["genre"]),
    tone: str(b["tone"]),
    synopsis: str(b["synopsis"]),
    systemPromptCore: str(b["systemPromptCore"]),
    locations: namedEntries(b["locations"], (l) => ({
      name: str(l["name"]),
      description: str(l["description"]),
      shortDesc: str(l["shortDesc"]),
      ambientMood: str(l["ambientMood"]),
      connections: strings(l["connections"]),
    })),
    npcs: namedEntries(b["npcs"], (n) => ({
      name: str(n["name"]),
      role: str(n["role"]),
      personality: str(n["personality"]),
      voiceDescription: str(n["voiceDescription"]),
      homeLocation: str(n["homeLocation"]),
    })),
    factions: namedEntries(b["factions"], (f) => ({
      name: str(f["name"]),
      description: str(f["description"]),
      disposition: str(f["disposition"]),
    })),
    startingLocation: str(b["startingLocation"]),
    openingNarration: str(b["openingNarration"]),
    campaignHooks: strings(b["campaignHooks"]),
    importantItems: namedEntries(b["importantItems"], (i) => ({
      name: str(i["name"]),
      description: str(i["description"]),
      significance: str(i["significance"]),
    })),
    rulesNotes: str(b["rulesNotes"]),
    classes: namedEntries(b["classes"], (c) => ({
      name: str(c["name"]),
      description: str(c["description"]),
      role: str(c["role"]),
    })),
    backgrounds: namedEntries(b["backgrounds"], (bg) => ({
      name: str(bg["name"]),
      description: str(bg["description"]),
    })),
    ...(statRules && { statRules }),
  };
}

function mapAmbient(mood: string): string {
  const MAP: Record<string, string> = {
    tavern: "tavern",
    forest_day: "forest_day",
    forest_night: "forest_night",
    dungeon: "dungeon",
    ocean: "ocean",
    city_day: "city_day",
    city_night: "city_night",
    cave: "cave",
    throne_room: "throne_room",
    market: "market",
    forest: "forest_day",
    city: "city_day",
    night: "city_night",
    underground: "dungeon",
    sea: "ocean",
    // World-specific tracks
    desert: "desert",
    sand: "desert",
    wasteland: "desert",
    arid: "desert",
    space_station: "space_station",
    station: "space_station",
    starship: "space_station",
    spaceship: "space_station",
    "sci-fi": "space_station",
    scifi: "space_station",
    cyberpunk_rain: "cyberpunk_rain",
    cyberpunk: "cyberpunk_rain",
    rain: "cyberpunk_rain",
    neon: "cyberpunk_rain",
    cosmic_void: "cosmic_void",
    cosmic: "cosmic_void",
    void: "cosmic_void",
    eldritch: "cosmic_void",
    horror: "cosmic_void",
  };
  return MAP[mood.toLowerCase()] ?? "none";
}

export function buildSystemPromptFromBible(bible: ParsedGameBible): string {
  const locationList = bible.locations
    .map((l) => `- ${l.name}: ${l.shortDesc}`)
    .join("\n");
  const npcList = bible.npcs
    .map((n) => `- ${n.name} (${n.role}): ${n.personality.slice(0, 120)}`)
    .join("\n");
  const factionList = bible.factions
    .map((f) => `- ${f.name} [${f.disposition}]: ${f.description}`)
    .join("\n");
  const hooksText = bible.campaignHooks.map((h, i) => `${i + 1}. ${h}`).join("\n");

  const classList =
    bible.classes?.length > 0
      ? bible.classes.map((c) => `- ${c.name} (${c.role}): ${c.description}`).join("\n")
      : null;
  const backgroundList =
    bible.backgrounds?.length > 0
      ? bible.backgrounds.map((b) => `- ${b.name}: ${b.description}`).join("\n")
      : null;

  return [
    `WORLD: ${bible.worldName.toUpperCase()}`,
    `Genre: ${bible.genre} | Tone: ${bible.tone}`,
    "",
    bible.systemPromptCore,
    "",
    "Key Locations:",
    locationList,
    "",
    "Key NPCs:",
    npcList,
    "",
    factionList.length > 0 ? `Factions:\n${factionList}` : "",
    "",
    classList ? `Playable Classes:\n${classList}` : "",
    "",
    backgroundList ? `Character Backgrounds:\n${backgroundList}` : "",
    "",
    bible.rulesNotes ? `Game Rules & Mechanics:\n${bible.rulesNotes}` : "",
    "",
    `Campaign Hooks:\n${hooksText}`,
    "",
    `Opening Scenario:\n${bible.openingNarration}`,
  ]
    .filter((l) => l !== undefined && l !== "")
    .join("\n");
}

export async function createWorldFromBible(
  bible: ParsedGameBible,
  guestId: string,
  gameBibleId: string
): Promise<string> {
  // Unique IDs: a timestamp plus a random suffix, so re-uploads and
  // concurrent creates don't conflict
  const stamp = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const worldId = `world-${stamp}`;

  // A game starts at the world's first location by id, so the bible's
  // starting location goes first, and the index is zero-padded so the ids
  // sort in this order.
  const startKey = bible.startingLocation.trim().toLowerCase();
  const startIdx = bible.locations.findIndex((l) => l.name.trim().toLowerCase() === startKey);
  const locations =
    startIdx > 0
      ? [bible.locations[startIdx]!, ...bible.locations.filter((_, i) => i !== startIdx)]
      : bible.locations;
  const idWidth = Math.max(3, String(locations.length - 1).length);
  const locationIds = locations.map((_, i) => `loc-${stamp}-${String(i).padStart(idWidth, "0")}`);

  // Every location gets its own id; a name shared by several resolves to the
  // first of them.
  const locationIdByName = new Map<string, string>();
  locations.forEach((l, i) => {
    if (!locationIdByName.has(l.name)) locationIdByName.set(l.name, locationIds[i]!);
  });

  const imageUrl = await resolveWorldCoverImage(bible.worldName, bible.genre, bible.tone);

  await prisma.world.create({
    data: {
      id: worldId,
      name: bible.worldName,
      description: bible.synopsis,
      genre: bible.genre,
      tone: bible.tone,
      systemPrompt: buildSystemPromptFromBible(bible),
      isPrebuilt: false,
      isPublic: false,
      imageUrl,
      ownerId: guestId,
      gameBibleId,
      libraryItem: {
        create: {
          title: bible.worldName,
          description: bible.synopsis,
          genre: bible.genre,
          difficulty: "beginner",
          tags: [bible.genre, bible.tone].join(","),
          sortOrder: 100,
        },
      },
      locations: {
        create: locations.map((l, i) => ({
          id: locationIds[i]!,
          name: l.name,
          description: l.description,
          shortDesc: l.shortDesc,
          ambientSound: mapAmbient(l.ambientMood),
          connectedTo: JSON.stringify(
            l.connections.map((name) => locationIdByName.get(name) ?? name)
          ),
          properties: "{}",
        })),
      },
      npcs: {
        create: bible.npcs.map((n, i) => ({
          id: `npc-${stamp}-${i}`,
          name: n.name,
          role: n.role,
          personality: n.personality,
          voiceDescription: n.voiceDescription,
          relationship: "neutral" as const,
          isAlive: true,
          locationId: locationIdByName.get(n.homeLocation) ?? null,
          properties: "{}",
        })),
      },
    },
  });

  return worldId;
}
