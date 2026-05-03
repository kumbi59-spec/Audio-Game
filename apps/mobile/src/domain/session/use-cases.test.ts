import { describe, expect, it, vi } from "vitest";
import {
  buildPlayerTranscript,
  optimisticPlayerEntry,
  parseChoiceCommand,
  retryWithBackoff,
  rollbackSession,
} from "./use-cases";

describe("session domain use-cases", () => {
  it("formats player transcript text", () => {
    expect(buildPlayerTranscript("  I   examine\n the statue  ")).toBe("I examine the statue");
  });

  it("supports optimistic append and rollback", () => {
    const state = { pending: false, transcript: [] };
    const { next, rollback } = optimisticPlayerEntry(state, "  hello there  ");
    expect(next.pending).toBe(true);
    expect(next.transcript[0]?.text).toBe("hello there");
    expect(rollbackSession(next, rollback)).toEqual(state);
  });

  it("retries request logic", async () => {
    vi.useFakeTimers();
    const fn = vi.fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce("ok");
    const pending = retryWithBackoff(fn, 2, 50);
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBe("ok");
    vi.useRealTimers();
  });

  it("handles choice parsing edge cases", () => {
    expect(parseChoiceCommand("choice nine")).toBe(8);
    expect(parseChoiceCommand("pick ten")).toBeNull();
    expect(parseChoiceCommand("   ")).toBeNull();
  });
});
