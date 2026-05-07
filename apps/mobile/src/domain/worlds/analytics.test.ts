import { describe, expect, it } from "vitest";

/**
 * Pure helpers for the My Worlds analytics screen.
 * Network calls are integration-tested via E2E; these cover the
 * data-shaping logic that runs in the component.
 */

interface WorldAnalyticsSummary {
  worldId: string;
  sessionCount: number;
  totalTurns: number;
}

function mergeAnalytics(
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

function hasActivity(summary: WorldAnalyticsSummary): boolean {
  return summary.sessionCount > 0 || summary.totalTurns > 0;
}

describe("worlds analytics helpers", () => {
  it("merges analytics by worldId and fills zeros for missing", () => {
    const ids = ["w1", "w2", "w3"];
    const analytics: WorldAnalyticsSummary[] = [
      { worldId: "w1", sessionCount: 5, totalTurns: 42 },
    ];
    const merged = mergeAnalytics(ids, analytics);
    expect(merged.get("w1")).toEqual({ worldId: "w1", sessionCount: 5, totalTurns: 42 });
    expect(merged.get("w2")).toEqual({ worldId: "w2", sessionCount: 0, totalTurns: 0 });
    expect(merged.get("w3")).toEqual({ worldId: "w3", sessionCount: 0, totalTurns: 0 });
  });

  it("returns empty map for empty world list", () => {
    expect(mergeAnalytics([], []).size).toBe(0);
  });

  it("detects activity correctly", () => {
    expect(hasActivity({ worldId: "w1", sessionCount: 1, totalTurns: 0 })).toBe(true);
    expect(hasActivity({ worldId: "w1", sessionCount: 0, totalTurns: 10 })).toBe(true);
    expect(hasActivity({ worldId: "w1", sessionCount: 0, totalTurns: 0 })).toBe(false);
  });
});
