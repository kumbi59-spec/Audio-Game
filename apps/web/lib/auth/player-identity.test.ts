import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  consumeRateLimit: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: mocks.userFindUnique, create: mocks.userCreate } },
}));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));

import {
  GUEST_COOKIE,
  decodeGuestCookieValue,
  encodeGuestCookieValue,
  resolvePlayer,
} from "./player-identity";

type Row = { id: string; email: string; tier: string; passwordHash: string | null; createdAt: Date };
const users = new Map<string, Row>();

function req(cookie?: string) {
  return new Request("http://localhost/api/game/session", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  });
}

describe("guest cookie signing", () => {
  it("round-trips a signed guest id", () => {
    expect(decodeGuestCookieValue(encodeGuestCookieValue("guest_abc"))).toBe("guest_abc");
  });

  it("rejects unsigned or tampered values", () => {
    const valid = encodeGuestCookieValue("guest_abc");
    expect(decodeGuestCookieValue("guest_abc")).toBeNull();
    expect(decodeGuestCookieValue(valid.replace("guest_abc", "guest_xyz"))).toBeNull();
    expect(decodeGuestCookieValue(`${valid}x`)).toBeNull();
  });
});

describe("resolvePlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    users.clear();
    mocks.auth.mockResolvedValue(null);
    mocks.userFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => users.get(where.id) ?? null);
    mocks.userCreate.mockImplementation(async ({ data }: { data: { id: string } }) => ({ id: data.id, tier: "free" }));
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it("prefers the signed-in user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    users.set("u1", { id: "u1", email: "u1@example.com", tier: "creator", passwordHash: "h", createdAt: new Date() });
    const result = await resolvePlayer(req(), { allowGuestCreation: true });
    expect(result).toMatchObject({ ok: true, player: { userId: "u1", kind: "user", tier: "creator" }, setCookie: null });
  });

  it("requires an identity when guest creation is not allowed", async () => {
    const result = await resolvePlayer(req());
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("never lets a guest cookie resolve to a real account", async () => {
    users.set("real-user", { id: "real-user", email: "victim@example.com", tier: "creator", passwordHash: "h", createdAt: new Date() });
    // Even a correctly signed cookie for a non-guest row is refused.
    const result = await resolvePlayer(req(`${GUEST_COOKIE}=${encodeGuestCookieValue("real-user")}`));
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("refuses a legacy guest id that names a real account", async () => {
    users.set("real-user", { id: "real-user", email: "victim@example.com", tier: "creator", passwordHash: "h", createdAt: new Date(0) });
    const result = await resolvePlayer(req(), { legacyGuestId: "real-user" });
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("re-binds a pre-existing legacy guest row to a cookie", async () => {
    const id = "0b6c6f5e-8d1a-4c4b-9f1e-2a4d5c6b7e8f";
    users.set(id, { id, email: `guest-${id}@echoquest.local`, tier: "free", passwordHash: null, createdAt: new Date("2026-05-01") });
    const result = await resolvePlayer(req(), { legacyGuestId: id });
    expect(result).toMatchObject({ ok: true, player: { userId: id, kind: "guest" } });
    expect(result.ok && result.setCookie).toContain(`${GUEST_COOKIE}=${encodeGuestCookieValue(id)}`);
  });

  it("refuses legacy claims for server-issued or post-cutoff guest ids", async () => {
    const issued = "guest_11111111-1111-4111-8111-111111111111";
    users.set(issued, { id: issued, email: `guest-${issued}@echoquest.local`, tier: "free", passwordHash: null, createdAt: new Date("2026-05-01") });
    const recent = "22222222-2222-4222-8222-222222222222";
    users.set(recent, { id: recent, email: `guest-${recent}@echoquest.local`, tier: "free", passwordHash: null, createdAt: new Date("2027-01-01") });
    expect(await resolvePlayer(req(), { legacyGuestId: issued })).toMatchObject({ ok: false });
    expect(await resolvePlayer(req(), { legacyGuestId: recent })).toMatchObject({ ok: false });
  });

  it("mints a prefixed guest with a signed httpOnly cookie", async () => {
    const result = await resolvePlayer(req(), { allowGuestCreation: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.player.userId).toMatch(/^guest_/);
    expect(result.setCookie).toMatch(/HttpOnly; SameSite=Lax/);
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(expect.objectContaining({ key: "guest-create:ip:203.0.113.7" }));
  });
});
