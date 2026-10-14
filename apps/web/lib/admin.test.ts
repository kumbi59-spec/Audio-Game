import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  process.env["ADMIN_EMAILS"] = "Owner@EchoQuest.us, second@example.com";
  return { auth: vi.fn() };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));

import { effectiveTierForUser, isVerifiedAdmin, requireAdmin } from "./admin";

describe("isVerifiedAdmin", () => {
  it("requires a listed email that has been verified", () => {
    expect(isVerifiedAdmin({ email: "owner@echoquest.us", emailVerified: new Date() })).toBe(true);
    expect(isVerifiedAdmin({ email: "owner@echoquest.us", emailVerified: null })).toBe(false);
    expect(isVerifiedAdmin({ email: "owner@echoquest.us", emailVerified: undefined })).toBe(false);
    expect(isVerifiedAdmin({ email: "player@example.com", emailVerified: new Date() })).toBe(false);
    expect(isVerifiedAdmin({ email: null, emailVerified: new Date() })).toBe(false);
  });

  it("does not elevate an unverified case variant of an admin email", () => {
    expect(isVerifiedAdmin({ email: "OWNER@echoquest.us", emailVerified: null })).toBe(false);
  });

  it("accepts the ISO string a verified date becomes inside the JWT", () => {
    expect(isVerifiedAdmin({ email: "second@example.com", emailVerified: "2026-01-01T00:00:00.000Z" })).toBe(true);
  });
});

describe("effectiveTierForUser", () => {
  it("only lifts a verified admin to creator", () => {
    expect(effectiveTierForUser({ email: "owner@echoquest.us", emailVerified: new Date() }, "free")).toBe("creator");
    expect(effectiveTierForUser({ email: "owner@echoquest.us", emailVerified: null }, "free")).toBe("free");
  });
});

describe("requireAdmin", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("refuses an admin email whose session is not verified", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", email: "owner@echoquest.us", emailVerified: null, isAdmin: true } });
    expect(await requireAdmin()).toBeNull();
  });

  it("admits a verified admin", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", email: "owner@echoquest.us", emailVerified: "2026-01-01T00:00:00.000Z" } });
    expect(await requireAdmin()).toEqual({ id: "u1", email: "owner@echoquest.us" });
  });
});
