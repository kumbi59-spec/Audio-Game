import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { limitAuthoringRequest } from "@/lib/ai/usage-guard";
import { prisma } from "@/lib/db";
import { parseGameBible, buildSystemPromptFromBible } from "@/lib/ai/bible-parser";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = await limitAuthoringRequest(req, {
    id: session.user.id,
    isAdmin: (session.user as { isAdmin?: boolean }).isAdmin === true,
  });
  if (limited) return limited;

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

  let bible: Awaited<ReturnType<typeof parseGameBible>>;
  try {
    bible = await parseGameBible(gameBible.rawText);
  } catch (err) {
    console.error("[reparse] parse failed:", err);
    return NextResponse.json({ error: "Couldn't re-read the game bible. Try again in a moment." }, { status: 502 });
  }

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

  return NextResponse.json({
    ok: true,
    classCount: bible.classes?.length ?? 0,
    backgroundCount: bible.backgrounds?.length ?? 0,
    hasRules: !!bible.rulesNotes,
  });
}
