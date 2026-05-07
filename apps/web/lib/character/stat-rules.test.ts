import { describe, expect, it } from "vitest";
import {
  OFFICIAL_DEFAULT_STAT_RULES,
  classPointPool,
  parseStatRulesFromNotes,
  resolveStatRules,
} from "./stat-rules";

describe("parseStatRulesFromNotes", () => {
  it("returns null when notes are absent or empty", () => {
    expect(parseStatRulesFromNotes(undefined)).toBeNull();
    expect(parseStatRulesFromNotes("")).toBeNull();
    expect(parseStatRulesFromNotes("Combat is gritty. No magic.")).toBeNull();
  });

  it("extracts a per-stat cap", () => {
    expect(parseStatRulesFromNotes("Stat cap: 5 per stat.")).toEqual({ perStatMax: 5 });
    expect(parseStatRulesFromNotes("Maximum stat 7.")).toEqual({ perStatMax: 7 });
  });

  it("extracts a per-stat minimum", () => {
    expect(parseStatRulesFromNotes("Minimum stat: 1.")).toEqual({ perStatMin: 1 });
  });

  it("extracts a total point pool", () => {
    expect(parseStatRulesFromNotes("Stat point pool: 30")).toEqual({ totalPointPool: 30 });
    expect(parseStatRulesFromNotes("Total stat points: 24")).toEqual({ totalPointPool: 24 });
  });

  it("combines multiple rules from one block", () => {
    const out = parseStatRulesFromNotes(
      "Each stat ranges 1–5. Stat cap: 5. Stat min 1. Stat point pool: 12.",
    );
    expect(out).toEqual({ perStatMax: 5, perStatMin: 1, totalPointPool: 12 });
  });

  it("clamps absurd values into a sane range", () => {
    expect(parseStatRulesFromNotes("Stat cap: 9999")).toEqual({ perStatMax: 100 });
  });
});

describe("resolveStatRules", () => {
  it("returns the official default for prebuilt worlds when no class is involved", () => {
    expect(resolveStatRules({ isPrebuilt: true })).toEqual(OFFICIAL_DEFAULT_STAT_RULES);
  });

  it("sizes the pool to the chosen class for class-defining worlds", () => {
    const rules = resolveStatRules({
      isPrebuilt: false,
      worldDefinesClasses: true,
      characterClass: "warrior",
    });
    expect(rules.totalPointPool).toBe(classPointPool("warrior"));
    expect(rules.perStatMax).toBe(OFFICIAL_DEFAULT_STAT_RULES.perStatMax);
  });

  it("layers bible-declared limits on top of the official defaults", () => {
    const rules = resolveStatRules({
      isPrebuilt: false,
      rulesNotes: "Stat cap: 12. Stat point pool: 30.",
    });
    expect(rules.perStatMin).toBe(OFFICIAL_DEFAULT_STAT_RULES.perStatMin);
    expect(rules.perStatMax).toBe(12);
    expect(rules.totalPointPool).toBe(30);
  });

  it("clamps the inherited min when the bible's cap is below it", () => {
    const rules = resolveStatRules({
      isPrebuilt: false,
      rulesNotes: "Stat cap: 5. Stat point pool: 12.",
    });
    // Without a bible-declared min, the inherited min (6) would exceed the
    // bible-declared cap (5). Clamp it so the input is satisfiable.
    expect(rules.perStatMax).toBe(5);
    expect(rules.perStatMin).toBe(5);
    expect(rules.totalPointPool).toBe(12);
  });

  it("falls back to official rules when the bible omits caps", () => {
    const rules = resolveStatRules({
      isPrebuilt: false,
      rulesNotes: "Combat is exchange-based. No magic in this setting.",
    });
    expect(rules).toMatchObject(OFFICIAL_DEFAULT_STAT_RULES);
  });

  it("prefers structured statRules over text parsing", () => {
    const rules = resolveStatRules({
      isPrebuilt: false,
      rulesNotes: "Stat cap: 5. Stat point pool: 12.",
      statRules: { perStatMax: 8, totalPointPool: 30 },
    });
    expect(rules.perStatMax).toBe(8);
    expect(rules.totalPointPool).toBe(30);
  });
});
