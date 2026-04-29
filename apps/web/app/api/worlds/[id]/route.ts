import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorldById, deleteWorld } from "@/lib/db/queries/worlds";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const prebuilt = PREBUILT_WORLDS.find((w) => w.id === id);
  if (prebuilt) return NextResponse.json(prebuilt);

  const world = await getWorldById(id);
  if (!world) return NextResponse.json({ error: "World not found." }, { status: 404 });

  const session = await auth();
  const requesterId = session?.user?.id ?? null;
  const canPlay = world.isPublic || (requesterId && world.ownerId === requesterId);
  if (!canPlay) {
    return NextResponse.json({ error: "Not allowed to play this world." }, { status: 403 });
  }

  // Extract mechanics from the game bible's parsed data (uploaded worlds only)
  let classes: Array<{ name: string; description: string }> | undefined;
  let backgrounds: Array<{ name: string; description: string }> | undefined;
  let rulesNotes: string | undefined;
  if (world.gameBible?.parsedData) {
    try {
      const bible = JSON.parse(world.gameBible.parsedData) as {
        classes?: Array<{ name: string; description: string }>;
        backgrounds?: Array<{ name: string; description: string }>;
        rulesNotes?: string;
      };
      if (bible.classes?.length) classes = bible.classes;
      if (bible.backgrounds?.length) backgrounds = bible.backgrounds;
      if (bible.rulesNotes) rulesNotes = bible.rulesNotes;
    } catch {
      // parsedData malformed — skip mechanics
    }
  }

  return NextResponse.json({
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
      relationship: npc.relationship,
      isAlive: npc.isAlive,
      locationId: npc.locationId,
    })),
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await deleteWorld(id, session.user.id);
  if (!result.ok) {
    const status = result.error === "World not found." ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }
  return new NextResponse(null, { status: 204 });
}
