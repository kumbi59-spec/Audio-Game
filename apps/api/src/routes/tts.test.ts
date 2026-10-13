import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "../server.js";
import { issueTierToken } from "../auth/entitlements.js";
import { clearTtsRateLimit } from "./tts.js";

const storyteller = { authorization: `Bearer ${issueTierToken("storyteller")}` };

let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  app = await buildServer({ logLevel: "silent" });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  clearTtsRateLimit();
});

describe("GET /tts/stream", () => {
  it("returns 503 when ELEVENLABS_API_KEY is not set", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    const res = await app.inject({ method: "GET", url: "/tts/stream?text=Hello&voiceId=test", headers: storyteller });
    expect(res.statusCode).toBe(503);
    expect(res.json<{ error: string }>().error).toBe("tts_unavailable");
  });

  it("returns 400 when text param is missing", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    const res = await app.inject({ method: "GET", url: "/tts/stream?voiceId=test", headers: storyteller });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when text is empty", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    const res = await app.inject({ method: "GET", url: "/tts/stream?text=&voiceId=test", headers: storyteller });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when text exceeds 3000 chars", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    const res = await app.inject({ method: "GET", url: `/tts/stream?text=${"x".repeat(3001)}&voiceId=test`, headers: storyteller });
    expect(res.statusCode).toBe(400);
  });

  it("streams audio from ElevenLabs with correct headers", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    const fakeAudio = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(fakeAudio, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      }),
    );
    const res = await app.inject({ method: "GET", url: "/tts/stream?text=Hello+world&voiceId=21m00Tcm4TlvDq8ikWAM", headers: storyteller });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("audio/mpeg");
    expect(res.headers["cache-control"]).toContain("immutable");
  });

  it("returns 502 when ElevenLabs upstream fails", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "quota_exceeded" }), { status: 429 }),
    );
    const res = await app.inject({ method: "GET", url: "/tts/stream?text=Hello&voiceId=21m00Tcm4TlvDq8ikWAM", headers: storyteller });
    expect(res.statusCode).toBe(502);
    expect(res.json<{ error: string }>().error).toBe("tts_upstream_error");
  });

  it("uses the voiceRole-mapped ID when voiceRole is provided and voiceId is default", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    vi.stubEnv("ELEVENLABS_VOICE_NARRATOR", "custom_narrator_id");
    let capturedUrl = "";
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (url) => {
      capturedUrl = url as string;
      return new Response(Buffer.from([0xff]), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
    });
    await app.inject({ method: "GET", url: "/tts/stream?text=Hello&voiceRole=narrator", headers: storyteller });
    expect(capturedUrl).toContain("custom_narrator_id");
  });

  it("prefers the explicit voiceId over voiceRole when voiceId is non-default", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    vi.stubEnv("ELEVENLABS_VOICE_NARRATOR", "custom_narrator_id");
    let capturedUrl = "";
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (url) => {
      capturedUrl = url as string;
      return new Response(Buffer.from([0xff]), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
    });
    await app.inject({ method: "GET", url: "/tts/stream?text=Hello&voiceId=explicit_voice&voiceRole=narrator", headers: storyteller });
    expect(capturedUrl).toContain("explicit_voice");
    expect(capturedUrl).not.toContain("custom_narrator_id");
  });
});

describe("GET /tts/stream access", () => {
  it("requires a storyteller tier token", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const anonymous = await app.inject({ method: "GET", url: "/tts/stream?text=Hello" });
    expect(anonymous.statusCode).toBe(403);
    expect(anonymous.json()).toMatchObject({ error: "forbidden", requiredTier: "storyteller" });

    const free = await app.inject({
      method: "GET",
      url: "/tts/stream?text=Hello",
      headers: { authorization: `Bearer ${issueTierToken("free")}` },
    });
    expect(free.statusCode).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects models outside the allowlist", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    const res = await app.inject({
      method: "GET",
      url: "/tts/stream?text=Hello&model=eleven_multilingual_v2",
      headers: storyteller,
    });
    expect(res.statusCode).toBe(400);
  });

  it("rate-limits clips per IP", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test_key");
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response(Buffer.from([0xff]), { status: 200, headers: { "Content-Type": "audio/mpeg" } }),
    );
    const statuses: number[] = [];
    for (let i = 0; i < 61; i += 1) {
      const res = await app.inject({ method: "GET", url: `/tts/stream?text=Line+${i}`, headers: storyteller });
      statuses.push(res.statusCode);
    }
    expect(statuses.slice(0, 60).every((s) => s === 200)).toBe(true);
    expect(statuses[60]).toBe(429);
  });
});

describe("GET /tts/voices", () => {
  it("returns all four voice slots", async () => {
    const res = await app.inject({ method: "GET", url: "/tts/voices" });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, string>>();
    expect(body).toHaveProperty("narrator");
    expect(body).toHaveProperty("voice_a");
    expect(body).toHaveProperty("voice_b");
    expect(body).toHaveProperty("voice_c");
  });

  it("falls back to default Rachel voice when ELEVENLABS_VOICE_NARRATOR is unset", async () => {
    const res = await app.inject({ method: "GET", url: "/tts/voices" });
    expect(res.json<{ narrator: string }>().narrator).toBe("21m00Tcm4TlvDq8ikWAM");
  });

  it("uses the env-configured narrator voice when set", async () => {
    vi.stubEnv("ELEVENLABS_VOICE_NARRATOR", "my_custom_narrator");
    const res = await app.inject({ method: "GET", url: "/tts/voices" });
    expect(res.json<{ narrator: string }>().narrator).toBe("my_custom_narrator");
  });
});
