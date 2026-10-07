import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  consumeRateLimit: vi.fn(),
  listUserSessions: vi.fn(),
  getSessionWithHistory: vi.fn(),
  createDbSession: vi.fn(),
  createSessionCharacter: vi.fn(),
  resolvePlayableWorld: vi.fn(),
  deleteOwnedSession: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: mocks.userFindUnique, create: mocks.userCreate } },
}));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/db/queries/characters", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db/queries/characters")>()),
  createSessionCharacter: mocks.createSessionCharacter,
}));
vi.mock("@/lib/db/queries/sessions", () => ({
  listUserSessions: mocks.listUserSessions,
  getSessionWithHistory: mocks.getSessionWithHistory,
  createDbSession: mocks.createDbSession,
  deleteOwnedSession: mocks.deleteOwnedSession,
}));
vi.mock("@/lib/worlds/resolve-playable-world", () => ({
  resolvePlayableWorld: mocks.resolvePlayableWorld,
}));

import { NextRequest } from "next/server";
import { DELETE, GET, POST } from "./route";

const character = {
  id: "c1",
  name: "Hero",
  class: "warrior",
  backstory: "",
  stats: { hp: 10, maxHp: 10, strength: 10, dexterity: 10, intelligence: 10, charisma: 10, level: 1, experience: 0 },
  inventory: [],
  quests: [],
};

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
    mocks.createSessionCharacter.mockResolvedValue({ id: "db-char" });
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
    expect(mocks.createSessionCharacter.mock.calls[0]![0]).toBe(ownerId);
    expect(mocks.createDbSession.mock.calls[0]![2]).toBe("db-char");
    expect(await res.json()).toEqual({ sessionId: "db-session", characterId: "db-char" });
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

  it("GET returns everything needed to resume a saved game", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "real-user" } });
    const { id: _id, ...snapshot } = { ...character, stats: { ...character.stats, hp: 4 } };
    mocks.getSessionWithHistory.mockResolvedValue({
      session: {
        id: "s1",
        userId: "real-user",
        worldId: "w1",
        characterId: "char-db",
        status: "active",
        turnCount: 1,
        gameState: {
          currentLocationId: "l1",
          timeOfDay: "night",
          weather: "rain",
          globalFlags: "{}",
          npcStates: JSON.stringify({ _codex: [{ key: "k" }] }),
          memorySummary: "",
        },
        character: { id: "char-db", name: "Hero", class: "warrior", backstory: "", stats: "{}", snapshot: JSON.stringify(snapshot), inventory: [], quests: [] },
      },
      history: [
        { id: "h0", role: "assistant", content: JSON.stringify({ narration: "You arrive.", choices: ["Look"] }), createdAt: new Date(0) },
        { id: "h1", role: "user", content: "Look", createdAt: new Date(1) },
        { id: "h2", role: "assistant", content: JSON.stringify({ narration: "A gate.", choices: ["Open it", "Leave"] }), createdAt: new Date(2) },
      ],
    });

    const res = await GET(new NextRequest("http://localhost/api/game/session?sessionId=s1"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(mocks.resolvePlayableWorld).toHaveBeenCalledWith("w1", "real-user");
    expect(body.world).toEqual({ id: "w1", locations: [{ id: "l1" }], systemPrompt: "" });
    expect(body.character).toMatchObject({ id: "char-db", stats: { hp: 4 } });
    expect(body.session.narrationLog.map((e: { type: string; text: string }) => [e.type, e.text])).toEqual([
      ["narration", "You arrive."],
      ["player_action", "Look"],
      ["narration", "A gate."],
    ]);
    expect(body.session.choices).toEqual(["Open it", "Leave"]);
    expect(body.session.codex).toEqual([{ key: "k" }]);
    expect(body.session.history).toHaveLength(3);
  });

  it("DELETE removes the signed-in player's own save", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "real-user" } });
    mocks.deleteOwnedSession.mockResolvedValue(true);
    const res = await DELETE(new NextRequest("http://localhost/api/game/session?sessionId=s1", { method: "DELETE" }));
    expect(res.status).toBe(204);
    expect(mocks.deleteOwnedSession).toHaveBeenCalledWith("s1", "real-user");
  });

  it("DELETE says not found for a save that isn't theirs", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "real-user" } });
    mocks.deleteOwnedSession.mockResolvedValue(false);
    const res = await DELETE(new NextRequest("http://localhost/api/game/session?sessionId=other", { method: "DELETE" }));
    expect(res.status).toBe(404);
  });

  it("DELETE needs a sessionId", async () => {
    const res = await DELETE(new NextRequest("http://localhost/api/game/session", { method: "DELETE" }));
    expect(res.status).toBe(400);
    expect(mocks.deleteOwnedSession).not.toHaveBeenCalled();
  });

  it("DELETE can't act for another account via ?guestId=", async () => {
    const res = await DELETE(new NextRequest("http://localhost/api/game/session?sessionId=s1&guestId=real-user", { method: "DELETE" }));
    expect(res.status).toBe(401);
    expect(mocks.deleteOwnedSession).not.toHaveBeenCalled();
  });
});
