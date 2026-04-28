import { NextRequest, NextResponse } from "next/server";
import { listPublicWorlds } from "@/lib/db/queries/worlds";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

function shapeWorld(w: Awaited<ReturnType<typeof listPublicWorlds>>[number]) {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    genre: w.genre,
    tone: w.tone,
    isPrebuilt: w.isPrebuilt,
    imageUrl: w.imageUrl ?? null,
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
