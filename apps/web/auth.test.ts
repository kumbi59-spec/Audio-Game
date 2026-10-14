import { beforeEach, describe, expect, it, vi } from "vitest";

type Authorize = (credentials: Record<string, string>, request: Request) => Promise<unknown>;
type Jwt = (params: { token: Record<string, unknown>; user?: Record<string, unknown>; trigger?: string }) => Promise<Record<string, unknown>>;

const mocks = vi.hoisted(() => {
  process.env["ADMIN_EMAILS"] = "owner@echoquest.us";
  return {
    config: null as null | { providers: Array<{ authorize: Authorize }>; callbacks: { jwt: Jwt } },
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    consumeRateLimit: vi.fn(),
    createVerificationToken: vi.fn(),
    sendVerificationEmail: vi.fn(),
  };
});

vi.mock("next-auth", () => ({
  default: (config: typeof mocks.config) => {
    mocks.config = config;
    return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() };
  },
  CredentialsSignin: class CredentialsSignin extends Error {
    code = "credentials";
  },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (options: unknown) => options }));
vi.mock("bcryptjs", () => ({
  hash: async (password: string) => `hashed:${password}`,
  compare: async (password: string, passwordHash: string) => passwordHash === `hashed:${password}`,
}));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: mocks.findUnique, findFirst: mocks.findFirst, create: mocks.create } },
}));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.9",
}));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: mocks.sendVerificationEmail }));
vi.mock("@/lib/email/verification", () => ({ createVerificationToken: mocks.createVerificationToken }));

import "./auth";

function authorize(credentials: Record<string, string>) {
  const request = new Request("http://localhost:10000/api/auth/callback/credentials", {
    method: "POST",
    headers: { "x-forwarded-host": "evil.example" },
  });
  return mocks.config!.providers[0]!.authorize(credentials, request);
}

describe("credentials sign-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://echoquest.us");
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "new", ...data }));
    mocks.createVerificationToken.mockResolvedValue("tok");
    mocks.sendVerificationEmail.mockResolvedValue(undefined);
  });

  it("stores the email lowercased and the tier as free, even for an admin address", async () => {
    const user = await authorize({ email: "  Owner@EchoQuest.us ", password: "longenough", mode: "signup", name: "Owner" });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "owner@echoquest.us", tier: "free", emailVerified: null }) }),
    );
    // Unverified, so not elevated in the session either.
    expect(user).toMatchObject({ email: "owner@echoquest.us", tier: "free" });
  });

  it("never auto-verifies an admin address when no email service is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    await authorize({ email: "player@example.com", password: "longenough", mode: "signup" });
    expect(mocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ emailVerified: expect.any(Date) }) }),
    );

    const user = await authorize({ email: "Owner@EchoQuest.us", password: "longenough", mode: "signup" });
    expect(mocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "owner@echoquest.us", emailVerified: null }) }),
    );
    expect(user).toMatchObject({ tier: "free" });
  });

  it("checks for an existing account case-insensitively", async () => {
    mocks.findFirst.mockResolvedValue({ id: "existing" });

    await expect(authorize({ email: "OWNER@echoquest.us", password: "longenough", mode: "signup" })).rejects.toMatchObject({
      code: "email_in_use",
    });
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: { equals: "owner@echoquest.us", mode: "insensitive" } } }),
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than 8 characters", async () => {
    await expect(authorize({ email: "new@example.com", password: "short", mode: "signup" })).rejects.toMatchObject({
      code: "password_too_short",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rate limits sign-ups per IP", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 });

    await expect(authorize({ email: "new@example.com", password: "longenough", mode: "signup" })).rejects.toMatchObject({
      code: "rate_limited",
    });
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(expect.objectContaining({ key: "auth:signup:ip:203.0.113.9" }));
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("builds the verification link from the public origin, not forwarded headers", async () => {
    await authorize({ email: "new@example.com", password: "longenough", mode: "signup" });

    await vi.waitFor(() => expect(mocks.sendVerificationEmail).toHaveBeenCalled());
    const url = mocks.sendVerificationEmail.mock.calls[0]![2] as string;
    expect(url.startsWith("https://echoquest.us/api/auth/verify-email?token=tok&email=new%40example.com")).toBe(true);
  });
});

describe("credentials sign-in", () => {
  const legacyUser = {
    id: "u1",
    email: "Kumbi59@gmail.com",
    name: "Kumbi",
    tier: "storyteller",
    passwordHash: "hashed:correct-horse",
    emailVerified: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.findUnique.mockResolvedValue(null);
    mocks.findFirst.mockResolvedValue(legacyUser);
  });

  it("falls back to a case-insensitive match for mixed-case accounts", async () => {
    const user = await authorize({ email: "kumbi59@gmail.com", password: "correct-horse", mode: "signin" });

    expect(user).toMatchObject({ id: "u1", tier: "storyteller" });
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "kumbi59@gmail.com" } }));
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: { equals: "kumbi59@gmail.com", mode: "insensitive" } } }),
    );
  });

  it("counts a wrong password against both the IP and the email", async () => {
    expect(await authorize({ email: "Kumbi59@gmail.com", password: "wrong", mode: "signin" })).toBeNull();

    const failures = mocks.consumeRateLimit.mock.calls
      .map(([rule]) => rule as { key: string; wasFailure: boolean })
      .filter((rule) => rule.wasFailure);
    expect(failures.map((rule) => rule.key)).toEqual(["auth:signin:ip:203.0.113.9", "auth:signin:email:kumbi59@gmail.com"]);
  });

  it("does not count a successful sign-in", async () => {
    await authorize({ email: "kumbi59@gmail.com", password: "correct-horse", mode: "signin" });

    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(expect.objectContaining({ incrementOnFailureOnly: true, wasFailure: false }));
    expect(mocks.consumeRateLimit).not.toHaveBeenCalledWith(expect.objectContaining({ wasFailure: true }));
  });

  it("refuses to check the password while the limiter is cooling down", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 900 });

    await expect(authorize({ email: "kumbi59@gmail.com", password: "correct-horse", mode: "signin" })).rejects.toMatchObject({
      code: "rate_limited",
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});

describe("jwt callback admin flag", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not mark an unverified admin email as admin", async () => {
    const token = await mocks.config!.callbacks.jwt({
      token: {},
      user: { id: "u1", email: "owner@echoquest.us", tier: "free", emailVerified: null },
    });
    expect(token["isAdmin"]).toBe(false);
  });

  it("marks a verified admin email as admin", async () => {
    const token = await mocks.config!.callbacks.jwt({
      token: {},
      user: { id: "u1", email: "owner@echoquest.us", tier: "creator", emailVerified: new Date() },
    });
    expect(token["isAdmin"]).toBe(true);
  });

  it("re-derives admin and tier from the row on refresh", async () => {
    mocks.findUnique.mockResolvedValue({ tier: "free", email: "owner@echoquest.us", emailVerified: null });
    const token = await mocks.config!.callbacks.jwt({ token: { id: "u1", isAdmin: true, tier: "creator" }, trigger: "update" });
    expect(token).toMatchObject({ isAdmin: false, tier: "free" });
  });
});
