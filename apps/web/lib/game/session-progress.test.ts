import { describe, expect, it } from "vitest";
import {
  applySessionProgress,
  isAchievement,
  isCodexEntry,
  isRelationshipChange,
  mergeRelationship,
  type SessionProgress,
} from "./session-progress";

const empty: SessionProgress = { achievements: [], relationships: [], codex: [] };

describe("applySessionProgress", () => {
  it("adds achievements and codex entries once, stamped with the turn", () => {
    const changes = {
      achievementUnlocks: [{ key: "first_blood", title: "First Blood", description: "Won a fight" }],
      codexEntries: [{ key: "bell", title: "The Bell", body: "It rings at dusk." }],
    };
    const once = applySessionProgress(empty, changes, 4);
    const twice = applySessionProgress(once, changes, 9);
    expect(twice.achievements).toEqual([{ key: "first_blood", title: "First Blood", description: "Won a fight", unlockedAt: 4 }]);
    expect(twice.codex).toEqual([{ key: "bell", title: "The Bell", body: "It rings at dusk.", unlockedAt: 4 }]);
  });

  it("skips malformed GM output", () => {
    const next = applySessionProgress(
      empty,
      { achievementUnlocks: [null, { title: "no key" }], npcRelationshipChanges: [{ npcId: "x", standing: "high" }], codexEntries: "nope" },
      1,
    );
    expect(next).toEqual(empty);
  });
});

describe("mergeRelationship", () => {
  it("keeps earlier notes and gender when the GM leaves them out", () => {
    const first = mergeRelationship([], { npcId: "voss", name: "Captain Voss", standing: 10, notes: "Let us pass", gender: "male" }, 2);
    const second = mergeRelationship(first, { npcId: "voss", name: "Captain Voss", standing: 30 }, 5);
    expect(second).toEqual([
      { npcId: "voss", name: "Captain Voss", standing: 30, notes: "Let us pass", gender: "male", lastSeenTurn: 5 },
    ]);
  });

  it("clamps standing to -100..100", () => {
    expect(mergeRelationship([], { npcId: "a", name: "A", standing: 250 }, 1)[0]!.standing).toBe(100);
    expect(mergeRelationship([], { npcId: "a", name: "A", standing: -999 }, 1)[0]!.standing).toBe(-100);
  });
});

describe("GM progress entry guards", () => {
  // The play hook runs these over raw GM output before touching the store.
  it("reject null and malformed entries", () => {
    for (const bad of [null, undefined, 3, "x", {}, { key: "" }]) {
      expect(isAchievement(bad)).toBe(false);
      expect(isCodexEntry(bad)).toBe(false);
      expect(isRelationshipChange(bad)).toBe(false);
    }
    expect(isRelationshipChange({ npcId: "mara", name: "Mara", standing: Number.NaN })).toBe(false);
  });

  it("accept well-formed entries", () => {
    expect(isAchievement({ key: "first-blood", title: "First Blood" })).toBe(true);
    expect(isCodexEntry({ key: "bell", title: "The Bell", body: "It rings." })).toBe(true);
    expect(isRelationshipChange({ npcId: "mara", name: "Mara", standing: 10 })).toBe(true);
  });
});
