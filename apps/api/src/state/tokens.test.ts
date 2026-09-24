import { describe, expect, it } from "vitest";
import {
  LOBBY_TOKEN_TTL_SECONDS,
  issueLobbyToken,
  issueSessionToken,
  verifyLobbyToken,
  verifySessionToken,
} from "./tokens.js";

const NOW = Date.UTC(2026, 8, 24, 12, 0, 0);

describe("lobby tokens", () => {
  it("accepts a fresh token for its own campaign and returns the subject", () => {
    const token = issueLobbyToken("camp-1", "user-1", NOW);
    expect(verifyLobbyToken(token, "camp-1", NOW + 1_000)).toEqual({ subject: "user-1" });
  });

  it("rejects a token presented for a different campaign", () => {
    const token = issueLobbyToken("camp-1", "user-1", NOW);
    expect(verifyLobbyToken(token, "camp-2", NOW)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = issueLobbyToken("camp-1", "user-1", NOW);
    expect(verifyLobbyToken(token, "camp-1", NOW + (LOBBY_TOKEN_TTL_SECONDS + 1) * 1000)).toBeNull();
  });

  it("rejects tampered claims", () => {
    const token = issueLobbyToken("camp-1", "user-1", NOW);
    const [v, payload, sig] = token.split(".");
    const claims = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
    claims.cid = "camp-2";
    const forged = `${v}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${sig}`;
    expect(verifyLobbyToken(forged, "camp-2", NOW)).toBeNull();
  });

  it("rejects legacy campaign tokens in the lobby", () => {
    expect(verifyLobbyToken(issueSessionToken("camp-1"), "camp-1", NOW)).toBeNull();
  });

  it("never validates a lobby token as a campaign token", () => {
    const token = issueLobbyToken("v2", "user-1", NOW);
    expect(verifySessionToken(token, "v2")).toBe(false);
  });
});
