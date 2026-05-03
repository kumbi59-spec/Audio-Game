import { describe, expect, it } from "vitest";
import { normalizeChoiceList, selectChoice } from "./use-cases";

describe("game domain use-cases", () => {
  it("normalizes choice labels", () => {
    expect(selectChoice("  Open   the door \n")).toBe("Open the door");
  });

  it("removes blank and duplicate choices after normalization", () => {
    expect(normalizeChoiceList([" Attack", "", "Attack", "  Talk   "])).toEqual([
      "Attack",
      "Talk",
    ]);
  });
});
