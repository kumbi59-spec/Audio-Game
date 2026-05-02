import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { generateAICoverArt } from "@/lib/ai/cover-art-gen";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const worlds = await prisma.world.findMany({
    where: { isPrebuilt: true },
    select: { id: true, name: true, genre: true, tone: true, imageUrl: true },
    orderBy: { createdAt: "asc" },
  });

  const results: Array<{ id: string; name: string; status: "ok" | "skipped" | "failed"; imageUrl?: string }> = [];

  for (const world of worlds) {
    const imageUrl = await generateAICoverArt({
      worldName: world.name,
      genre: world.genre ?? "",
      tone: world.tone ?? "",
    });

    if (!imageUrl) {
      results.push({ id: world.id, name: world.name, status: "failed" });
      continue;
    }

    await prisma.world.update({
      where: { id: world.id },
      data: { imageUrl },
      select: { id: true },
    });

    results.push({ id: world.id, name: world.name, status: "ok", imageUrl: imageUrl.slice(0, 60) + "…" });
  }

  return NextResponse.json({ results });
}
