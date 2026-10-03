import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), create: vi.fn(), consumeRateLimit: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/ai/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/client")>()),
  getAnthropicClient: () => ({ messages: { create: mocks.create } }),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";

function suggest() {
  return POST(new NextRequest("http://localhost/api/worlds/wizard/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fieldId: "title", draft: { genre: "cosmic horror" } }),
  }));
}

describe("POST /api/worlds/wizard/suggest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it("turns a player away once they're over the authoring rate limit", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 30 });
    const res = await suggest();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reads the suggestions even when the reply opens with a thinking block", async () => {
    mocks.create.mockResolvedValue({
      stop_reason: "end_turn",
      content: [
        { type: "thinking", thinking: "", signature: "sig" },
        { type: "text", text: '["The Hollow Tide","Saltglass","Under Quiet Stars"]' },
      ],
    });
    const res = await suggest();
    expect(await res.json()).toEqual({ suggestions: ["The Hollow Tide", "Saltglass", "Under Quiet Stars"] });
  });

  it("asks for no extended thinking, so the small token budget goes to the answer", async () => {
    mocks.create.mockResolvedValue({ content: [{ type: "text", text: "[]" }] });
    await suggest();
    expect(mocks.create.mock.calls[0]![0]).toMatchObject({
      model: "claude-sonnet-5-5",
      max_tokens: 256,
      thinking: { type: "between_tools" },
    });
  });
});
