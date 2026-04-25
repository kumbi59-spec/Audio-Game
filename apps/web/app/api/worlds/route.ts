import { NextResponse } from "next/server";
import { listPrebuiltWorlds } from "@/lib/db/queries/worlds";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

export async function GET() {
  try {
    const dbWorlds = await listPrebuiltWorlds();

    if (dbWorlds.length > 0) {
      return NextResponse.json(
        dbWorlds.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          genre: w.genre,
          tone: w.tone,
          difficulty: w.libraryItem?.difficulty ?? "beginner",
          tags: w.libraryItem?.tags.split(",") ?? [w.genre, w.tone],
          sortOrder: w.libraryItem?.sortOrder ?? 0,
        }))
      );
    }
  } catch {
    // DB not available — fall through to static data
  }

  // Fallback: static world list (works without a seeded DB)
  return NextResponse.json(
    PREBUILT_WORLDS.map((w, i) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      genre: w.genre,
      tone: w.tone,
      difficulty: "beginner",
      tags: [w.genre, w.tone],
      sortOrder: i,
    }))
  );
}
