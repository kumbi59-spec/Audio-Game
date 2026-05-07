import { describe, expect, it } from "vitest";
import { mergeAnalytics, hasActivity } from "./use-cases";
import type { WorldAnalyticsSummary } from "./use-cases";

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
