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
