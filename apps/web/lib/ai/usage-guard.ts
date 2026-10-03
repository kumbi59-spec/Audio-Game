import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { consumeFreeAiMinute, resetDailyMinutesIfNeeded } from "@/lib/db/queries/users";
import type { Player } from "@/lib/auth/player-identity";

/**
 * Gate in front of every model call made on behalf of a player: per-player
 * and per-IP rate limits, a per-player cap on concurrent streams, and the
 * free-tier AI-minute debit. All checks run before the model is invoked.
 */

export type AiUsageKind = "turn" | "opening" | "authoring";

const LIMITS: Record<AiUsageKind, { player: number; ip: number; windowSeconds: number }> = {
  turn: { player: 30, ip: 60, windowSeconds: 60 },
  opening: { player: 10, ip: 20, windowSeconds: 60 * 60 },
  // World-building helpers (wizard suggestions, notes import, bible re-parse).
  authoring: { player: 30, ip: 60, windowSeconds: 10 * 60 },
};

export const MAX_CONCURRENT_STREAMS_PER_PLAYER = 2;

// Per-instance bookkeeping. The shared rate limits above bound total volume
// across instances; this only stops one player fanning out parallel streams.
const activeStreams = new Map<string, number>();

export type AiUsageDenial = {
  status: number;
  error: string;
  message: string;
  retryAfterSeconds?: number;
};

export type AiUsageGrant = { release: () => void };

function acquireStreamSlot(userId: string): AiUsageGrant | null {
  const current = activeStreams.get(userId) ?? 0;
  if (current >= MAX_CONCURRENT_STREAMS_PER_PLAYER) return null;
  activeStreams.set(userId, current + 1);
  let released = false;
  return {
    release() {
      if (released) return;
      released = true;
      const n = (activeStreams.get(userId) ?? 1) - 1;
      if (n <= 0) activeStreams.delete(userId);
      else activeStreams.set(userId, n);
    },
  };
}

async function checkRateLimits(
  kind: AiUsageKind,
  userId: string,
  ip: string,
): Promise<AiUsageDenial | null> {
  const limits = LIMITS[kind];
  for (const rule of [
    { key: `ai:${kind}:player:${userId}`, limit: limits.player },
    { key: `ai:${kind}:ip:${ip}`, limit: limits.ip },
  ]) {
    const decision = await consumeRateLimit({ ...rule, windowSeconds: limits.windowSeconds });
    if (!decision.allowed) {
      return {
        status: 429,
        error: "rate_limited",
        message: "Too many requests. Please wait a moment and try again.",
        retryAfterSeconds: decision.retryAfterSeconds,
      };
    }
  }
  return null;
}

/**
 * Rate limits for the signed-in world-building helpers, which call the model
 * without a game session (so no stream slot or AI-minute debit). Returns a
 * 429 response when the caller is over the limit, otherwise null.
 */
export async function limitAuthoringRequest(
  req: Request,
  user: { id: string; isAdmin?: boolean },
): Promise<Response | null> {
  if (user.isAdmin) return null;
  const denial = await checkRateLimits("authoring", user.id, getClientIp(req));
  return denial ? aiUsageDenialResponse(denial) : null;
}

export async function authorizeAiUsage(
  req: Request,
  player: Player,
  kind: AiUsageKind,
): Promise<{ ok: true; grant: AiUsageGrant } | { ok: false; denial: AiUsageDenial }> {
  if (!player.isAdmin) {
    const denial = await checkRateLimits(kind, player.userId, getClientIp(req));
    if (denial) return { ok: false, denial };
  }

  const grant = acquireStreamSlot(player.userId);
  if (!grant) {
    return {
      ok: false,
      denial: {
        status: 429,
        error: "too_many_concurrent_requests",
        message: "Another turn is still being generated. Please wait for it to finish.",
      },
    };
  }

  if (player.tier === "free" && !player.isAdmin) {
    try {
      await resetDailyMinutesIfNeeded(player.userId, player.tier);
      const consumed = await consumeFreeAiMinute(player.userId);
      if (!consumed) {
        grant.release();
        return {
          ok: false,
          denial: {
            status: 402,
            error: "ai_minutes_exhausted",
            message: "You have used all free AI minutes for today. Upgrade or buy extra minutes to continue.",
          },
        };
      }
    } catch (err) {
      grant.release();
      throw err;
    }
  }

  return { ok: true, grant };
}

export function aiUsageDenialResponse(denial: AiUsageDenial): Response {
  const headers: Record<string, string> = {};
  if (denial.retryAfterSeconds) headers["Retry-After"] = String(denial.retryAfterSeconds);
  return Response.json(
    { error: denial.error, message: denial.message },
    { status: denial.status, headers },
  );
}

/** Test hook: clears in-process stream bookkeeping. */
export function __resetActiveStreamsForTests() {
  activeStreams.clear();
}
