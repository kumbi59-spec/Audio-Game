import { describe, expect, it, vi } from "vitest";
import { buildMemoryBundle, type MemoryStore } from "./memory.js";

function makeStore(): MemoryStore {
  return {
    recentTurns: vi.fn(async (_campaignId: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({ turnNumber: 20 + i, role: "player" as const, text: `recent-${i}` })),
    ),
    sceneSummaries: vi.fn(async () =>
      Array.from({ length: 5 }, (_, i) => ({ sceneNumber: i + 1, summary: `scene-${i}`, keyEvents: [] })),
    ),
    searchTurns: vi.fn(async (_campaignId: string, _query: string, k: number) =>
      Array.from({ length: k }, (_, i) => ({ turnNumber: i + 1, role: "gm" as const, text: `retrieved-${i}` })),
    ),
    searchBible: vi.fn(async (_worldId: string, _query: string, k: number) =>
      Array.from({ length: k }, (_, i) => ({ categories: ["lore"], text: `bible-${i}`, score: 1 })),
    ),
    criticalFacts: vi.fn(async (_campaignId: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({ turnNumber: i + 1, text: `fact-${i}` })),
    ),
  };
}

const scoring = {
  semanticWeight: 0.45,
  importanceWeight: 0.3,
  recencyWeight: 0.25,
  noveltyPenaltyWeight: 0.2,
  recencyHalfLifeTurns: 12,
  sourceMinimums: { criticalFacts: 2, sceneSummaries: 1 },
};

describe("buildMemoryBundle", () => {
  it("uses early-game mix with fewer historical turns and more lore", async () => {
    const store = makeStore();

    const bundle = await buildMemoryBundle(store, {
      campaignId: "c1",
      worldId: "w1",
      query: "hello",
      turnCount: 3,
    });

    expect(bundle.bibleHits).toHaveLength(7);
    expect(bundle.recent.length + bundle.retrieved.length + bundle.scenes.length + bundle.criticalFacts.length).toBe(7);
    expect(bundle.scenes.length).toBeGreaterThanOrEqual(1);
    expect(bundle.criticalFacts.length).toBeGreaterThanOrEqual(2);
  });

  it("uses late-game mix with more retrieved turns and scene summaries", async () => {
    const store = makeStore();

    const bundle = await buildMemoryBundle(store, {
      campaignId: "c2",
      worldId: "w2",
      query: "later",
      turnCount: 30,
    });

    expect(bundle.bibleHits).toHaveLength(3);
    expect(bundle.recent.length + bundle.retrieved.length + bundle.scenes.length + bundle.criticalFacts.length).toBe(16);
    expect(bundle.scenes.length).toBeGreaterThanOrEqual(1);
    expect(bundle.criticalFacts.length).toBeGreaterThanOrEqual(2);
  });

  it("clamps retrieval sizes when estimated prompt tokens are near budget", async () => {
    const store = makeStore();

    const bundle = await buildMemoryBundle(store, {
      campaignId: "c3",
      worldId: "w3",
      query: "big",
      turnCount: 30,
      budget: {
        earlyGameMaxTurn: 6,
        midGameMaxTurn: 20,
        estimatedPromptTokens: 9_500,
        maxPromptTokens: 10_000,
        recentTurns: { early: 4, mid: 6, late: 8 },
        retrievedTurns: { early: 2, mid: 4, late: 5 },
        sceneSummaries: { early: 1, mid: 2, late: 3 },
        bibleHits: { early: 7, mid: 5, late: 3 },
        tokenThresholds: { warning: 0.75, critical: 0.9 },
        reductionStep: 1,
        minimums: { recentTurns: 2, retrievedTurns: 1, sceneSummaries: 1, bibleHits: 1 },
        memoryScoring: scoring,
      },
    });

    expect(bundle.bibleHits).toHaveLength(1);
    expect(bundle.recent.length + bundle.retrieved.length + bundle.scenes.length + bundle.criticalFacts.length).toBe(10);
    expect(bundle.scenes.length).toBeGreaterThanOrEqual(1);
    expect(bundle.criticalFacts.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps pivotal historical facts under tight memory budget", async () => {
    const store: MemoryStore = {
      ...makeStore(),
      criticalFacts: vi.fn(async () => [
        { turnNumber: 2, text: "The moon shattered and magic flooded the world." },
        { turnNumber: 6, text: "King Aldren was assassinated at the peace summit." },
        { turnNumber: 12, text: "The treaty with the Iron Fleet binds all coastal cities." },
      ]),
      sceneSummaries: vi.fn(async () => [
        { sceneNumber: 1, summary: "Prologue in Ash Harbor", keyEvents: ["met the admiral"] },
        { sceneNumber: 2, summary: "Siege of Blackgate", keyEvents: ["city walls fell"] },
      ]),
      recentTurns: vi.fn(async () =>
        Array.from({ length: 8 }, (_, i) => ({ turnNumber: 30 + i, role: "player" as const, text: `small-${i}` })),
      ),
      searchTurns: vi.fn(async () =>
        Array.from({ length: 6 }, (_, i) => ({ turnNumber: 10 + i, role: "gm" as const, text: `retrieved-${i}` })),
      ),
    };

    const bundle = await buildMemoryBundle(store, {
      campaignId: "c4",
      worldId: "w4",
      query: "moon treaty consequences",
      turnCount: 40,
      budget: {
        earlyGameMaxTurn: 6,
        midGameMaxTurn: 20,
        estimatedPromptTokens: 9_800,
        maxPromptTokens: 10_000,
        recentTurns: { early: 2, mid: 2, late: 2 },
        retrievedTurns: { early: 2, mid: 2, late: 2 },
        sceneSummaries: { early: 1, mid: 1, late: 1 },
        bibleHits: { early: 2, mid: 2, late: 2 },
        tokenThresholds: { warning: 0.75, critical: 0.9 },
        reductionStep: 1,
        minimums: { recentTurns: 1, retrievedTurns: 1, sceneSummaries: 1, bibleHits: 1 },
        memoryScoring: scoring,
      },
    });

    expect(bundle.criticalFacts.length).toBeGreaterThanOrEqual(2);
    expect(bundle.scenes.length).toBeGreaterThanOrEqual(1);
    expect(bundle.criticalFacts.map((f) => f.text).join(" ")).toContain("moon shattered");
  });
});
