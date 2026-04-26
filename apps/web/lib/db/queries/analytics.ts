import { prisma } from "@/lib/db";

export interface WorldAnalytics {
  worldId: string;
  sessionCount: number;
  totalTurns: number;
  uniquePlayers: number;
}

export async function getWorldsAnalytics(worldIds: string[]): Promise<WorldAnalytics[]> {
  if (worldIds.length === 0) return [];

  const rows = await prisma.gameSession.groupBy({
    by: ["worldId"],
    where: { worldId: { in: worldIds } },
    _count: { id: true },
    _sum: { turnCount: true },
  });

  // Unique players requires a distinct sub-query
  const playerRows = await prisma.gameSession.findMany({
    where: { worldId: { in: worldIds } },
    select: { worldId: true, userId: true },
    distinct: ["worldId", "userId"],
  });

  const playerCountByWorld = playerRows.reduce<Record<string, Set<string>>>((acc, r) => {
    if (!acc[r.worldId]) acc[r.worldId] = new Set();
    acc[r.worldId]!.add(r.userId);
    return acc;
  }, {});

  return rows.map((r) => ({
    worldId: r.worldId,
    sessionCount: r._count.id,
    totalTurns: r._sum.turnCount ?? 0,
    uniquePlayers: playerCountByWorld[r.worldId]?.size ?? 0,
  }));
}
