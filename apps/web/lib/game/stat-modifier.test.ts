import { describe, expect, it } from "vitest";
import { findRollStat, rollableStats, statModifier, worldStatRange } from "./stat-modifier";

const hero = {
  stats: { hp: 20, maxHp: 20, strength: 14, dexterity: 8, intelligence: 10, charisma: 18, level: 2, experience: 120 },
  customStats: { Ninjutsu: 16, chakra: 40, chakraMax: 50, mp: 12, mpMax: 20 },
};

describe("statModifier", () => {
  it("uses the classic formula on the default scale", () => {
    expect(statModifier(10)).toBe(0);
    expect(statModifier(14)).toBe(2);
    expect(statModifier(18)).toBe(4);
    expect(statModifier(8)).toBe(-1);
  });

  it("always gives a higher stat at least as big a bonus", () => {
    for (const range of [undefined, { min: 1, max: 5 }, { min: 1, max: 10 }, { min: 0, max: 100 }]) {
      const mods = Array.from({ length: 101 }, (_, v) => statModifier(v, range));
      for (let i = 1; i < mods.length; i++) expect(mods[i]).toBeGreaterThanOrEqual(mods[i - 1]!);
    }
  });

  it("maps a world's own scale so its top stat is a bonus, not a penalty", () => {
    const small = { min: 1, max: 5 };
    expect(statModifier(5, small)).toBe(4);
    expect(statModifier(3, small)).toBe(1);
    expect(statModifier(1, small)).toBe(-2);
    // The old formula read a 5 out of 5 as -3.
    expect(Math.floor((5 - 10) / 2)).toBe(-3);
    expect(statModifier(100, { min: 0, max: 100 })).toBe(4);
  });
});

describe("worldStatRange", () => {
  it("falls back to the default scale, and reads a bible's caps", () => {
    expect(worldStatRange({ isPrebuilt: true })).toEqual({ min: 6, max: 18 });
    expect(worldStatRange({ isPrebuilt: false, statRules: { perStatMin: 1, perStatMax: 10 } })).toEqual({ min: 1, max: 10 });
  });

  it("starts a scale with only a low cap at 1", () => {
    expect(worldStatRange({ isPrebuilt: false, rulesNotes: "Stat cap: 5" })).toEqual({ min: 1, max: 5 });
  });
});

describe("rollableStats / findRollStat", () => {
  it("offers the core stats and the world's own, but not pools, HP or XP", () => {
    expect(rollableStats(hero).map((s) => s.name)).toEqual(["strength", "dexterity", "intelligence", "charisma", "Ninjutsu"]);
  });

  it("matches names loosely", () => {
    expect(findRollStat(hero, "DEX")).toEqual({ name: "dexterity", value: 8 });
    expect(findRollStat(hero, "Charisma")).toEqual({ name: "charisma", value: 18 });
    expect(findRollStat(hero, "ninjutsu")).toEqual({ name: "Ninjutsu", value: 16 });
    expect(findRollStat(hero, "chakra")).toBeNull();
    expect(findRollStat(hero, "luck")).toBeNull();
  });
});
