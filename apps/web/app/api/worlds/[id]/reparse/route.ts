import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseGameBible, buildSystemPromptFromBible } from "@/lib/ai/bible-parser";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const world = await prisma.world.findUnique({
    where: { id },
    select: { ownerId: true, isPrebuilt: true, gameBibleId: true },
  });

  if (!world) return NextResponse.json({ error: "World not found." }, { status: 404 });
  if (world.isPrebuilt) return NextResponse.json({ error: "Prebuilt worlds cannot be re-parsed." }, { status: 400 });
  if (world.ownerId !== session.user.id) return NextResponse.json({ error: "Not your world." }, { status: 403 });
  if (!world.gameBibleId) return NextResponse.json({ error: "No game bible attached to this world." }, { status: 400 });

  const gameBible = await prisma.gameBible.findUnique({
    where: { id: world.gameBibleId },
    select: { rawText: true },
  });

  if (!gameBible?.rawText) {
    return NextResponse.json({ error: "Game bible text not found." }, { status: 404 });
  }

  const bible = await parseGameBible(gameBible.rawText);

  await prisma.$transaction([
    prisma.gameBible.update({
      where: { id: world.gameBibleId },
      data: { parsedData: JSON.stringify(bible) },
    }),
    prisma.world.update({
      where: { id },
      data: { systemPrompt: buildSystemPromptFromBible(bible) },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
