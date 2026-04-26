import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const worlds = await prisma.world.findMany({
    where: { isPrebuilt: false },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true, name: true } },
      _count: { select: { sessions: true } },
    },
    take: 200,
  });

  return NextResponse.json(
    worlds.map((w) => ({
      id: w.id,
      name: w.name,
      genre: w.genre,
      isPublic: w.isPublic,
      createdAt: w.createdAt,
      ownerEmail: w.owner?.email ?? null,
      ownerName: w.owner?.name ?? null,
      sessionCount: w._count.sessions,
    }))
  );
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { worldId, isPublic } = (await req.json()) as { worldId: string; isPublic: boolean };
  if (!worldId || typeof isPublic !== "boolean") {
    return NextResponse.json({ error: "worldId and isPublic required" }, { status: 400 });
  }

  await prisma.world.update({ where: { id: worldId }, data: { isPublic } });
  return NextResponse.json({ ok: true });
}
