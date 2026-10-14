import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mocks.create };
  },
}));

import { SUMMARY_TIMEOUT_MS, summarizeHistory } from "./summarizer";

beforeEach(() => {
  mocks.create.mockReset();
});

describe("summarizeHistory", () => {
  it("gives the summary call a timeout instead of the SDK's long default", async () => {
    mocks.create.mockResolvedValueOnce({ content: [{ type: "text", text: " The player opened the gate. " }] });

    const summary = await summarizeHistory(
      [
        { role: "user", content: "open the gate", turnNumber: 1 },
        { role: "assistant", content: '{"narration":"It creaks open."}', turnNumber: 1 },
      ],
      "",
      "Test World",
    );

    expect(summary).toBe("The player opened the gate.");
    expect(mocks.create.mock.calls[0]![1]).toEqual({ timeout: SUMMARY_TIMEOUT_MS, maxRetries: 0 });
    expect(mocks.create.mock.calls[0]![0].messages[0].content).toContain("[GM] It creaks open.");
  });

  it("doesn't call the model with nothing to summarise", async () => {
    await expect(summarizeHistory([], "old summary", "Test World")).resolves.toBe("old summary");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
