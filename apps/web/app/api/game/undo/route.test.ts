import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  undoLastTurn: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.userFindUnique } } }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => ({ allowed: true, retryAfterSeconds: 0 })),
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/db/queries/sessions", () => ({ undoLastTurn: mocks.undoLastTurn }));

import { NextRequest } from "next/server";
import { POST } from "./route";

function undo(body: unknown) {
  return POST(new NextRequest("http://localhost/api/game/undo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("POST /api/game/undo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.userFindUnique.mockResolvedValue({ id: "u1", email: "a@example.com", tier: "free", createdAt: new Date(0) });
  });

  it("undoes the caller's own session and returns the restored character", async () => {
    mocks.undoLastTurn.mockResolvedValue({ ok: true, character: { id: "c1", name: "Hero" } });
    const res = await undo({ dbSessionId: "s1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, character: { id: "c1", name: "Hero" } });
    expect(mocks.undoLastTurn).toHaveBeenCalledWith("s1", "u1");
  });

  it("reports when there is nothing to undo, or no such session", async () => {
    mocks.undoLastTurn.mockResolvedValueOnce({ ok: false, reason: "nothing_to_undo" });
    expect((await undo({ dbSessionId: "s1" })).status).toBe(409);
    mocks.undoLastTurn.mockResolvedValueOnce({ ok: false, reason: "not_found" });
    expect((await undo({ dbSessionId: "someone-elses" })).status).toBe(404);
  });

  it("rejects anonymous callers and bad bodies without touching the database", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await undo({ dbSessionId: "s1" })).status).toBe(401);
    expect((await undo({})).status).toBe(400);
    expect(mocks.undoLastTurn).not.toHaveBeenCalled();
  });
});
