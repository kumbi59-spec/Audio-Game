import { describe, expect, it } from "vitest";
import { SUNKEN_BELL_BIBLE } from "@audio-rpg/shared";
import { MemoryCampaignStore } from "./memory.js";

describe("critical facts persistence", () => {
  it("dedupes by semantic key and preserves latest turn number for stronger duplicate", async () => {
    const store = new MemoryCampaignStore();
    await store.seedCampaign({
      campaignId: "c1",
      worldId: "sunken_bell",
      title: "t",
      bible: SUNKEN_BELL_BIBLE,
      state: {
        scene: { name: "S", summary: "" },
        turn_number: 1,
        character: { name: "hero", stats: {}, background: {} },
        inventory: [], quests: [], relationships: [], codex: [], achievements: [], flags: {},
      },
    });

    await store.persistCriticalFacts("c1", [
      { turnNumber: 2, text: "  Find the bell  ", kind: "quest", importance: 0.6, entityRefs: [" Bell "], sourceMutation: "quest.start" },
      { turnNumber: 3, text: "find   the bell", kind: "quest", importance: 0.9, entityRefs: ["bell"], sourceMutation: "quest.start" },
      { turnNumber: 4, text: "Meet Captain Vale", kind: "relationship", importance: 0.5, entityRefs: ["captain-vale"], sourceMutation: "relationship.adjust" },
    ]);

    const facts = await store.memoryStore().criticalFacts("c1", 10);
    expect(facts).toHaveLength(2);
    expect(facts[0]).toMatchObject({ turnNumber: 3, text: "find   the bell", importance: 0.9 });
    expect(facts[1]).toMatchObject({ turnNumber: 4, text: "Meet Captain Vale", importance: 0.5 });
  });

  it("trims to 200 by dropping lowest-importance oldest facts first", async () => {
    const store = new MemoryCampaignStore();
    await store.seedCampaign({
      campaignId: "c2",
      worldId: "sunken_bell",
      title: "t",
      bible: SUNKEN_BELL_BIBLE,
      state: {
        scene: { name: "S", summary: "" },
        turn_number: 1,
        character: { name: "hero", stats: {}, background: {} },
        inventory: [], quests: [], relationships: [], codex: [], achievements: [], flags: {},
      },
    });

    const facts = Array.from({ length: 205 }, (_, i) => ({
      turnNumber: i + 1,
      text: `fact-${i}`,
      kind: "plot" as const,
      importance: i < 5 ? 0 : 1,
      entityRefs: [],
      sourceMutation: "test",
    }));
    await store.persistCriticalFacts("c2", facts);
    const got = await store.memoryStore().criticalFacts("c2", 500);
    expect(got).toHaveLength(200);
    expect(got.some((f) => f.text === "fact-0")).toBe(false);
    expect(got.some((f) => f.text === "fact-4")).toBe(false);
    expect(got.some((f) => f.text === "fact-5")).toBe(true);
  });
});
