import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * config is read once at import, so each case stubs the env and imports a
 * fresh copy of the server.
 */
async function serverWithEnv(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  const { buildServer } = await import("../server.js");
  return buildServer({ logLevel: "silent" });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /auth/token", () => {
  it("is not mounted by default", async () => {
    const app = await serverWithEnv({});
    const res = await app.inject({ method: "POST", url: "/auth/token", payload: { tier: "enterprise" } });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("mints tier tokens when ENABLE_DEV_TIER_TOKENS=true outside production", async () => {
    const app = await serverWithEnv({ ENABLE_DEV_TIER_TOKENS: "true", NODE_ENV: "development" });
    const res = await app.inject({ method: "POST", url: "/auth/token", payload: { tier: "storyteller" } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ tier: "storyteller" });
    await app.close();
  });

  it("stays unmounted in production even when enabled", async () => {
    const app = await serverWithEnv({
      ENABLE_DEV_TIER_TOKENS: "true",
      NODE_ENV: "production",
      SESSION_SIGNING_KEY: "a-real-production-secret",
    });
    const res = await app.inject({ method: "POST", url: "/auth/token", payload: { tier: "enterprise" } });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("is not mounted when ENABLE_DEV_TIER_TOKENS=false", async () => {
    const app = await serverWithEnv({ ENABLE_DEV_TIER_TOKENS: "false" });
    const res = await app.inject({ method: "POST", url: "/auth/token", payload: {} });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
