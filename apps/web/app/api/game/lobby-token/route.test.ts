import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  authorizeLobbyAccess: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/multiplayer/lobbies", () => ({ authorizeLobbyAccess: mocks.authorizeLobbyAccess }));

import { NextRequest } from "next/server";
import { GET } from "./route";

function req(query: string) {
  return new NextRequest(`http://localhost/api/game/lobby-token?${query}`);
}

describe("GET /api/game/lobby-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.authorizeLobbyAccess.mockResolvedValue({ ok: true, inviteCode: "code123", isHost: false });
  });

  it("requires sign-in", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET(req("campaignId=lobby-1"))).status).toBe(401);
  });

  it("rejects malformed campaign ids before any lookup", async () => {
    expect((await GET(req("campaignId=a.b"))).status).toBe(400);
    expect(mocks.authorizeLobbyAccess).not.toHaveBeenCalled();
  });

  it("refuses callers who are neither members nor invited", async () => {
    mocks.authorizeLobbyAccess.mockResolvedValue({ ok: false, status: 403, error: "not_invited" });
    const res = await GET(req("campaignId=lobby-1"));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("not_invited");
  });

  it("passes the invite code through and returns a token for members", async () => {
    const res = await GET(req("campaignId=lobby-1&invite=code123"));
    expect(res.status).toBe(200);
    expect(mocks.authorizeLobbyAccess).toHaveBeenCalledWith("lobby-1", "u1", "code123");
    const body = await res.json();
    expect(body.token).toMatch(/^v2\./);
    expect(body.inviteCode).toBe("code123");
  });
});
