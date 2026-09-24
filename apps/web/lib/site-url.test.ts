import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPublicOrigin, isSameSiteOrigin } from "./site-url";

const KEYS = ["NEXT_PUBLIC_SITE_URL", "NEXTAUTH_URL", "SITE_ORIGIN_ALLOWLIST", "NODE_ENV"] as const;
const saved: Record<string, string | undefined> = {};
const env = process.env as Record<string, string | undefined>;

function req(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { method: "POST", headers });
}

describe("site origin helpers", () => {
  beforeEach(() => {
    for (const k of KEYS) saved[k] = env[k];
    for (const k of KEYS) delete env[k];
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete env[k];
      else env[k] = saved[k];
    }
  });

  it("ignores forged Host / X-Forwarded-Host headers when a site URL is configured", () => {
    env["NEXT_PUBLIC_SITE_URL"] = "https://echoquest.us";
    const forged = req("https://evil.example/api/x", {
      host: "evil.example",
      "x-forwarded-host": "evil.example",
    });
    expect(getPublicOrigin(forged)).toBe("https://echoquest.us");
  });

  it("falls back to the default canonical site in production, never the request", () => {
    env["NODE_ENV"] = "production";
    expect(getPublicOrigin(req("https://evil.example/api/x"))).toBe("https://echoquest.us");
  });

  it("uses the request origin only in development without configuration", () => {
    env["NODE_ENV"] = "development";
    expect(getPublicOrigin(req("http://localhost:3000/api/x"))).toBe("http://localhost:3000");
  });

  it("accepts configured origins and their www twins", () => {
    env["NEXT_PUBLIC_SITE_URL"] = "https://echoquest.us";
    env["NEXTAUTH_URL"] = "https://echoquest-web.onrender.com";
    for (const origin of ["https://echoquest.us", "https://www.echoquest.us", "https://echoquest-web.onrender.com"]) {
      expect(isSameSiteOrigin(req("https://echoquest.us/api/x", { origin }))).toBe(true);
    }
  });

  it("rejects missing and foreign origins", () => {
    env["NEXT_PUBLIC_SITE_URL"] = "https://echoquest.us";
    expect(isSameSiteOrigin(req("https://echoquest.us/api/x"))).toBe(false);
    expect(isSameSiteOrigin(req("https://echoquest.us/api/x", { origin: "https://evil.example" }))).toBe(false);
    expect(isSameSiteOrigin(req("https://echoquest.us/api/x", { origin: "https://echoquest.us.evil.example" }))).toBe(false);
  });
});
