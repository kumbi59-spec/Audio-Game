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

  it("deduplicates normalized values", () => {
    expect(normalizeChoiceList(["  Open   Door  ", "Open Door", "Open   Door"]))
      .toEqual(["Open Door"]);
  });

  it("preserves first-seen order while deduplicating", () => {
    expect(normalizeChoiceList(["Talk", "Attack", "Talk", "Run", "Attack"]))
      .toEqual(["Talk", "Attack", "Run"]);
  });

  it("removes empty and whitespace-only entries", () => {
    expect(normalizeChoiceList([" ", "\n\t", "  Listen  ", ""]))
      .toEqual(["Listen"]);
  });
});
