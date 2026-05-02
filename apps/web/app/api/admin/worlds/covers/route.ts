import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { generateAICoverArt } from "@/lib/ai/cover-art-gen";

export const dynamic = "force-dynamic";

function providerDiagnostic(): string | null {
  const provider = process.env["IMAGE_GEN_PROVIDER"]?.toLowerCase();
  if (!provider) return "IMAGE_GEN_PROVIDER env var is not set";
  if (provider === "bfl" && !process.env["BFL_API_KEY"]) return "BFL_API_KEY env var is not set";
  if (provider === "replicate" && !process.env["REPLICATE_API_TOKEN"]) return "REPLICATE_API_TOKEN env var is not set";
  return null;
}

// GET — list prebuilt worlds + provider config status
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const worlds = await prisma.world.findMany({
    where: { isPrebuilt: true },
    select: { id: true, name: true, genre: true, tone: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ worlds, configError: providerDiagnostic() });
}

// POST { worldId } — generate cover for a single world (stays within Render's 30s limit)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configError = providerDiagnostic();
  if (configError) return NextResponse.json({ status: "failed", reason: configError }, { status: 400 });

  const { worldId } = (await req.json()) as { worldId?: string };
  if (!worldId) return NextResponse.json({ error: "worldId required" }, { status: 400 });

  const world = await prisma.world.findUnique({
    where: { id: worldId, isPrebuilt: true },
    select: { id: true, name: true, genre: true, tone: true },
  });
  if (!world) return NextResponse.json({ error: "World not found" }, { status: 404 });

  const imageUrl = await generateAICoverArt({
    worldName: world.name,
    genre: world.genre ?? "",
    tone: world.tone ?? "",
  });

  if (!imageUrl) {
    return NextResponse.json({ status: "failed", name: world.name, reason: "AI generation returned null — check server logs" });
  }

  await prisma.world.update({
    where: { id: world.id },
    data: { imageUrl },
    select: { id: true },
  });

  return NextResponse.json({ status: "ok", name: world.name });
}
