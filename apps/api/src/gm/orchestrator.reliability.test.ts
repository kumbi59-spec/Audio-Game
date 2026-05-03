import { describe, expect, it } from "vitest";
import { runTurn, type Session } from "./orchestrator.js";

const baseSession: Session = {
  campaignId: "c1",
  worldId: "w1",
  bible: { version: 1, title: "Test World", style_mode: "cinematic", tone: { content_rating: "teen", forbidden_topics: [] }, rules: { hard_constraints: [] }, entities: [], timeline: [], character_creation: { origins: [], classes: [], stats: [], starting_items: [] }, win_states: [], fail_states: [] },
  state: { scene: { name: "Prologue", summary: "" }, turn_number: 1, character: { name: "Hero", stats: {}, background: {} }, inventory: [], quests: [], relationships: [], codex: [], flags: {} },
  lastPresentedChoices: [{ id: "a", label: "A" }],
};

const deps = { memory: { recentTurns: async () => [], sceneSummaries: async () => [], searchTurns: async () => [], searchBible: async () => [] }, persistTurn: async () => undefined, persistState: async () => undefined };

describe("runTurn reliability", () => {
  it("returns error when retries are exhausted", async () => {
    await expect(runTurn(baseSession, { kind: "freeform", text: "look" }, { ...deps, generateTurn: async () => { throw new Error("provider_down"); } }, () => undefined)).rejects.toBeTruthy();
  });

  it("completes synthetic fast workload within budget envelope", async () => {
    const start = Date.now();
    for (let i = 0; i < 10; i += 1) {
      await runTurn({ ...baseSession, campaignId: `c${i}` }, { kind: "freeform", text: "go" }, { ...deps, generateTurn: async () => ({ narration: "ok", presented_choices: [{ id: "x", label: "x" }], accepts_freeform: true, state_mutations: [], sound_cues: [], narration_voice_plan: [], scene_ends: false }) }, () => undefined);
    }
    expect(Date.now() - start).toBeLessThan(4000);
  });
});
