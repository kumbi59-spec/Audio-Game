import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  reserveTtsChars: vi.fn(),
  refundTtsChars: vi.fn(),
  recordTtsChars: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/db/queries/users", () => ({
  reserveTtsChars: mocks.reserveTtsChars,
  refundTtsChars: mocks.refundTtsChars,
  recordTtsChars: mocks.recordTtsChars,
}));

import { NextRequest } from "next/server";
import { POST } from "./route";

const env = process.env as Record<string, string | undefined>;
let savedKey: string | undefined;

function ttsRequest(text = "The door creaks open.") {
  return new NextRequest("https://echoquest.us/api/game/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

function signedIn(tier: string) {
  mocks.auth.mockResolvedValue({ user: { id: "user_1", tier } });
}

describe("POST /api/game/tts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedKey = env["ELEVENLABS_API_KEY"];
    env["ELEVENLABS_API_KEY"] = "test-key";
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.fetch.mockResolvedValue(new Response("mp3-bytes", { status: 200 }));
    mocks.reserveTtsChars.mockResolvedValue(true);
    mocks.refundTtsChars.mockResolvedValue(undefined);
    mocks.recordTtsChars.mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (savedKey === undefined) delete env["ELEVENLABS_API_KEY"];
    else env["ELEVENLABS_API_KEY"] = savedKey;
  });

  it("treats enterprise's null cap as unlimited, not as no premium voice", async () => {
    signedIn("enterprise");

    const res = await POST(ttsRequest());

    expect(res.status).toBe(200);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.reserveTtsChars).not.toHaveBeenCalled();
    expect(mocks.recordTtsChars).toHaveBeenCalledWith("user_1", "The door creaks open.".length);
  });

  it("keeps free and unknown tiers off ElevenLabs", async () => {
    for (const tier of ["free", "toString"]) {
      signedIn(tier);
      const res = await POST(ttsRequest());
      expect(res.status).toBe(403);
    }
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("reserves capped characters before calling upstream", async () => {
    signedIn("storyteller");
    mocks.fetch.mockImplementation(async () => {
      expect(mocks.reserveTtsChars).toHaveBeenCalledWith("user_1", 21, 40_000, expect.any(Date));
      return new Response("mp3-bytes", { status: 200 });
    });

    const res = await POST(ttsRequest());

    expect(res.status).toBe(200);
    expect(mocks.refundTtsChars).not.toHaveBeenCalled();
    // Already counted by the reservation.
    expect(mocks.recordTtsChars).not.toHaveBeenCalled();
  });

  it("returns tts_cap_reached without calling upstream when the reservation is refused", async () => {
    signedIn("storyteller");
    mocks.reserveTtsChars.mockResolvedValue(false);
    mocks.findUnique.mockResolvedValue({ ttsCharsUsedThisMonth: 39_990, ttsCharsResetAt: new Date() });

    const res = await POST(ttsRequest());

    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: "tts_cap_reached", charsUsed: 39_990, cap: 40_000 });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("refunds the reservation when ElevenLabs rejects the request", async () => {
    signedIn("creator");
    mocks.fetch.mockResolvedValue(Response.json({ detail: { message: "quota exceeded" } }, { status: 401 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(ttsRequest());

    expect(res.status).toBe(401);
    const [, reservedChars, , reservedAt] = mocks.reserveTtsChars.mock.calls[0]!;
    expect(mocks.refundTtsChars).toHaveBeenCalledWith("user_1", reservedChars, reservedAt);
  });

  it("refunds the reservation when the upstream request throws", async () => {
    signedIn("creator");
    mocks.fetch.mockRejectedValue(new TypeError("fetch failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(ttsRequest());

    expect(res.status).toBe(502);
    expect(mocks.refundTtsChars).toHaveBeenCalledWith("user_1", 21, expect.any(Date));
  });

  it("does not leave an unhandled rejection when recording unlimited usage fails", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin_1", tier: "free", isAdmin: true } });
    mocks.recordTtsChars.mockRejectedValue(new Error("db down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(ttsRequest());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.status).toBe(200);
    expect(consoleError).toHaveBeenCalledWith("Failed to record ElevenLabs character usage", expect.anything());
  });
});
