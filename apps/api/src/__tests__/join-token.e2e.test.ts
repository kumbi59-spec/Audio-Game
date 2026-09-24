import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../server.js";
import { closeStore } from "../state/store.js";
import { verifyLobbyToken } from "../state/tokens.js";

let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  app = await buildServer({ logLevel: "warn" });
});

afterAll(async () => {
  await app.close();
  await closeStore();
});

describe("GET /campaigns/:id/join-token", () => {
  it("refuses campaigns this API doesn't know (e.g. web-hosted lobbies)", async () => {
    const res = await app.inject({ method: "GET", url: "/campaigns/lobby-not-here/join-token" });
    expect(res.statusCode).toBe(404);
  });

  it("issues a lobby token for a campaign created here", async () => {
    const created = await app.inject({ method: "POST", url: "/campaigns", payload: {} });
    expect(created.statusCode).toBe(200);
    const { campaignId } = created.json() as { campaignId: string };

    const res = await app.inject({ method: "GET", url: `/campaigns/${campaignId}/join-token` });
    expect(res.statusCode).toBe(200);
    const { token } = res.json() as { token: string };
    expect(verifyLobbyToken(token, campaignId)?.subject).toMatch(/^anon:/);
  });
});
