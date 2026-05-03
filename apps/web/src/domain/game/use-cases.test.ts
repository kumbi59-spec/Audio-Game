import { describe, expect, it, vi } from "vitest";
import {
  createOptimisticTurn,
  finalizeTurn,
  normalizeChoiceList,
  retryWithBackoff,
  rollbackTurn,
  sanitizeAction,
  selectChoice,
} from "./use-cases";

describe("game domain use-cases", () => {
  it("normalizes choice labels", () => {
    expect(selectChoice("  Open   the door \n")).toBe("Open the door");
  });

  it("optimistically appends action and supports rollback", () => {
    const base = { isGenerating: false, narrationLog: [], history: [], choices: [] };
    const action = { type: "free_text" as const, content: " inspect altar " };
    const optimistic = createOptimisticTurn(base, action, new Date("2026-01-01T00:00:00Z"));
    expect(optimistic.next.isGenerating).toBe(true);
    expect(optimistic.next.narrationLog.at(-1)?.text).toBe(" inspect altar ");

    const rolled = rollbackTurn(optimistic.next, optimistic.rollback);
    expect(rolled).toEqual(base);
  });

  it("finalizes with normalized choices and history", () => {
    const state = { isGenerating: true, narrationLog: [], history: [], choices: [] };
    const next = finalizeTurn(state, { type: "choice", content: "Run", choiceIndex: 0 }, "You flee.", [" Run ", "Run", "Hide"]);
    expect(next.isGenerating).toBe(false);
    expect(next.choices).toEqual(["Run", "Hide"]);
    expect(next.history).toHaveLength(2);
  });

  it("retries once and then succeeds", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce("ok");

    const pending = retryWithBackoff(fn, 2, 50);
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("rejects invalid edge-case actions", () => {
    expect(sanitizeAction({ type: "free_text", content: "   " })).toBeNull();
    expect(sanitizeAction({ type: "choice", content: "A", choiceIndex: -1 })).toBeNull();
    expect(sanitizeAction({ type: "choice", content: "  A ", choiceIndex: 0 })?.content).toBe("A");
  });

  it("keeps de-dupe behavior", () => {
    expect(normalizeChoiceList(["Talk", "Attack", "Talk", "Run", "Attack"])).toEqual(["Talk", "Attack", "Run"]);
  });
});
