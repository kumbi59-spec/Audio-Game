import { afterEach, describe, expect, it, vi } from "vitest";
import { SUNKEN_BELL_BIBLE } from "@audio-rpg/shared";
import { MemoryCampaignStore } from "./memory.js";

const baseState = {
  scene: { name: "S", summary: "" },
  turn_number: 0,
  character: { name: "hero", stats: {}, background: {} },
  inventory: [],
  quests: [],
  relationships: [],
  codex: [],
  achievements: [],
  flags: {},
};

async function seed(store: MemoryCampaignStore, campaignId: string, worldId = "sunken_bell"): Promise<void> {
  await store.seedCampaign({ campaignId, worldId, title: campaignId, bible: SUNKEN_BELL_BIBLE, state: baseState });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("memory campaign store", () => {
  it("returns only the summary fields from getCampaignSummary", async () => {
    const store = new MemoryCampaignStore();
    await seed(store, "c1");
    await store.persistSceneSummary("c1", { sceneNumber: 1, summary: "s", keyEvents: [] });
    await store.persistCriticalFacts("c1", [
      { turnNumber: 1, text: "QUEST_START|Bell", kind: "quest", importance: 0.8, entityRefs: [], sourceMutation: "quest.start" },
    ]);

    const summary = await store.getCampaignSummary("c1");
    expect(Object.keys(summary ?? {}).sort()).toEqual(
      ["campaignId", "createdAt", "sceneName", "state", "title", "turnNumber", "worldId"],
    );
  });

  it("lists the most recently played campaign first", async () => {
    vi.useFakeTimers();
    const store = new MemoryCampaignStore();
    vi.setSystemTime(1_000);
    await seed(store, "older");
    vi.setSystemTime(2_000);
    await seed(store, "newer");
    vi.setSystemTime(3_000);
    await store.persistState("older", { ...baseState, turn_number: 1 });

    const campaigns = await store.listCampaigns();
    expect(campaigns.map((c) => c.campaignId)).toEqual(["older", "newer"]);
  });

  it("counts sessions and GM turns per world", async () => {
    const store = new MemoryCampaignStore();
    await seed(store, "a");
    await seed(store, "b");
    await store.persistState("a", { ...baseState, turn_number: 3 });
    await store.persistState("b", { ...baseState, turn_number: 2 });

    await expect(store.getWorldAnalytics(["sunken_bell", "other"])).resolves.toEqual([
      { worldId: "sunken_bell", sessionCount: 2, totalTurns: 5 },
      { worldId: "other", sessionCount: 0, totalTurns: 0 },
    ]);
  });
});
