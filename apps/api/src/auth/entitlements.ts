import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { config } from "../config.js";

export type UserTier = "free" | "storyteller" | "creator" | "enterprise";

export const TIER_RANK: Record<UserTier, number> = {
  free: 0,
  storyteller: 1,
  creator: 2,
  enterprise: 3,
};

function sign(payload: string): string {
  return createHmac("sha256", config.SESSION_SIGNING_KEY)
    .update(payload)
    .digest("base64url");
}

export function issueTierToken(tier: UserTier): string {
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${tier}.${nonce}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function verifyTierToken(token: string): UserTier | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [tier, nonce, sig] = parts;
  if (!tier || !nonce || !sig) return null;
  const expected = sign(`${tier}.${nonce}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  if (!(tier in TIER_RANK)) return null;
  return tier as UserTier;
}

export function tierFromRequest(req: FastifyRequest): UserTier {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return "free";
  const token = auth.slice(7);
  return verifyTierToken(token) ?? "free";
}

export function requireTier(minTier: UserTier): preHandlerAsyncHookHandler {
  return async function (req, reply) {
    const actualTier = tierFromRequest(req);
    if (TIER_RANK[actualTier] < TIER_RANK[minTier]) {
      return reply.status(403).send({
        error: "forbidden",
        requiredTier: minTier,
        yourTier: actualTier,
      });
    }
  };
}
