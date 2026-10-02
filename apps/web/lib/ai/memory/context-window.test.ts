import { describe, expect, it } from "vitest";
import { pendingSummaryFor, trimHistoryForContext } from "./context-window";

const msg = (i: number, size = 10) => ({ role: i % 2 ? "assistant" : "user", content: String(i).padEnd(size, ".") });

describe("trimHistoryForContext", () => {
  it("leaves history under the budget untouched", () => {
    const history = Array.from({ length: 6 }, (_, i) => msg(i));
    expect(trimHistoryForContext(history, 1000)).toBe(history);
  });

  it("drops the oldest messages in blocks of ten", () => {
    const history = Array.from({ length: 25 }, (_, i) => msg(i));
    const trimmed = trimHistoryForContext(history, 200);
    expect(trimmed).toHaveLength(15);
    expect(trimmed[0]).toBe(history[10]);
  });

  it("keeps the same cut for several turns as history grows, so the prefix stays cacheable", () => {
    const history = Array.from({ length: 21 }, (_, i) => msg(i));
    const cuts = [];
    for (let len = 21; len <= 31; len += 2) {
      cuts.push(trimHistoryForContext(history.concat(Array.from({ length: len - 21 }, (_, i) => msg(21 + i))), 200)[0]);
    }
    expect(new Set(cuts.slice(0, 5)).size).toBe(1);
    expect(cuts.at(-1)).not.toBe(cuts[0]);
  });

  it("always keeps the last two messages", () => {
    const history = [msg(0, 500), msg(1, 500), msg(2, 500)];
    expect(trimHistoryForContext(history, 100)).toEqual([history[1], history[2]]);
  });
});

describe("pendingSummaryFor", () => {
  const history = Array.from({ length: 25 }, (_, i) => msg(i));

  it("is null while nothing unsummarised falls out of the window", () => {
    expect(pendingSummaryFor(history.slice(0, 5), 0, 1000)).toBeNull();
    // 10 messages drop, all already summarised.
    expect(pendingSummaryFor(history, 10, 200)).toBeNull();
  });

  it("returns the dropped messages not yet in the summary", () => {
    const pending = pendingSummaryFor(history, 0, 200);
    expect(pending?.fromMessage).toBe(0);
    expect(pending?.messages).toEqual(history.slice(0, 10));
    expect(pendingSummaryFor(history, 4, 200)?.messages).toEqual(history.slice(4, 10));
  });

  it("catches up on a long backlog forty messages at a time", () => {
    const long = Array.from({ length: 120 }, (_, i) => msg(i));
    const pending = pendingSummaryFor(long, 0, 100);
    expect(pending?.messages).toHaveLength(40);
    expect(pendingSummaryFor(long, 40, 100)?.fromMessage).toBe(40);
  });
});
