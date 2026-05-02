import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateAICoverArt } from "@/lib/ai/cover-art-gen";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // Require creator tier
  const tier = (session.user as { tier?: string }).tier ?? "free";
  if (tier !== "creator") {
    return NextResponse.json({ error: "Creator plan required to generate cover art" }, { status: 403 });
  }

  const { id } = await params;

  const world = await prisma.world.findUnique({
    where: { id },
    select: { id: true, name: true, genre: true, tone: true, ownerId: true, isPrebuilt: true },
  });

  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (world.isPrebuilt) return NextResponse.json({ error: "Use admin panel for official worlds" }, { status: 403 });
  if (world.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const imageUrl = await generateAICoverArt({
    worldName: world.name,
    genre: world.genre ?? "",
    tone: world.tone ?? "",
  });

  if (!imageUrl) {
    return NextResponse.json({ error: "Image generation failed — check server configuration" }, { status: 500 });
  }

  await prisma.world.update({
    where: { id: world.id },
    data: { imageUrl },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, imageUrl: `/api/worlds/${world.id}/image` });
}
