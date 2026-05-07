import { prisma } from "@/lib/db";

type RateLimitRecord = {
  count: number;
  resetAt: Date;
  cooldownUntil: Date | null;
};

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

function now() {
  return new Date();
}

function secondsUntil(date: Date) {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
}

class DbRateLimitStore implements RateLimitStore {
  async consume(rule: RateLimitRule): Promise<RateLimitDecision> {
    const key = rule.key;
    const current = await this.get(key);
    const currentNow = now();

    if (current?.cooldownUntil && current.cooldownUntil > currentNow) {
      return { allowed: false, retryAfterSeconds: secondsUntil(current.cooldownUntil) };
    }

    const startNewWindow = !current || current.resetAt <= currentNow;
    const shouldIncrement = !rule.incrementOnFailureOnly || Boolean(rule.wasFailure);
    const nextCount = startNewWindow ? (shouldIncrement ? 1 : 0) : current.count + (shouldIncrement ? 1 : 0);
    const resetAt = startNewWindow
      ? new Date(currentNow.getTime() + rule.windowSeconds * 1000)
      : current.resetAt;

    let cooldownUntil: Date | null = null;
    if (nextCount > rule.limit && rule.cooldownSeconds && rule.cooldownSeconds > 0) {
      cooldownUntil = new Date(currentNow.getTime() + rule.cooldownSeconds * 1000);
    }

    await prisma.$executeRaw`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "cooldownUntil", "updatedAt")
      VALUES (${key}, ${nextCount}, ${resetAt}, ${cooldownUntil}, NOW())
      ON CONFLICT ("key")
      DO UPDATE SET "count" = EXCLUDED."count", "resetAt" = EXCLUDED."resetAt", "cooldownUntil" = EXCLUDED."cooldownUntil", "updatedAt" = NOW()
    `;

    if (nextCount > rule.limit) {
      return { allowed: false, retryAfterSeconds: cooldownUntil ? secondsUntil(cooldownUntil) : secondsUntil(resetAt) };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  private async get(key: string): Promise<RateLimitRecord | null> {
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date; cooldownUntil: Date | null }>>`
      SELECT "count", "resetAt", "cooldownUntil" FROM "RateLimitBucket" WHERE "key" = ${key} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rows[0]!;
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

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
