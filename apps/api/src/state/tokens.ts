import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

/**
 * Minimal session tokens for the campaign WebSocket. The production build
 * will swap this for Supabase/Clerk-issued JWTs; until then a signed
 * `campaignId.nonce.sig` token is enough to keep the WS route from being
 * openly callable.
 */

export function issueSessionToken(campaignId: string): string {
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${campaignId}.${nonce}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string, campaignId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokCampaign, nonce, sig] = parts;
  if (!tokCampaign || !nonce || !sig) return false;
  if (tokCampaign !== campaignId) return false;
  const expected = sign(`${tokCampaign}.${nonce}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return createHmac("sha256", config.SESSION_SIGNING_KEY)
    .update(payload)
    .digest("base64url");
}
