import { prisma } from "@/lib/db";

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type RateLimitRule = {
  key: string;
  limit: number;
  windowSeconds: number;
  cooldownSeconds?: number;
  incrementOnFailureOnly?: boolean;
  wasFailure?: boolean;
};

type RateLimitStore = {
  consume(rule: RateLimitRule): Promise<RateLimitDecision>;
};

function secondsUntil(date: Date) {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
}

type BucketRow = { count: number; resetAt: Date; cooldownUntil: Date | null };

/**
 * Postgres-backed limiter. The whole read-modify-write happens in a single
 * upsert so concurrent callers can't read the same count and overwrite each
 * other's increments.
 */
class DbRateLimitStore implements RateLimitStore {
  async consume(rule: RateLimitRule): Promise<RateLimitDecision> {
    const key = rule.key;
    const now = new Date();
    const increment = !rule.incrementOnFailureOnly || Boolean(rule.wasFailure) ? 1 : 0;
    const newResetAt = new Date(now.getTime() + rule.windowSeconds * 1000);

    // While a cooldown is active the bucket is left untouched; an expired
    // window restarts at `increment`; otherwise the count grows in place.
    const rows = await prisma.$queryRaw<BucketRow[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "cooldownUntil", "updatedAt")
      VALUES (${key}, ${increment}, ${newResetAt}, NULL, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."cooldownUntil" > ${now} THEN "RateLimitBucket"."count"
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${increment}
          ELSE "RateLimitBucket"."count" + ${increment}
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."cooldownUntil" > ${now} THEN "RateLimitBucket"."resetAt"
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${newResetAt}
          ELSE "RateLimitBucket"."resetAt"
        END,
        "cooldownUntil" = CASE
          WHEN "RateLimitBucket"."cooldownUntil" > ${now} THEN "RateLimitBucket"."cooldownUntil"
          ELSE NULL
        END,
        "updatedAt" = ${now}
      RETURNING "count", "resetAt", "cooldownUntil"
    `;
    const bucket = rows[0];
    if (!bucket) throw new Error("rate limit upsert returned no row");

    if (bucket.cooldownUntil && bucket.cooldownUntil > now) {
      return { allowed: false, retryAfterSeconds: secondsUntil(bucket.cooldownUntil) };
    }

    if (bucket.count > rule.limit) {
      if (rule.cooldownSeconds && rule.cooldownSeconds > 0) {
        const cooldownUntil = new Date(now.getTime() + rule.cooldownSeconds * 1000);
        await prisma.$executeRaw`
          UPDATE "RateLimitBucket" SET "cooldownUntil" = ${cooldownUntil}
          WHERE "key" = ${key} AND ("cooldownUntil" IS NULL OR "cooldownUntil" <= ${now})
        `;
        return { allowed: false, retryAfterSeconds: secondsUntil(cooldownUntil) };
      }
      return { allowed: false, retryAfterSeconds: secondsUntil(bucket.resetAt) };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }
}

class UpstashRateLimitStore implements RateLimitStore {
  constructor(private readonly url: string, private readonly token: string) {}
  async consume(rule: RateLimitRule): Promise<RateLimitDecision> {
    // Keep behavior consistent with DB fallback by delegating to DB when Redis call fails.
    try {
      const endpoint = `${this.url}/pipeline`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["INCR", rule.key], ["TTL", rule.key], ["EXPIRE", rule.key, rule.windowSeconds, "NX"]]),
      });
      if (!res.ok) throw new Error(`redis ${res.status}`);
      const json = await res.json() as Array<{ result: number }>;
      const count = Number(json[0]?.result ?? 0);
      const ttl = Number(json[1]?.result ?? rule.windowSeconds);
      if (count > rule.limit) {
        return { allowed: false, retryAfterSeconds: Math.max(1, ttl) };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    } catch {
      return new DbRateLimitStore().consume(rule);
    }
  }
}

function createStore(): RateLimitStore {
  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];
  if (url && token) return new UpstashRateLimitStore(url, token);
  return new DbRateLimitStore();
}

const store = createStore();

export async function consumeRateLimit(rule: RateLimitRule) {
  return store.consume(rule);
}

/**
 * Client IP for rate-limit keys. Forwarding headers are client-controlled
 * unless a proxy we trust rewrites them, so:
 *
 * - `TRUSTED_CLIENT_IP_HEADER` (e.g. `cf-connecting-ip`) names a header set
 *   by the edge that is used verbatim when present;
 * - otherwise `X-Forwarded-For` is read from the right: each of the
 *   `TRUSTED_PROXY_HOPS` (default 1) trusted proxies appends one entry, so the
 *   entry they appended is the address the outermost trusted proxy saw.
 *   Entries further left were supplied by the client and are ignored.
 * - `TRUSTED_PROXY_HOPS=0` (direct-to-origin) ignores forwarding headers.
 */
export function getClientIp(req: Request) {
  const trustedHeader = process.env["TRUSTED_CLIENT_IP_HEADER"]?.trim().toLowerCase();
  if (trustedHeader) {
    const value = req.headers.get(trustedHeader)?.trim();
    if (value) return value;
  }

  const hopsRaw = Number.parseInt(process.env["TRUSTED_PROXY_HOPS"] ?? "1", 10);
  const hops = Number.isFinite(hopsRaw) && hopsRaw >= 0 ? hopsRaw : 1;
  if (hops === 0) return "unknown";

  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const entries = forwarded.split(",").map((e) => e.trim()).filter(Boolean);
  if (entries.length === 0) return "unknown";
  return entries[Math.max(0, entries.length - hops)]!;
}
