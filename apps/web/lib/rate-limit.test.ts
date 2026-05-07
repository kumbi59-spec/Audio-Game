import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Prisma mock ──────────────────────────────────────────────────────────────
// Mirrors the RateLimitBucket table in memory so DbRateLimitStore can be
// tested without a real database.
type BucketRow = {
  key: string;
  count: number;
  resetAt: Date;
  cooldownUntil: Date | null;
  updatedAt: Date;
};

const buckets = new Map<string, BucketRow>();

vi.mock("@/lib/db", () => ({
  prisma: {
    $executeRaw: vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      // Parse the tagged template: INSERT ... VALUES (key, count, resetAt, cooldownUntil, NOW())
      // ON CONFLICT DO UPDATE …
      const [key, count, resetAt, cooldownUntil] = values as [string, number, Date, Date | null];
      buckets.set(key, { key, count, resetAt, cooldownUntil, updatedAt: new Date() });
      return 1;
    }),
    $queryRaw: vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const key = values[0] as string;
      const row = buckets.get(key);
      return row ? [{ count: row.count, resetAt: row.resetAt, cooldownUntil: row.cooldownUntil }] : [];
    }),
  },
}));

import { consumeRateLimit } from "./rate-limit";

describe("consumeRateLimit (DbRateLimitStore)", () => {
  beforeEach(() => {
    buckets.clear();
    vi.clearAllMocks();
  });

  it("allows the first request within the limit", async () => {
    const result = await consumeRateLimit({
      key: "test:user1",
      limit: 3,
      windowSeconds: 60,
    });
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("allows requests up to the limit", async () => {
    for (let i = 0; i < 3; i++) {
      const r = await consumeRateLimit({ key: "test:user2", limit: 3, windowSeconds: 60 });
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    for (let i = 0; i < 3; i++) {
      await consumeRateLimit({ key: "test:user3", limit: 3, windowSeconds: 60 });
    }
    const result = await consumeRateLimit({ key: "test:user3", limit: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("applies a cooldown when cooldownSeconds is set", async () => {
    // Exceed limit to trigger cooldown
    for (let i = 0; i < 4; i++) {
      await consumeRateLimit({ key: "test:user4", limit: 3, windowSeconds: 60, cooldownSeconds: 300 });
    }
    const result = await consumeRateLimit({ key: "test:user4", limit: 3, windowSeconds: 60, cooldownSeconds: 300 });
    expect(result.allowed).toBe(false);
    // Cooldown should be ~300s; allow some slack for test execution time
    expect(result.retryAfterSeconds).toBeGreaterThan(290);
  });

  it("only increments on failure when incrementOnFailureOnly is true", async () => {
    // Three successful (non-failure) calls should not consume the limit
    for (let i = 0; i < 5; i++) {
      const r = await consumeRateLimit({
        key: "test:user5",
        limit: 3,
        windowSeconds: 60,
        incrementOnFailureOnly: true,
        wasFailure: false,
      });
      expect(r.allowed).toBe(true);
    }
  });

  it("increments on failure when incrementOnFailureOnly + wasFailure=true", async () => {
    for (let i = 0; i < 3; i++) {
      await consumeRateLimit({
        key: "test:user6",
        limit: 3,
        windowSeconds: 60,
        incrementOnFailureOnly: true,
        wasFailure: true,
      });
    }
    const result = await consumeRateLimit({
      key: "test:user6",
      limit: 3,
      windowSeconds: 60,
      incrementOnFailureOnly: true,
      wasFailure: true,
    });
    expect(result.allowed).toBe(false);
  });

  it("resets the window after it expires", async () => {
    const pastResetAt = new Date(Date.now() - 1000);
    buckets.set("test:user7", {
      key: "test:user7",
      count: 3,
      resetAt: pastResetAt,
      cooldownUntil: null,
      updatedAt: new Date(),
    });
    // Window expired — next request should start a new window and be allowed
    const result = await consumeRateLimit({ key: "test:user7", limit: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
  });
});
