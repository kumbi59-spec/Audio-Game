import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), create: vi.fn(), consumeRateLimit: vi.fn(), getUserTier: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/queries/users", () => ({ getUserTier: mocks.getUserTier }));
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

function importNotes() {
  return POST(new NextRequest("http://localhost/api/worlds/import-notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ notes: "Session 1: the party reached the drowned city of Vell." }),
  }));
}

describe("POST /api/worlds/import-notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getUserTier.mockResolvedValue("storyteller");
  });

  it("is for plans that include the world wizard", async () => {
    mocks.getUserTier.mockResolvedValueOnce("free");
    const res = await importNotes();
    expect(res.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reads a reply wrapped in a code fence", async () => {
    mocks.create.mockResolvedValue({
      content: [{ type: "text", text: '```json\n{"title":"The Drowned City","genre":"sunken fantasy"}\n```' }],
    });
    const res = await importNotes();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ draft: { title: "The Drowned City", genre: "sunken fantasy" } });
  });

  it("reports a reply that isn't a JSON object as a bad AI response", async () => {
    mocks.create.mockResolvedValue({ content: [{ type: "text", text: "null" }] });
    const res = await importNotes();
    expect(res.status).toBe(502);
  });
});
