import { describe, expect, it } from "vitest";
import type { CharacterData } from "@/types/character";
import {
  applyCharacterChanges,
  applyHpDelta,
  applyInventoryMutation,
  applyQuestMutation,
  applyStatDelta,
} from "./character-reducer";

const base: CharacterData = {
  id: "c1",
  name: "Mara",
  class: "warrior",
  backstory: "",
  stats: { hp: 10, maxHp: 20, strength: 12, dexterity: 10, intelligence: 10, charisma: 10, level: 1, experience: 0 },
  inventory: [{ id: "i1", name: "Rope", description: "", category: "misc", quantity: 1, properties: {} }],
  quests: [],
};

let n = 0;
const ids = (prefix: string) => `${prefix}-${++n}`;

describe("character reducer", () => {
  it("clamps HP between 0 and max", () => {
    expect(applyHpDelta(base, 50).stats.hp).toBe(20);
    expect(applyHpDelta(base, -50).stats.hp).toBe(0);
  });

  it("levels up across several thresholds from one XP grant", () => {
    const next = applyStatDelta(base, "experience", 450);
    // 100 → level 2 (even: INT/CHA), 400 → level 3 (odd: STR/DEX)
    expect(next.stats).toMatchObject({ level: 3, maxHp: 30, hp: 20, strength: 13, dexterity: 11, intelligence: 11, charisma: 11 });
  });

  it("tracks unknown stats as custom stats, never below zero", () => {
    expect(applyStatDelta(base, "sanity", -3).customStats).toEqual({ sanity: 0 });
    expect(applyStatDelta({ ...base, customStats: { mp: 5 } }, "mp", 2).customStats).toEqual({ mp: 7 });
  });

  it("stacks, adds and removes inventory by case-insensitive name", () => {
    let c = applyInventoryMutation(base, { op: "add", name: "rope", quantity: 2 }, ids);
    expect(c.inventory).toHaveLength(1);
    expect(c.inventory[0]!.quantity).toBe(3);
    c = applyInventoryMutation(c, { op: "add", name: "Lantern", quantity: 1, category: "misc" }, ids);
    expect(c.inventory.map((i) => i.name)).toEqual(["Rope", "Lantern"]);
    c = applyInventoryMutation(c, { op: "remove", name: "ROPE", quantity: 5 }, ids);
    expect(c.inventory.map((i) => i.name)).toEqual(["Lantern"]);
  });

  it("starts, updates and completes quests without duplicates", () => {
    let c = applyQuestMutation(base, { op: "start", title: "Find the Bell", objectives: ["Reach the chapel", "Ring it"] }, ids);
    c = applyQuestMutation(c, { op: "start", title: "find the bell" }, ids);
    expect(c.quests).toHaveLength(1);
    c = applyQuestMutation(c, { op: "update", title: "Find the Bell", objective: "Reach the chapel", done: true }, ids);
    expect(c.quests[0]!.objectives.map((o) => o.completed)).toEqual([true, false]);
    c = applyQuestMutation(c, { op: "complete", title: "Find the Bell" }, ids);
    expect(c.quests[0]!.status).toBe("completed");
  });

  it("applies a whole turn of GM changes and skips malformed entries", () => {
    const next = applyCharacterChanges(
      base,
      {
        hp: -4,
        statDeltas: { experience: 120, charisma: "lots" },
        inventoryChanges: [{ op: "add", name: "Key", quantity: 1 }, { op: "steal", name: "Gold" }, { op: "add" }],
        questChanges: [{ op: "start", title: "Escape" }, { op: "start" }],
        flags: { ignored: true },
      },
      ids,
    );
    expect(next.stats.hp).toBe(11); // 10 - 4, then +5 from levelling to 2
    expect(next.stats.level).toBe(2);
    expect(next.stats.charisma).toBe(11);
    expect(next.inventory.map((i) => i.name)).toEqual(["Rope", "Key"]);
    expect(next.quests.map((q) => q.title)).toEqual(["Escape"]);
  });

  it("treats a missing or bad quantity as one", () => {
    const c = applyInventoryMutation(base, { op: "add", name: "Coin", quantity: Number.NaN }, ids);
    expect(c.inventory.find((i) => i.name === "Coin")!.quantity).toBe(1);
  });
});
