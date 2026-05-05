import { describe, expect, it, vi } from "vitest";
import { buildMemoryBundle, type MemoryStore } from "./memory.js";

function makeStore(): MemoryStore {
  return {
    recentTurns: vi.fn(async (_campaignId: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({ turnNumber: i + 1, role: "player" as const, text: `recent-${i}` })),
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
  };
}

describe("buildMemoryBundle", () => {
  it("uses early-game mix with fewer historical turns and more lore", async () => {
    const store = makeStore();

    const bundle = await buildMemoryBundle(store, {
      campaignId: "c1",
      worldId: "w1",
      query: "hello",
      turnCount: 3,
    });

    expect(bundle.recent).toHaveLength(4);
    expect(bundle.retrieved).toHaveLength(2);
    expect(bundle.bibleHits).toHaveLength(7);
    expect(bundle.scenes).toHaveLength(1);
  });

  it("uses late-game mix with more retrieved turns and scene summaries", async () => {
    const store = makeStore();

    const bundle = await buildMemoryBundle(store, {
      campaignId: "c2",
      worldId: "w2",
      query: "later",
      turnCount: 30,
    });

    expect(bundle.recent).toHaveLength(8);
    expect(bundle.retrieved).toHaveLength(5);
    expect(bundle.bibleHits).toHaveLength(3);
    expect(bundle.scenes).toHaveLength(3);
  });


  it("omits retrieved turns that are already present in recent turns", async () => {
    const store = makeStore();

    vi.mocked(store.recentTurns).mockResolvedValueOnce([
      { turnNumber: 8, role: "player", text: "recent-8" },
      { turnNumber: 9, role: "gm", text: "overlap" },
      { turnNumber: 10, role: "player", text: "recent-10" },
    ]);
    vi.mocked(store.searchTurns).mockResolvedValueOnce([
      { turnNumber: 9, role: "gm", text: "overlap" },
      { turnNumber: 7, role: "gm", text: "retrieved-7" },
    ]);

    const bundle = await buildMemoryBundle(store, {
      campaignId: "c4",
      worldId: "w4",
      query: "overlap",
      turnCount: 10,
    });

    expect(bundle.retrieved).toEqual([{ turnNumber: 7, role: "gm", text: "retrieved-7" }]);
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
      },
    });

    expect(bundle.recent).toHaveLength(6);
    expect(bundle.retrieved).toHaveLength(3);
    expect(bundle.bibleHits).toHaveLength(1);
    expect(bundle.scenes).toHaveLength(1);
  });
});
