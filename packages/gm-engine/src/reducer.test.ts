import { describe, expect, it } from "vitest";
import type { CampaignState } from "@audio-rpg/shared";
import { applyMutation, applyMutations } from "./reducer.js";

function baseState(): CampaignState {
  return {
    scene: { name: "Prologue", summary: "" },
    turn_number: 1,
    character: { name: "Rue", stats: {}, background: {} },
    inventory: [],
    quests: [],
    relationships: [],
    codex: [],
    flags: {},
  };
}

describe("reducer", () => {
  it("adds and stacks inventory items", () => {
    let s = baseState();
    s = applyMutation(s, { op: "inventory.add", item: "torch", quantity: 1 });
    s = applyMutation(s, { op: "inventory.add", item: "Torch", quantity: 2 });
    expect(s.inventory).toEqual([
      expect.objectContaining({ name: "torch", quantity: 3 }),
    ]);
  });

  it("removes items and prunes empty rows", () => {
    let s = baseState();
    s = applyMutation(s, { op: "inventory.add", item: "coin", quantity: 5 });
    s = applyMutation(s, { op: "inventory.remove", item: "coin", quantity: 5 });
    expect(s.inventory).toEqual([]);
  });

  it("adjusts relationships and tracks last interaction turn", () => {
    let s = baseState();
    s.turn_number = 7;
    s = applyMutation(s, {
      op: "relationship.adjust",
      npc: "Kael",
      delta: -2,
      note: "betrayed",
    });
    expect(s.relationships[0]).toMatchObject({
      npc: "Kael",
      standing: -2,
      last_interaction_turn: 7,
      notes: "betrayed",
    });
  });

  it("starts, updates, and completes quests", () => {
    let s = baseState();
    s = applyMutations(s, [
      {
        op: "quest.start",
        name: "Find the bell",
        objectives: ["Reach the tower", "Ring at dusk"],
      },
      {
        op: "quest.update",
        name: "Find the bell",
        objective: "Reach the tower",
        done: true,
      },
      { op: "quest.complete", name: "Find the bell" },
    ]);
    expect(s.quests[0]?.status).toBe("complete");
    expect(s.quests[0]?.objectives[0]?.done).toBe(true);
  });

  it("applies flag and codex mutations idempotently", () => {
    let s = baseState();
    s = applyMutation(s, { op: "flag.set", key: "saw_ghost", value: true });
    s = applyMutation(s, {
      op: "codex.unlock",
      key: "kael",
      title: "Kael",
      body: "A wary swordsman.",
    });
    s = applyMutation(s, {
      op: "codex.unlock",
      key: "kael",
      title: "Kael",
      body: "Duplicate write should be a no-op.",
    });
    expect(s.flags["saw_ghost"]).toBe(true);
    expect(s.codex).toHaveLength(1);
  });
});
