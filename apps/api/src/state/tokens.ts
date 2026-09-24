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

/**
 * Lobby tokens (v2). Unlike the campaign tokens above they carry a subject,
 * audience, issue time and a short expiry, so a leaked token stops working
 * within minutes and can't be replayed against another campaign or purpose.
 *
 * Format: `v2.<base64url(JSON claims)>.<sig>`. The signature is over a
 * domain-separated string so it can never validate as a campaign token.
 * apps/web/lib/multiplayer/lobby-token.ts mints the same format.
 */
export const LOBBY_TOKEN_AUDIENCE = "echoquest:lobby";
export const LOBBY_TOKEN_TTL_SECONDS = 300;

interface LobbyTokenClaims {
  sub: string;
  cid: string;
  aud: string;
  iat: number;
  exp: number;
}

function signLobby(payload: string): string {
  return createHmac("sha256", config.SESSION_SIGNING_KEY)
    .update(`lobby-v2:${payload}`)
    .digest("base64url");
}

export function issueLobbyToken(
  campaignId: string,
  subject: string,
  nowMs: number = Date.now(),
): string {
  const iat = Math.floor(nowMs / 1000);
  const claims: LobbyTokenClaims = {
    sub: subject,
    cid: campaignId,
    aud: LOBBY_TOKEN_AUDIENCE,
    iat,
    exp: iat + LOBBY_TOKEN_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `v2.${payload}.${signLobby(payload)}`;
}

export function verifyLobbyToken(
  token: string,
  campaignId: string,
  nowMs: number = Date.now(),
): { subject: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v2") return null;
  const [, payload, sig] = parts;
  if (!payload || !sig) return null;

  const a = Buffer.from(sig);
  const b = Buffer.from(signLobby(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let claims: Partial<LobbyTokenClaims>;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<LobbyTokenClaims>;
  } catch {
    return null;
  }
  const now = Math.floor(nowMs / 1000);
  if (claims.aud !== LOBBY_TOKEN_AUDIENCE) return null;
  if (claims.cid !== campaignId) return null;
  if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;
  if (typeof claims.iat !== "number" || typeof claims.exp !== "number") return null;
  if (claims.exp <= now || claims.iat > now + 60) return null;
  if (claims.exp - claims.iat > LOBBY_TOKEN_TTL_SECONDS) return null;
  return { subject: claims.sub };
}
