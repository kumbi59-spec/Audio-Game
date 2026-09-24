import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  consumeRateLimit: vi.fn(),
  listUserSessions: vi.fn(),
  getSessionWithHistory: vi.fn(),
  createDbSession: vi.fn(),
  createDbCharacter: vi.fn(),
  resolvePlayableWorld: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: mocks.userFindUnique, create: mocks.userCreate } },
}));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/db/queries/users", () => ({ createDbCharacter: mocks.createDbCharacter }));
vi.mock("@/lib/db/queries/sessions", () => ({
  listUserSessions: mocks.listUserSessions,
  getSessionWithHistory: mocks.getSessionWithHistory,
  createDbSession: mocks.createDbSession,
}));
vi.mock("@/lib/worlds/resolve-playable-world", () => ({
  resolvePlayableWorld: mocks.resolvePlayableWorld,
}));

import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const character = { id: "c1", name: "Hero", class: "warrior", backstory: "", stats: {}, inventory: [] };

describe("/api/game/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
    mocks.userFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === "real-user"
        ? { id: "real-user", email: "victim@example.com", tier: "creator", passwordHash: "h", createdAt: new Date(0) }
        : null,
    );
    mocks.userCreate.mockImplementation(async ({ data }: { data: { id: string } }) => ({ id: data.id, tier: "free" }));
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.listUserSessions.mockResolvedValue([]);
    mocks.createDbCharacter.mockResolvedValue({ id: "db-char" });
    mocks.createDbSession.mockResolvedValue({ id: "db-session" });
    mocks.resolvePlayableWorld.mockResolvedValue({ ok: true, world: { id: "w1", locations: [{ id: "l1" }] } });
  });

  it("GET does not list another account's sessions via ?guestId=", async () => {
    const res = await GET(new NextRequest("http://localhost/api/game/session?guestId=real-user"));
    expect(await res.json()).toEqual([]);
    expect(mocks.listUserSessions).not.toHaveBeenCalled();
  });

  it("GET does not load another account's session via ?guestId=", async () => {
    const res = await GET(new NextRequest("http://localhost/api/game/session?sessionId=s1&guestId=real-user"));
    expect(res.status).toBe(401);
    expect(mocks.getSessionWithHistory).not.toHaveBeenCalled();
  });

  it("POST never attaches a new session to a client-named account", async () => {
    const res = await POST(new NextRequest("http://localhost/api/game/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guestId: "real-user", worldId: "w1", character }),
    }));
    expect(res.status).toBe(200);
    const ownerId = mocks.createDbSession.mock.calls[0]![1];
    expect(ownerId).toMatch(/^guest_/);
    expect(mocks.createDbCharacter.mock.calls[0]![0]).toBe(ownerId);
    expect(res.headers.get("set-cookie")).toContain("eq_guest=");
  });

  it("POST refuses worlds the caller may not play", async () => {
    mocks.resolvePlayableWorld.mockResolvedValue({ ok: false, status: 403 });
    const res = await POST(new NextRequest("http://localhost/api/game/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ worldId: "private-world", character }),
    }));
    expect(res.status).toBe(403);
    expect(mocks.createDbSession).not.toHaveBeenCalled();
  });
});
