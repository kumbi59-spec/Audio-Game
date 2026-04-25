import { prisma } from "@/lib/db";

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
    include: { locations: true, npcs: true, libraryItem: true },
  });
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
