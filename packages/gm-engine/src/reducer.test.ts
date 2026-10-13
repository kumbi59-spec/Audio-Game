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
    achievements: [],
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

  it("clamps relationship standing to [-100, 100]", () => {
    let s = baseState();
    // Large positive delta should not exceed 100
    s = applyMutation(s, { op: "relationship.adjust", npc: "Lyra", delta: 9999 });
    expect(s.relationships[0]?.standing).toBe(100);

    // Accumulating more positive deltas stays capped
    s = applyMutation(s, { op: "relationship.adjust", npc: "Lyra", delta: 50 });
    expect(s.relationships[0]?.standing).toBe(100);

    // Large negative delta should not go below -100
    s = applyMutation(s, { op: "relationship.adjust", npc: "Lyra", delta: -9999 });
    expect(s.relationships[0]?.standing).toBe(-100);

    // New NPC with large initial delta is also clamped
    s = applyMutation(s, { op: "relationship.adjust", npc: "Vorn", delta: -500 });
    expect(s.relationships.find((r) => r.npc === "Vorn")?.standing).toBe(-100);
  });

  it("crosses several levels from one large XP grant", () => {
    let s = baseState();
    s.character.stats = { level: 1, experience: 0, hp: 12, maxHp: 15 };
    // 900 XP reaches level 4 (level N+1 at N² × 100): three level-ups.
    s = applyMutation(s, { op: "stat.adjust", stat: "experience", delta: 900 });
    expect(s.character.stats).toMatchObject({
      level: 4,
      experience: 900,
      maxHp: 30,
      hp: 27,
      // Levels 3 (odd) and 2, 4 (even) from the default 10s.
      strength: 11,
      dexterity: 11,
      intelligence: 12,
      charisma: 12,
    });
  });

  it("defaults hp to the previous maxHp on a first level-up", () => {
    let s = baseState();
    s = applyMutation(s, { op: "stat.adjust", stat: "experience", delta: 100 });
    expect(s.character.stats).toMatchObject({ level: 2, maxHp: 15, hp: 15 });
  });

  it("ignores direct level deltas", () => {
    let s = baseState();
    s.character.stats = { level: 2, experience: 100 };
    s = applyMutation(s, { op: "stat.adjust", stat: "level", delta: 1 });
    expect(s.character.stats["level"]).toBe(2);
  });

  it("clamps hp to [0, maxHp]", () => {
    let s = baseState();
    s.character.stats = { hp: 8, maxHp: 10 };
    s = applyMutation(s, { op: "stat.adjust", stat: "hp", delta: 50 });
    expect(s.character.stats["hp"]).toBe(10);
    s = applyMutation(s, { op: "stat.adjust", stat: "hp", delta: -99 });
    expect(s.character.stats["hp"]).toBe(0);
    s = applyMutation(s, { op: "stat.adjust", stat: "hp", delta: 10 });
    s = applyMutation(s, { op: "stat.adjust", stat: "maxHp", delta: -4 });
    expect(s.character.stats).toMatchObject({ hp: 6, maxHp: 6 });

    // Without a maxHp stat only the floor applies.
    let t = baseState();
    t.character.stats = { hp: 3 };
    t = applyMutation(t, { op: "stat.adjust", stat: "hp", delta: -5 });
    expect(t.character.stats["hp"]).toBe(0);
  });

  it("resets the scene summary when the scene changes", () => {
    let s = baseState();
    s = applyMutation(s, { op: "scene.set", name: "Docks", summary: "Fog over the piers." });
    s = applyMutation(s, { op: "scene.set", name: "Docks" });
    expect(s.scene).toEqual({ name: "Docks", summary: "Fog over the piers." });
    s = applyMutation(s, { op: "scene.set", name: "Lighthouse" });
    expect(s.scene).toEqual({ name: "Lighthouse", summary: "" });
  });

  it("never keeps a zero-quantity inventory row", () => {
    let s = baseState();
    s.inventory = [{ name: "rope", quantity: 0, tags: [] }];
    s = applyMutation(s, { op: "inventory.add", item: "torch", quantity: 1 });
    expect(s.inventory).toEqual([expect.objectContaining({ name: "torch", quantity: 1 })]);
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
