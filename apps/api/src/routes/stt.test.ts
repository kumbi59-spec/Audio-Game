import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "../server.js";
import { clearSttRateLimit } from "./stt.js";

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
  clearSttRateLimit();
});

function stubDeepgram(): void {
  vi.stubEnv("DEEPGRAM_API_KEY", "dg_test_key");
  vi.stubEnv("DEEPGRAM_PROJECT_ID", "project-1");
}

function mintedKey(): Response {
  return new Response(
    JSON.stringify({ key: "temp-key", api_key_id: "key-1", expiration_date: "2026-01-01T00:00:00Z" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("GET /stt/status", () => {
  it("reports availability without minting a key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.stubEnv("DEEPGRAM_API_KEY", "");
    const off = await app.inject({ method: "GET", url: "/stt/status" });
    expect(off.json()).toEqual({ available: false });

    stubDeepgram();
    const on = await app.inject({ method: "GET", url: "/stt/status" });
    expect(on.json()).toEqual({ available: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("POST /stt/token", () => {
  it("answers 503, not 429, to repeated calls when Deepgram isn't configured", async () => {
    vi.stubEnv("DEEPGRAM_API_KEY", "");
    for (let i = 0; i < 12; i += 1) {
      const res = await app.inject({ method: "POST", url: "/stt/token" });
      expect(res.statusCode).toBe(503);
    }
  });

  it("allows several mints a minute before limiting", async () => {
    stubDeepgram();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => mintedKey());
    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await app.inject({ method: "POST", url: "/stt/token" })).statusCode);
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("only counts successful mints against the limit", async () => {
    stubDeepgram();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockImplementation(async () => new Response("upstream down", { status: 500 }));
    for (let i = 0; i < 12; i += 1) {
      expect((await app.inject({ method: "POST", url: "/stt/token" })).statusCode).toBe(502);
    }

    fetchSpy.mockImplementation(async () => mintedKey());
    const res = await app.inject({ method: "POST", url: "/stt/token" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ token: "temp-key", keyId: "key-1" });
  });
});
