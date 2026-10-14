import { describe, expect, it } from "vitest";
import { continuityHeuristics } from "./continuity.js";

describe("continuityHeuristics", () => {
  it("matches snake_case anchor keys against spoken narration", () => {
    const result = continuityHeuristics(
      ["OATH_OR_DEBT_CREATED|oath_to_mara", "CONDITION_STATE|broken_arm|true"],
      "Your broken arm throbs as you remember your oath to Mara.",
    );
    expect(result.omissionFlags).toEqual([]);
  });

  it("skips conditions that have been cleared", () => {
    const result = continuityHeuristics(
      ["CONDITION_STATE|poisoned|false", "CONDITION_STATE|cursed|0"],
      "You feel healthy and fully recovered.",
    );
    expect(result).toEqual({ contradictionFlags: [], omissionFlags: [] });
  });

  it("still flags an active condition the narration contradicts", () => {
    const result = continuityHeuristics(["CONDITION_STATE|poisoned|true"], "You feel healthy and unharmed.");
    expect(result.contradictionFlags).toEqual(["condition_status:CONDITION_STATE|poisoned|true"]);
    expect(result.omissionFlags).toEqual(["anchor_unmentioned:CONDITION_STATE|poisoned|true"]);
  });
});
