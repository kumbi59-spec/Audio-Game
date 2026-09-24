import { createHmac } from "node:crypto";

/**
 * Mints lobby tokens in the v2 format verified by the API service
 * (apps/api/src/state/tokens.ts — keep the two in sync). Both apps share
 * SESSION_SIGNING_KEY. Claims bind the token to a subject (the signed-in
 * user), the campaign, the lobby audience, and a short expiry.
 */
export const LOBBY_TOKEN_AUDIENCE = "echoquest:lobby";
export const LOBBY_TOKEN_TTL_SECONDS = 300;

const CAMPAIGN_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

export function isValidCampaignId(campaignId: string): boolean {
  return CAMPAIGN_ID_PATTERN.test(campaignId);
}

export function issueLobbyToken(
  campaignId: string,
  subject: string,
  signingKey: string,
  nowMs: number = Date.now(),
): string {
  const iat = Math.floor(nowMs / 1000);
  const claims = {
    sub: subject,
    cid: campaignId,
    aud: LOBBY_TOKEN_AUDIENCE,
    iat,
    exp: iat + LOBBY_TOKEN_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", signingKey).update(`lobby-v2:${payload}`).digest("base64url");
  return `v2.${payload}.${sig}`;
}
