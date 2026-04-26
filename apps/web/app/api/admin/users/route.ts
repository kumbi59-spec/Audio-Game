import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      createdAt: true,
      _count: { select: { worlds: true, sessions: true } },
    },
    take: 200,
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      tier: u.tier,
      createdAt: u.createdAt,
      worldCount: u._count.worlds,
      sessionCount: u._count.sessions,
    }))
  );
}
