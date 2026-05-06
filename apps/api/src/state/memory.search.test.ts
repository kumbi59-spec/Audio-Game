import { describe, expect, it } from "vitest";
import { SUNKEN_BELL_BIBLE } from "@audio-rpg/shared";
import { MemoryCampaignStore } from "./memory.js";

const baseState = {
  scene: { name: "S", summary: "" },
  turn_number: 1,
  character: { name: "hero", stats: {}, background: {} },
  inventory: [],
  quests: [],
  relationships: [],
  codex: [],
  flags: {},
};

describe("memory searchTurns fallback", () => {
  it("retrieves non-empty results from both player and gm narration entries", async () => {
    const store = new MemoryCampaignStore();
    await store.seedCampaign({
      campaignId: "search-1",
      worldId: "sunken_bell",
      title: "Search Test",
      bible: SUNKEN_BELL_BIBLE,
      state: baseState,
    });
    await store.persistTurn({ campaignId: "search-1", turnNumber: 1, role: "player", text: "I inspect the brass lantern for clues." });
    await store.persistTurn({ campaignId: "search-1", turnNumber: 2, role: "gm", text: "The brass lantern reveals etchings of the drowned chapel." });

    const results = await store.memoryStore().searchTurns("search-1", "brass lantern clues", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.role === "player")).toBe(true);
    expect(results.some((r) => r.role === "gm")).toBe(true);
  });

  it("prefers higher lexical overlap and then deterministic tie-breakers", async () => {
    const store = new MemoryCampaignStore();
    await store.seedCampaign({
      campaignId: "search-2",
      worldId: "sunken_bell",
      title: "Search Rank Test",
      bible: SUNKEN_BELL_BIBLE,
      state: baseState,
    });
    await store.persistTurn({ campaignId: "search-2", turnNumber: 1, role: "player", text: "lantern map" });
    await store.persistTurn({ campaignId: "search-2", turnNumber: 2, role: "gm", text: "lantern map" });
    await store.persistTurn({ campaignId: "search-2", turnNumber: 3, role: "player", text: "lantern map chapel" });

    const results = await store.memoryStore().searchTurns("search-2", "lantern map chapel", 3);
    expect(results.map((r) => r.turnNumber)).toEqual([3, 2, 1]);
  });
});
