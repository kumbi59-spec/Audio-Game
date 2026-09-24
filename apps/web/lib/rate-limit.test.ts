import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    // Emulates the single-statement upsert in DbRateLimitStore. Values arrive
    // in template order: key, increment, newResetAt, now, … (repeats).
    $queryRaw: vi.fn(async (_strings: TemplateStringsArray, ...values: unknown[]) => {
      const [key, increment, newResetAt, now] = values as [string, number, Date, Date];
      const existing = buckets.get(key);
      let row: BucketRow;
      if (!existing) {
        row = { key, count: increment, resetAt: newResetAt, cooldownUntil: null, updatedAt: now };
      } else if (existing.cooldownUntil && existing.cooldownUntil > now) {
        row = { ...existing, updatedAt: now };
      } else if (existing.resetAt <= now) {
        row = { key, count: increment, resetAt: newResetAt, cooldownUntil: null, updatedAt: now };
      } else {
        row = { ...existing, count: existing.count + increment, cooldownUntil: null, updatedAt: now };
      }
      buckets.set(key, row);
      return [{ count: row.count, resetAt: row.resetAt, cooldownUntil: row.cooldownUntil }];
    }),
    // UPDATE … SET cooldownUntil = $1 WHERE key = $2 AND (cooldown unset/expired at $3)
    $executeRaw: vi.fn(async (_strings: TemplateStringsArray, ...values: unknown[]) => {
      const [cooldownUntil, key, now] = values as [Date, string, Date];
      const row = buckets.get(key);
      if (!row || (row.cooldownUntil && row.cooldownUntil > now)) return 0;
      row.cooldownUntil = cooldownUntil;
      return 1;
    }),
  },
}));

import { consumeRateLimit, getClientIp } from "./rate-limit";

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

  it("does not over-admit concurrent callers sharing a key", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeRateLimit({ key: "test:parallel", limit: 3, windowSeconds: 60 })),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
    expect(buckets.get("test:parallel")?.count).toBe(10);
  });
});

describe("getClientIp", () => {
  const envKeys = ["TRUSTED_PROXY_HOPS", "TRUSTED_CLIENT_IP_HEADER"] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of envKeys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of envKeys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  function req(headers: Record<string, string>) {
    return new Request("http://localhost/", { headers });
  }

  it("uses the entry appended by the trusted proxy, not client-supplied ones", () => {
    expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("honours a configured number of trusted proxy hops", () => {
    process.env["TRUSTED_PROXY_HOPS"] = "2";
    expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.2" }))).toBe("203.0.113.9");
  });

  it("ignores forwarding headers when no proxy is trusted", () => {
    process.env["TRUSTED_PROXY_HOPS"] = "0";
    expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6" }))).toBe("unknown");
  });

  it("does not trust x-real-ip by default", () => {
    expect(getClientIp(req({ "x-real-ip": "6.6.6.6" }))).toBe("unknown");
  });

  it("prefers an explicitly trusted edge header", () => {
    process.env["TRUSTED_CLIENT_IP_HEADER"] = "cf-connecting-ip";
    expect(getClientIp(req({ "cf-connecting-ip": "198.51.100.4", "x-forwarded-for": "6.6.6.6" }))).toBe("198.51.100.4");
  });
});
