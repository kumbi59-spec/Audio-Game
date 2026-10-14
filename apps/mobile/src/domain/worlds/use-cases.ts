export interface WorldAnalyticsSummary {
  worldId: string;
  sessionCount: number;
  totalTurns: number;
}

/**
 * Merges a list of analytics records into a map keyed by worldId.
 * Worlds without a record receive zero counts.
 */
export function mergeAnalytics(
  worldIds: string[],
  analytics: WorldAnalyticsSummary[],
): Map<string, WorldAnalyticsSummary> {
  const byId = new Map(analytics.map((a) => [a.worldId, a]));
  const result = new Map<string, WorldAnalyticsSummary>();
  for (const id of worldIds) {
    result.set(id, byId.get(id) ?? { worldId: id, sessionCount: 0, totalTurns: 0 });
  }
  return result;
}

/**
 * Returns true when a world has at least one session or turn recorded.
 */
export function hasActivity(summary: WorldAnalyticsSummary): boolean {
  return summary.sessionCount > 0 || summary.totalTurns > 0;
}

/** The API's `/worlds/analytics` accepts at most this many ids per call. */
export const MAX_ANALYTICS_IDS_PER_REQUEST = 50;

/** Splits ids into consecutive chunks of at most `size`. */
export function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}
