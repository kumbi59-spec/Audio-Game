import { describe, expect, it } from "vitest";
import { SUNKEN_BELL_BIBLE } from "@audio-rpg/shared";
import { MemoryCampaignStore } from "./memory.js";

const seedState = {
  scene: { name: "S", summary: "" },
  turn_number: 1,
  character: { name: "hero", stats: {}, background: {} },
  inventory: [], quests: [], relationships: [], codex: [], achievements: [], flags: {},
};

async function seededStore(campaignId: string): Promise<MemoryCampaignStore> {
  const store = new MemoryCampaignStore();
  await store.seedCampaign({ campaignId, worldId: "sunken_bell", title: "t", bible: SUNKEN_BELL_BIBLE, state: seedState });
  return store;
}

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

  it("returns the top n by importance in story order and skips the skill-check roll", async () => {
    const store = await seededStore("c3");
    await store.persistCriticalFacts("c3", [
      { turnNumber: 1, text: "QUEST_COMPLETE|Find the bell", kind: "quest", importance: 0.97, entityRefs: ["Find the bell"], sourceMutation: "quest.complete" },
      { turnNumber: 2, text: "ITEM_GAIN|Torch|x1", kind: "item", importance: 0.56, entityRefs: ["Torch"], sourceMutation: "inventory.add" },
      { turnNumber: 3, text: "IRREVERSIBLE_LOSS|boss_dead_kraken", kind: "loss", importance: 0.95, entityRefs: ["boss_dead_kraken"], sourceMutation: "flag.set" },
      { turnNumber: 4, text: "ITEM_GAIN|Rope|x1", kind: "item", importance: 0.56, entityRefs: ["Rope"], sourceMutation: "inventory.add" },
      { turnNumber: 5, text: 'FLAG_SET|last_skill_check|{"roll":20}', kind: "flag", importance: 0.99, entityRefs: ["last_skill_check"], sourceMutation: "flag.set" },
      { turnNumber: 6, text: "ITEM_GAIN|Lamp|x1", kind: "item", importance: 0.56, entityRefs: ["Lamp"], sourceMutation: "inventory.add" },
    ]);

    const facts = await store.memoryStore().criticalFacts("c3", 3);
    // The two most important, then the newest of the tied item gains.
    expect(facts.map((f) => f.text)).toEqual([
      "QUEST_COMPLETE|Find the bell",
      "IRREVERSIBLE_LOSS|boss_dead_kraken",
      "ITEM_GAIN|Lamp|x1",
    ]);
  });

  it("supersedes condition, flag and oath facts on kind plus key, newest first", async () => {
    const store = await seededStore("c4");
    await store.persistCriticalFacts("c4", [
      { turnNumber: 2, text: "CONDITION_STATE|poisoned|true", kind: "condition", importance: 0.9, entityRefs: ["poisoned"], sourceMutation: "flag.set" },
      { turnNumber: 2, text: "FLAG_SET|poisoned|true", kind: "flag", importance: 0.6, entityRefs: ["poisoned"], sourceMutation: "flag.set" },
      { turnNumber: 3, text: "OATH_OR_DEBT_CREATED|oath_to_mara", kind: "oath", importance: 0.86, entityRefs: ["oath_to_mara"], sourceMutation: "flag.set" },
    ]);
    await store.persistCriticalFacts("c4", [
      { turnNumber: 7, text: "CONDITION_STATE|poisoned|false", kind: "condition", importance: 0.9, entityRefs: ["poisoned"], sourceMutation: "flag.set" },
      { turnNumber: 7, text: "FLAG_SET|poisoned|false", kind: "flag", importance: 0.6, entityRefs: ["poisoned"], sourceMutation: "flag.set" },
      { turnNumber: 8, text: "OATH_OR_DEBT_RESOLVED|oath_to_mara", kind: "oath", importance: 0.86, entityRefs: ["oath_to_mara"], sourceMutation: "flag.set" },
    ]);

    const facts = await store.memoryStore().criticalFacts("c4", 10);
    expect(facts.map((f) => f.text)).toEqual([
      "CONDITION_STATE|poisoned|false",
      "FLAG_SET|poisoned|false",
      "OATH_OR_DEBT_RESOLVED|oath_to_mara",
    ]);
  });

  it("keeps an older superseding fact over a stale replay", async () => {
    const store = await seededStore("c5");
    await store.persistCriticalFacts("c5", [
      { turnNumber: 9, text: "FLAG_SET|gate_open|true", kind: "flag", importance: 0.6, entityRefs: ["gate_open"], sourceMutation: "flag.set" },
    ]);
    await store.persistCriticalFacts("c5", [
      { turnNumber: 4, text: "FLAG_SET|gate_open|false", kind: "flag", importance: 0.6, entityRefs: ["gate_open"], sourceMutation: "flag.set" },
    ]);
    const facts = await store.memoryStore().criticalFacts("c5", 10);
    expect(facts.map((f) => f.text)).toEqual(["FLAG_SET|gate_open|true"]);
  });
});
