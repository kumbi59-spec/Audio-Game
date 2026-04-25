import { PrismaClient } from "@prisma/client";
import { PREBUILT_WORLDS } from "../lib/worlds/shattered-reaches";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding prebuilt worlds…");

  for (const world of PREBUILT_WORLDS) {
    const existing = await prisma.world.findUnique({ where: { id: world.id } });
    if (existing) {
      console.log(`  Skipping ${world.name} (already exists)`);
      continue;
    }

    await prisma.world.create({
      data: {
        id: world.id,
        name: world.name,
        description: world.description,
        genre: world.genre,
        tone: world.tone,
        systemPrompt: world.systemPrompt,
        isPrebuilt: world.isPrebuilt,
        isPublic: true,
        libraryItem: {
          create: {
            title: world.name,
            description: world.description,
            genre: world.genre,
            difficulty: "beginner",
            tags: [world.genre, world.tone].join(","),
            sortOrder: PREBUILT_WORLDS.indexOf(world),
          },
        },
        locations: {
          create: world.locations.map((l) => ({
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
          create: world.npcs.map((n) => ({
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
    });

    console.log(`  Seeded: ${world.name}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
