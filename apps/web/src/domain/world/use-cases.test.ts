import { describe, expect, it } from "vitest";
import {
  canPublishWorld,
  extractGenres,
  filterCreatorWorlds,
  filterWorldsByGenre,
  filterWorldsByTab,
  formatTurnCount,
  mergeWorldAnalytics,
  resolveGenre,
  sortWorldsByOrder,
  worldHasActivity,
} from "./use-cases";

describe("world domain use-cases", () => {
  it("filters creator worlds, excluding official", () => {
    const worlds = [
      { id: "1", kind: "official" },
      { id: "2", kind: "uploaded" },
      { id: "3", kind: "created" },
    ];
    const result = filterCreatorWorlds(worlds);
    expect(result.map((w) => w.id)).toEqual(["2", "3"]);
  });

  it("returns empty array when no creator worlds exist", () => {
    expect(filterCreatorWorlds([{ id: "1", kind: "official" }])).toHaveLength(0);
  });

  it("merges analytics by id, zero-filling missing entries", () => {
    const worlds = [{ id: "w1" }, { id: "w2" }, { id: "w3" }];
    const analytics = [{ worldId: "w1", sessionCount: 5, totalTurns: 42, uniquePlayers: 3 }];
    const merged = mergeWorldAnalytics(worlds, analytics);
    expect(merged[0]!.analytics).toEqual({ sessionCount: 5, totalTurns: 42, uniquePlayers: 3 });
    expect(merged[1]!.analytics).toEqual({ sessionCount: 0, totalTurns: 0, uniquePlayers: 0 });
    expect(merged[2]!.analytics).toEqual({ sessionCount: 0, totalTurns: 0, uniquePlayers: 0 });
  });

  it("detects world activity from analytics", () => {
    expect(worldHasActivity({ sessionCount: 1, totalTurns: 0, uniquePlayers: 0 })).toBe(true);
    expect(worldHasActivity({ sessionCount: 0, totalTurns: 5, uniquePlayers: 0 })).toBe(true);
    expect(worldHasActivity({ sessionCount: 0, totalTurns: 0, uniquePlayers: 0 })).toBe(false);
  });

  it("gates publishing by tier", () => {
    expect(canPublishWorld("creator")).toBe(true);
    expect(canPublishWorld("storyteller")).toBe(false);
    expect(canPublishWorld("free")).toBe(false);
  });

  it("formats turn counts with locale separators", () => {
    expect(formatTurnCount(1234)).toBe("1,234");
    expect(formatTurnCount(0)).toBe("0");
  });

  it("sortWorldsByOrder returns a new array in ascending order", () => {
    const worlds = [{ sortOrder: 3 }, { sortOrder: 1 }, { sortOrder: 2 }];
    const sorted = sortWorldsByOrder(worlds);
    expect(sorted.map((w) => w.sortOrder)).toEqual([1, 2, 3]);
    expect(sorted).not.toBe(worlds); // original is not mutated
  });

  it("filterWorldsByTab splits on isPrebuilt", () => {
    const worlds = [
      { isPrebuilt: true, name: "Official" },
      { isPrebuilt: false, name: "Community" },
    ];
    expect(filterWorldsByTab(worlds, "official").map((w) => w.name)).toEqual(["Official"]);
    expect(filterWorldsByTab(worlds, "community").map((w) => w.name)).toEqual(["Community"]);
  });

  it("extractGenres returns deduped non-empty genres", () => {
    const worlds = [
      { genre: "Fantasy" },
      { genre: "Fantasy" },
      { genre: "Sci-fi" },
      { genre: undefined },
    ];
    expect(extractGenres(worlds)).toEqual(["Fantasy", "Sci-fi"]);
  });

  it("filterWorldsByGenre returns all on 'All', filters otherwise", () => {
    const worlds = [{ genre: "Fantasy" }, { genre: "Sci-fi" }];
    expect(filterWorldsByGenre(worlds, "All")).toHaveLength(2);
    expect(filterWorldsByGenre(worlds, "Fantasy")).toEqual([{ genre: "Fantasy" }]);
  });

  it("resolveGenre uses customGenre only when genre is 'Other'", () => {
    expect(resolveGenre("Fantasy", "Ignored")).toBe("Fantasy");
    expect(resolveGenre("Other", "  Weird West  ")).toBe("Weird West");
    expect(resolveGenre("Other", "")).toBe("");
  });
});
