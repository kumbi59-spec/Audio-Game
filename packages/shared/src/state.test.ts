import { describe, expect, it } from "vitest";
import { canTransition } from "./session-machine";

describe("session state transitions", () => {
  it("supports recap transitions from active states", () => {
    expect(canTransition("joined", "awaiting_recap")).toBe(true);
    expect(canTransition("turn_complete", "awaiting_recap")).toBe(true);
    expect(canTransition("awaiting_recap", "joined")).toBe(true);
    expect(canTransition("awaiting_recap", "turn_complete")).toBe(true);
  });

  it("rejects recap transitions while a turn is generating", () => {
    expect(canTransition("awaiting_gm", "awaiting_recap")).toBe(false);
  });
});
