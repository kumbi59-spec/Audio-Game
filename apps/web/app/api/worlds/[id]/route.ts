import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorldById } from "@/lib/db/queries/worlds";
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

  return NextResponse.json({
    id: world.id,
    name: world.name,
    description: world.description,
    genre: world.genre,
    tone: world.tone,
    systemPrompt: world.systemPrompt,
    isPrebuilt: world.isPrebuilt,
    imageUrl: world.imageUrl,
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
