import { prisma } from "@/lib/db";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

export async function seedPrebuiltWorldsIfNeeded(): Promise<void> {
  const count = await prisma.world.count({ where: { isPrebuilt: true } });
  if (count >= PREBUILT_WORLDS.length) return;

  for (const [i, world] of PREBUILT_WORLDS.entries()) {
    await upsertWorldFromStatic({
      id: world.id,
      name: world.name,
      description: world.description,
      genre: world.genre,
      tone: world.tone,
      systemPrompt: world.systemPrompt,
      isPrebuilt: world.isPrebuilt,
      locations: world.locations.map((l) => ({ ...l, ambientSound: l.ambientSound ?? undefined })),
      npcs: world.npcs.map((n) => ({ ...n, locationId: n.locationId ?? undefined })),
      libraryItem: {
        title: world.name,
        description: world.description,
        genre: world.genre,
        difficulty: "beginner",
        tags: [world.genre, world.tone].join(","),
        sortOrder: i,
      },
    });
  }
}

export async function listPrebuiltWorlds() {
  return prisma.world.findMany({
    where: { isPrebuilt: true },
    include: { libraryItem: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWorldById(id: string) {
  return prisma.world.findUnique({
    where: { id },
    include: {
      locations: true,
      npcs: true,
      libraryItem: true,
      gameBible: { select: { parsedData: true } },
    },
  });
}

export async function listPublicWorlds() {
  return prisma.world.findMany({
    where: { isPublic: true },
    include: { libraryItem: true, owner: { select: { id: true, name: true } } },
    orderBy: [{ isPrebuilt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getUserWorlds(userId: string) {
  return prisma.world.findMany({
    where: { ownerId: userId },
    include: { libraryItem: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function publishWorld(worldId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const world = await prisma.world.findUnique({
    where: { id: worldId },
    select: { ownerId: true, isPublic: true, name: true, description: true, genre: true, tone: true, libraryItem: true },
  });
  if (!world) return { ok: false, error: "World not found." };
  if (world.ownerId !== userId) return { ok: false, error: "You do not own this world." };

  await prisma.world.update({
    where: { id: worldId },
    data: {
      isPublic: true,
      libraryItem: world.libraryItem
        ? { update: { title: world.name, description: world.description } }
        : { create: { title: world.name, description: world.description, genre: world.genre, difficulty: "beginner", tags: [world.genre, world.tone].join(","), sortOrder: 100 } },
    },
  });
  return { ok: true };
}

export async function unpublishWorld(worldId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const world = await prisma.world.findUnique({ where: { id: worldId }, select: { ownerId: true } });
  if (!world) return { ok: false, error: "World not found." };
  if (world.ownerId !== userId) return { ok: false, error: "You do not own this world." };
  await prisma.world.update({ where: { id: worldId }, data: { isPublic: false } });
  return { ok: true };
}

export async function deleteWorld(worldId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const world = await prisma.world.findUnique({ where: { id: worldId }, select: { ownerId: true, isPrebuilt: true } });
  if (!world) return { ok: false, error: "World not found." };
  if (world.isPrebuilt) return { ok: false, error: "Prebuilt worlds cannot be deleted." };
  if (world.ownerId !== userId) return { ok: false, error: "You do not own this world." };

  // Delete in dependency order since the schema has no onDelete: Cascade on World relations
  const sessions = await prisma.gameSession.findMany({ where: { worldId }, select: { id: true } });
  const sessionIds = sessions.map((s) => s.id);
  await prisma.$transaction([
    prisma.gameHistoryEntry.deleteMany({ where: { sessionId: { in: sessionIds } } }),
    prisma.gameState.deleteMany({ where: { sessionId: { in: sessionIds } } }),
    prisma.gameSession.deleteMany({ where: { worldId } }),
    prisma.nPC.deleteMany({ where: { worldId } }),
    prisma.location.deleteMany({ where: { worldId } }),
    prisma.libraryItem.deleteMany({ where: { worldId } }),
    prisma.world.delete({ where: { id: worldId } }),
  ]);

  return { ok: true };
}

export async function upsertWorldFromStatic(data: {
  id: string;
  name: string;
  description: string;
  genre: string;
  tone: string;
  systemPrompt: string;
  isPrebuilt: boolean;
  libraryItem: {
    title: string;
    description: string;
    genre: string;
    difficulty: string;
    tags: string;
    sortOrder: number;
  };
  locations: Array<{
    id: string;
    name: string;
    description: string;
    shortDesc: string;
    ambientSound?: string;
    connectedTo: string[];
    properties: Record<string, unknown>;
  }>;
  npcs: Array<{
    id: string;
    name: string;
    role: string;
    personality: string;
    voiceDescription: string;
    relationship: string;
    isAlive: boolean;
    locationId?: string;
  }>;
}) {
  await prisma.world.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      name: data.name,
      description: data.description,
      genre: data.genre,
      tone: data.tone,
      systemPrompt: data.systemPrompt,
      isPrebuilt: data.isPrebuilt,
      isPublic: true,
      libraryItem: {
        create: data.libraryItem,
      },
      locations: {
        create: data.locations.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          shortDesc: l.shortDesc,
          ambientSound: l.ambientSound ?? null,
          connectedTo: JSON.stringify(l.connectedTo),
          properties: JSON.stringify(l.properties),
        })),
      },
      npcs: {
        create: data.npcs.map((n) => ({
          id: n.id,
          name: n.name,
          role: n.role,
          personality: n.personality,
          voiceDescription: n.voiceDescription,
          relationship: n.relationship,
          isAlive: n.isAlive,
          locationId: n.locationId ?? null,
          properties: "{}",
        })),
      },
    },
    update: {
      name: data.name,
      description: data.description,
      systemPrompt: data.systemPrompt,
    },
  });
}
