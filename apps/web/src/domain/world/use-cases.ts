import type { Tier } from "@audio-rpg/shared";

export interface WorldSummaryItem {
  id: string;
  name: string;
  kind?: string;
  isPublic?: boolean;
  analytics?: {
    sessionCount: number;
    totalTurns: number;
    uniquePlayers: number;
  } | null;
}

export interface WorldAnalyticsSummary {
  sessionCount: number;
  totalTurns: number;
  uniquePlayers: number;
}

/**
 * Returns worlds the authenticated user created or uploaded, excluding
 * official prebuilt campaigns.
 */
export function filterCreatorWorlds<T extends { kind?: string }>(worlds: T[]): T[] {
  return worlds.filter((w) => w.kind === "uploaded" || w.kind === "created");
}

/**
 * Merges a list of analytics records into a world list by worldId.
 * Worlds without an analytics record get zeros.
 */
export function mergeWorldAnalytics<T extends { id: string }>(
  worlds: T[],
  analytics: Array<{ worldId: string } & WorldAnalyticsSummary>,
): Array<T & { analytics: WorldAnalyticsSummary }> {
  const byId = new Map(
    analytics.map(({ worldId: _id, ...rest }) => [_id, rest] as const),
  );
  return worlds.map((w) => ({
    ...w,
    analytics: byId.get(w.id) ?? { sessionCount: 0, totalTurns: 0, uniquePlayers: 0 },
  }));
}

/**
 * Returns true when a world has received at least one play session.
 */
export function worldHasActivity(analytics: WorldAnalyticsSummary): boolean {
  return analytics.sessionCount > 0 || analytics.totalTurns > 0;
}

/**
 * Whether the current tier allows publishing worlds publicly.
 */
export function canPublishWorld(tier: Tier): boolean {
  return tier === "creator";
}

/**
 * Formats total turn count for display (e.g. "1,234").
 */
export function formatTurnCount(n: number): string {
  return n.toLocaleString();
}
