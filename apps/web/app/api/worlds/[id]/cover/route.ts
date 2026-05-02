import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateAICoverArt } from "@/lib/ai/cover-art-gen";

export const dynamic = "force-dynamic";

function providerDiagnostic(): string | null {
  const provider = process.env["IMAGE_GEN_PROVIDER"]?.toLowerCase();
  if (!provider) return "Image generation is not configured on the server (IMAGE_GEN_PROVIDER missing). Ask the site admin to set IMAGE_GEN_PROVIDER and BFL_API_KEY.";
  if (provider === "bfl" && !process.env["BFL_API_KEY"]) return "Image generation key missing on server (BFL_API_KEY). Ask the site admin to set BFL_API_KEY.";
  if (provider === "replicate" && !process.env["REPLICATE_API_TOKEN"]) return "Image generation key missing on server (REPLICATE_API_TOKEN).";
  return null;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const tier = (session.user as { tier?: string }).tier ?? "free";
  if (tier !== "creator") {
    return NextResponse.json({ error: "Creator plan required to generate cover art" }, { status: 403 });
  }

  const configError = providerDiagnostic();
  if (configError) return NextResponse.json({ error: configError }, { status: 503 });

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
    return NextResponse.json({ error: "AI generation returned no image — check server logs for provider error" }, { status: 502 });
  }

  await prisma.world.update({
    where: { id: world.id },
    data: { imageUrl },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, imageUrl: `/api/worlds/${world.id}/image` });
}
