import { describe, expect, it } from "vitest";
import { GmTurn } from "./gm.js";

describe("GmTurn schema", () => {
  it("accepts a minimal GM turn", () => {
    const parsed = GmTurn.parse({
      narration: "A cold wind rises.",
      presented_choices: [],
    });
    expect(parsed.accepts_freeform).toBe(true);
    expect(parsed.sound_cues).toEqual([]);
    expect(parsed.state_mutations).toEqual([]);
    expect(parsed.scene_ends).toBe(false);
  });

  it("rejects empty narration", () => {
    expect(() =>
      GmTurn.parse({ narration: "", presented_choices: [] }),
    ).toThrow();
  });

  it("validates state mutations by op", () => {
    const turn = GmTurn.parse({
      narration: "You take the coin.",
      presented_choices: [{ id: "c1", label: "Leave" }],
      state_mutations: [
        { op: "inventory.add", item: "gold coin", quantity: 1 },
        { op: "flag.set", key: "found_coin", value: true },
      ],
    });
    expect(turn.state_mutations).toHaveLength(2);
  });

  it("rejects more than 6 choices", () => {
    expect(() =>
      GmTurn.parse({
        narration: "Many paths.",
        presented_choices: Array.from({ length: 7 }, (_, i) => ({
          id: `c${i}`,
          label: `Path ${i}`,
        })),
      }),
    ).toThrow();
  });
});
