import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserWorlds } from "@/lib/db/queries/worlds";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const worlds = await getUserWorlds(session.user.id);
  return NextResponse.json(
    worlds.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      genre: w.genre,
      tone: w.tone,
      isPublic: w.isPublic,
      difficulty: w.libraryItem?.difficulty ?? "beginner",
      tags: w.libraryItem?.tags.split(",").map((t) => t.trim()).filter(Boolean) ?? [w.genre, w.tone],
    }))
  );
}
