import { prisma } from "@/lib/db";

export interface EngagementSeries {
  days: string[];           // ISO date strings, oldest → newest
  sessionsStarted: number[]; // sessions whose createdAt falls in each day
  playerTurns: number[];    // GameHistoryEntry rows with role="user" in each day
}

/**
 * Per-world daily engagement for the last `days` calendar days (UTC).
 * Both buckets are inclusive of the current day. Days with no activity get a 0.
 */
export async function getWorldsEngagementTrends(
  worldIds: string[],
  days = 30,
): Promise<Record<string, EngagementSeries>> {
  if (worldIds.length === 0) return {};

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const sessions = await prisma.gameSession.findMany({
    where: { worldId: { in: worldIds }, createdAt: { gte: since } },
    select: { id: true, worldId: true, createdAt: true },
  });

  const turns = sessions.length
    ? await prisma.gameHistoryEntry.findMany({
        where: {
          sessionId: { in: sessions.map((s) => s.id) },
          role: "user",
          createdAt: { gte: since },
        },
        select: { sessionId: true, createdAt: true },
      })
    : [];

  const sessionWorldById = new Map(sessions.map((s) => [s.id, s.worldId]));

  const result: Record<string, EngagementSeries> = {};
  for (const worldId of worldIds) {
    result[worldId] = {
      days: dayKeys,
      sessionsStarted: new Array(days).fill(0),
      playerTurns: new Array(days).fill(0),
    };
  }

  const dayIndex = (d: Date): number => {
    const k = new Date(d);
    k.setUTCHours(0, 0, 0, 0);
    const diffMs = k.getTime() - since.getTime();
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  };

  for (const s of sessions) {
    const series = result[s.worldId];
    if (!series) continue;
    const i = dayIndex(s.createdAt);
    if (i >= 0 && i < days) series.sessionsStarted[i] = (series.sessionsStarted[i] ?? 0) + 1;
  }

  for (const t of turns) {
    const wId = sessionWorldById.get(t.sessionId);
    if (!wId) continue;
    const series = result[wId];
    if (!series) continue;
    const i = dayIndex(t.createdAt);
    if (i >= 0 && i < days) series.playerTurns[i] = (series.playerTurns[i] ?? 0) + 1;
  }

  return result;
}
