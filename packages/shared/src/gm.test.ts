import { describe, expect, it } from "vitest";
import { GmTurn, PlayerInput, StateMutation } from "./gm.js";

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

  it("rejects inventory mutations with a zero or negative quantity", () => {
    for (const op of ["inventory.add", "inventory.remove"] as const) {
      expect(StateMutation.safeParse({ op, item: "torch", quantity: 0 }).success).toBe(false);
      expect(StateMutation.safeParse({ op, item: "torch", quantity: -2 }).success).toBe(false);
      expect(StateMutation.parse({ op, item: "torch" })).toMatchObject({ quantity: 1 });
    }
    expect(() =>
      GmTurn.parse({
        narration: "You drop nothing.",
        presented_choices: [],
        state_mutations: [{ op: "inventory.remove", item: "coin", quantity: 0 }],
      }),
    ).toThrow();
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

describe("PlayerInput schema", () => {
  it("caps the length of choice ids and utility commands", () => {
    expect(PlayerInput.safeParse({ kind: "choice", choiceId: "c1" }).success).toBe(true);
    expect(PlayerInput.safeParse({ kind: "choice", choiceId: "c".repeat(129) }).success).toBe(false);
    expect(PlayerInput.safeParse({ kind: "utility", command: "begin" }).success).toBe(true);
    expect(PlayerInput.safeParse({ kind: "utility", command: "x".repeat(201) }).success).toBe(false);
  });
});
