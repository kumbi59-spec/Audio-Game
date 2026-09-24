import { describe, expect, it } from "vitest";
import { issueLobbyToken, isValidCampaignId } from "./lobby-token";
// The API service is the verifier; importing it keeps the two formats in sync.
import { verifyLobbyToken } from "../../../api/src/state/tokens";

// Matches the API config's default SESSION_SIGNING_KEY (unset in tests).
const KEY = process.env["SESSION_SIGNING_KEY"] ?? "dev-insecure-change-me";

describe("web-issued lobby tokens", () => {
  it("verify on the API with the caller as subject", () => {
    const token = issueLobbyToken("session-123", "user-abc", KEY);
    expect(verifyLobbyToken(token, "session-123")).toEqual({ subject: "user-abc" });
  });

  it("are rejected by the API for another campaign", () => {
    const token = issueLobbyToken("session-123", "user-abc", KEY);
    expect(verifyLobbyToken(token, "session-999")).toBeNull();
  });

  it("are rejected by the API once expired", () => {
    const token = issueLobbyToken("session-123", "user-abc", KEY, Date.now() - 10 * 60 * 1000);
    expect(verifyLobbyToken(token, "session-123")).toBeNull();
  });

  it("are rejected when signed with a different key", () => {
    const token = issueLobbyToken("session-123", "user-abc", "some-other-key");
    expect(verifyLobbyToken(token, "session-123")).toBeNull();
  });
});

describe("isValidCampaignId", () => {
  it("accepts generated ids and rejects path or delimiter characters", () => {
    expect(isValidCampaignId("session-1727000000000")).toBe(true);
    expect(isValidCampaignId("0b6c6f5e-8d1a-4c4b-9f1e-2a4d5c6b7e8f")).toBe(true);
    expect(isValidCampaignId("a.b")).toBe(false);
    expect(isValidCampaignId("../x")).toBe(false);
    expect(isValidCampaignId("")).toBe(false);
    expect(isValidCampaignId("x".repeat(101))).toBe(false);
  });
});
