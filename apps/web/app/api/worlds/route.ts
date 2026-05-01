import { NextRequest, NextResponse } from "next/server";
import { listPublicWorlds, seedPrebuiltWorldsIfNeeded } from "@/lib/db/queries/worlds";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

function shapeWorld(w: Awaited<ReturnType<typeof listPublicWorlds>>[number]) {
  // For prebuilt worlds already in the DB, fall back to the static imageUrl
  // if the DB row was seeded before imageUrl was added to the upsert.
  const staticImageUrl = w.isPrebuilt
    ? (PREBUILT_WORLDS.find((p) => p.id === w.id)?.imageUrl ?? null)
    : null;

  return {
    id: w.id,
    name: w.name,
    description: w.description,
    genre: w.genre,
    tone: w.tone,
    isPrebuilt: w.isPrebuilt,
    imageUrl: w.imageUrl ?? staticImageUrl ?? null,
    difficulty: w.libraryItem?.difficulty ?? "beginner",
    tags: w.libraryItem?.tags.split(",").map((t) => t.trim()).filter(Boolean) ?? [w.genre, w.tone],
    sortOrder: w.libraryItem?.sortOrder ?? 100,
    author: w.isPrebuilt ? null : ((w as unknown as { owner?: { name?: string } }).owner?.name ?? "Adventurer"),
    publishedAt: w.libraryItem ? (w as unknown as { createdAt: Date }).createdAt : null,
  };
}

export async function GET(_req: NextRequest) {
  try {
    const worlds = await listPublicWorlds();

    // Auto-seed prebuilt worlds on first deploy when the DB is empty
    if (!worlds.some((w) => w.isPrebuilt)) {
      await seedPrebuiltWorldsIfNeeded();
      const seeded = await listPublicWorlds();
      return NextResponse.json(seeded.map(shapeWorld));
    }

    return NextResponse.json(worlds.map(shapeWorld));
  } catch {
    return NextResponse.json(
      PREBUILT_WORLDS.map((w, i) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        genre: w.genre,
        tone: w.tone,
        isPrebuilt: true,
        imageUrl: w.imageUrl ?? null,
        difficulty: "beginner",
        tags: [w.genre, w.tone],
        sortOrder: i,
        author: null,
        publishedAt: null,
      }))
    );
  }
}
