import { describe, expect, it, vi } from "vitest";
import { buildMemoryBundle, formatFactForPrompt, type MemoryStore } from "./memory.js";

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
      Array.from({ length: n }, (_, i) => ({ turnNumber: i + 1, text: `fact-${i}`, importance: 0.8 })),
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

  it("reduces duplicated memories across adjacent turns", async () => {
    let searchCall = 0;
    const store: MemoryStore = {
      recentTurns: vi.fn(async () => [
        { turnNumber: 40, role: "player" as const, text: "We entered the obsidian vault." },
        { turnNumber: 41, role: "gm" as const, text: "The wardens still patrol silently." },
      ]),
      sceneSummaries: vi.fn(async () => [{ sceneNumber: 9, summary: "Vault breach", keyEvents: ["alarm muted"] }]),
      searchTurns: vi.fn(async () => {
        searchCall += 1;
        return [
          { turnNumber: 12, role: "gm" as const, text: "The obsidian vault was built by the Ash Court." },
          { turnNumber: 21, role: "player" as const, text: "A map marks a hidden tunnel under the vault." },
          {
            turnNumber: 43,
            role: "gm" as const,
            text:
              searchCall > 1
                ? "A fresh rune key appeared after the wards shifted."
                : "The wardens are blind to moonlight sigils.",
          },
        ];
      }),
      searchBible: vi.fn(async () => []),
      criticalFacts: vi.fn(async () => [{ turnNumber: 8, text: "Never speak the Warden's true name aloud." }]),
    };

    const first = await buildMemoryBundle(store, {
      campaignId: "adjacent",
      worldId: "w",
      query: "obsidian vault wardens",
      turnCount: 42,
    });

    const second = await buildMemoryBundle(store, {
      campaignId: "adjacent",
      worldId: "w",
      query: "obsidian vault wardens",
      turnCount: 43,
      selection: { injectedState: first.injectionState },
    });

    const firstTexts = new Set([
      ...first.recent.map((m) => m.text),
      ...first.retrieved.map((m) => m.text),
      ...first.scenes.map((m) => `${m.summary} ${m.keyEvents.join(" ")}`),
      ...first.criticalFacts.map((m) => m.text),
    ]);
    const secondTexts = [
      ...second.recent.map((m) => m.text),
      ...second.retrieved.map((m) => m.text),
      ...second.scenes.map((m) => `${m.summary} ${m.keyEvents.join(" ")}`),
      ...second.criticalFacts.map((m) => m.text),
    ];
    const overlap = secondTexts.filter((text) => firstTexts.has(text));

    expect(overlap.length).toBeLessThan(secondTexts.length);
    expect(second.retrieved.map((item) => item.text)).toContain("A fresh rune key appeared after the wards shifted.");
  });

  it("allows critical repeated facts when fallback override is set", async () => {
    const fact = { turnNumber: 5, text: "Companion Nyra is mortally allergic to silverleaf tonic." };
    const store: MemoryStore = {
      ...makeStore(),
      criticalFacts: vi.fn(async () => [fact]),
      searchBible: vi.fn(async () => []),
    };

    const first = await buildMemoryBundle(store, {
      campaignId: "critical",
      worldId: "w",
      query: "healing options",
      turnCount: 10,
    });
    const repeatedCritical = first.criticalFacts[0];
    expect(repeatedCritical).toBeDefined();
    if (!repeatedCritical) throw new Error("expected repeated critical fact");
    const overrideId = `critical:${repeatedCritical.turnNumber}:${(() => {
      let hash = 2166136261;
      for (let i = 0; i < repeatedCritical.text.length; i += 1) {
        hash ^= repeatedCritical.text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16);
    })()}`;

    const second = await buildMemoryBundle(store, {
      campaignId: "critical",
      worldId: "w",
      query: "healing options",
      turnCount: 11,
      selection: {
        injectedState: first.injectionState,
        criticalRepeatIds: [overrideId],
      },
    });

    expect(second.criticalFacts.map((item) => item.text)).toContain(fact.text);
  });

  it("selects a high-importance fact over a low-importance one at the same index position", async () => {
    const store: MemoryStore = {
      ...makeStore(),
      criticalFacts: vi.fn(async () => [
        { turnNumber: 1, text: "low-importance-fact", importance: 0.5 },
        { turnNumber: 2, text: "high-importance-fact", importance: 0.97 },
      ]),
      sceneSummaries: vi.fn(async () => [
        { sceneNumber: 1, summary: "intro", keyEvents: [] },
      ]),
      recentTurns: vi.fn(async () => [
        { turnNumber: 10, role: "player" as const, text: "recent turn" },
      ]),
      searchTurns: vi.fn(async () => []),
      searchBible: vi.fn(async () => []),
    };

    const bundle = await buildMemoryBundle(store, {
      campaignId: "importance-test",
      worldId: "w",
      query: "anything",
      turnCount: 15,
      budget: {
        earlyGameMaxTurn: 6,
        midGameMaxTurn: 20,
        estimatedPromptTokens: 0,
        maxPromptTokens: 8_000,
        recentTurns: { early: 1, mid: 1, late: 1 },
        retrievedTurns: { early: 0, mid: 0, late: 0 },
        sceneSummaries: { early: 1, mid: 1, late: 1 },
        bibleHits: { early: 0, mid: 0, late: 0 },
        tokenThresholds: { warning: 0.75, critical: 0.9 },
        reductionStep: 1,
        minimums: { recentTurns: 1, retrievedTurns: 0, sceneSummaries: 1, bibleHits: 0 },
        memoryScoring: {
          ...scoring,
          sourceMinimums: { criticalFacts: 1, sceneSummaries: 1 },
        },
      },
    });

    const criticalTexts = bundle.criticalFacts.map((f) => f.text);
    expect(criticalTexts).toContain("high-importance-fact");
  });
});

describe("formatFactForPrompt", () => {
  it("converts pipe codes to human-readable strings", () => {
    expect(formatFactForPrompt("QUEST_START|Find the Relic")).toBe('Quest started: "Find the Relic"');
    expect(formatFactForPrompt("QUEST_COMPLETE|Dragon Slain")).toBe('Quest completed: "Dragon Slain"');
    expect(formatFactForPrompt("QUEST_OBJECTIVE_DONE|Main Quest|Talk to Elder")).toBe(
      'Quest objective completed: "Talk to Elder" (quest: "Main Quest")',
    );
    expect(formatFactForPrompt("SCENE_CHANGE|The Docks")).toBe('Scene changed to: "The Docks"');
    expect(formatFactForPrompt("CODEX_UNLOCK|codex:gate|Gate Lore")).toBe('Codex unlocked: "Gate Lore"');
    expect(formatFactForPrompt("FLAG_SET|boss_dead|true")).toBe("Flag set: boss_dead = true");
    expect(formatFactForPrompt("CONDITION_STATE|injury_broken_arm|true")).toBe(
      "Active condition: injury_broken_arm (true)",
    );
    expect(formatFactForPrompt("IRREVERSIBLE_LOSS|boss_dead_kraken")).toBe("Permanent loss: boss_dead_kraken");
    expect(formatFactForPrompt("OATH_OR_DEBT_CREATED|oath_to_mara")).toBe("Active oath/debt: oath_to_mara");
    expect(formatFactForPrompt("OATH_OR_DEBT_RESOLVED|oath_to_mara")).toBe("Oath/debt resolved: oath_to_mara");
    expect(formatFactForPrompt("ITEM_GAIN|Iron Sword|x1")).toBe("Gained: Iron Sword ×1");
    expect(formatFactForPrompt("ITEM_LOSS|Magic Tome|x2")).toBe("Lost: Magic Tome ×2");
    expect(formatFactForPrompt("RELATIONSHIP_THRESHOLD|Vale|POS|5")).toBe(
      "Relationship with Vale improved significantly (+5)",
    );
    expect(formatFactForPrompt("RELATIONSHIP_THRESHOLD|Mara|NEG|8|betrayed at the summit")).toBe(
      "Relationship with Mara worsened significantly (−8); reason: betrayed at the summit",
    );
    expect(formatFactForPrompt("STAT_CHANGE|hp|LOSS|10")).toBe("Stat decreased: hp −10");
    expect(formatFactForPrompt("STAT_CHANGE|strength|GAIN|5")).toBe("Stat increased: strength +5");
  });

  it("returns the original text for unknown codes", () => {
    expect(formatFactForPrompt("UNKNOWN_CODE|some data")).toBe("UNKNOWN_CODE|some data");
    expect(formatFactForPrompt("plain text with no pipes")).toBe("plain text with no pipes");
  });
});
