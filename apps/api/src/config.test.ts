import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadDotEnv, parseConfig } from "./config.js";

describe("parseConfig", () => {
  it.each(["false", "0", "off", "no", "FALSE", " No "])(
    "reads GM_CIRCUIT_BREAKER_ENABLED=%j as false",
    (value) => {
      expect(parseConfig({ GM_CIRCUIT_BREAKER_ENABLED: value }).GM_CIRCUIT_BREAKER_ENABLED).toBe(false);
    },
  );

  it.each(["true", "1", "on", "yes"])("reads GM_CIRCUIT_BREAKER_ENABLED=%j as true", (value) => {
    expect(parseConfig({ GM_CIRCUIT_BREAKER_ENABLED: value }).GM_CIRCUIT_BREAKER_ENABLED).toBe(true);
  });

  it("uses the default when a boolean is unset or empty", () => {
    expect(parseConfig({}).GM_CIRCUIT_BREAKER_ENABLED).toBe(true);
    expect(parseConfig({ GM_CIRCUIT_BREAKER_ENABLED: "" }).GM_CIRCUIT_BREAKER_ENABLED).toBe(true);
    expect(parseConfig({}).ENABLE_DEV_TIER_TOKENS).toBe(false);
  });

  it("rejects an unrecognised boolean instead of guessing", () => {
    expect(() => parseConfig({ GM_CIRCUIT_BREAKER_ENABLED: "flase" })).toThrow();
  });

  it("refuses to boot in production with an unset or default signing key", () => {
    expect(() => parseConfig({ NODE_ENV: "production" })).toThrow(/SESSION_SIGNING_KEY/);
    expect(() =>
      parseConfig({ NODE_ENV: "production", SESSION_SIGNING_KEY: "dev-insecure-change-me" }),
    ).toThrow(/SESSION_SIGNING_KEY/);
    expect(() => parseConfig({ NODE_ENV: "production", SESSION_SIGNING_KEY: "change-me" })).toThrow(
      /SESSION_SIGNING_KEY/,
    );
    expect(() => parseConfig({ NODE_ENV: "production", SESSION_SIGNING_KEY: "  " })).toThrow(
      /SESSION_SIGNING_KEY/,
    );
  });

  it("accepts a real signing key in production, and the dev default outside it", () => {
    expect(
      parseConfig({ NODE_ENV: "production", SESSION_SIGNING_KEY: "a-real-32-byte-secret-value" })
        .SESSION_SIGNING_KEY,
    ).toBe("a-real-32-byte-secret-value");
    expect(parseConfig({ NODE_ENV: "development" }).SESSION_SIGNING_KEY).toBe("dev-insecure-change-me");
  });

  it("parses TRUST_PROXY_HOPS with a default of one hop", () => {
    expect(parseConfig({}).TRUST_PROXY_HOPS).toBe(1);
    expect(parseConfig({ TRUST_PROXY_HOPS: "0" }).TRUST_PROXY_HOPS).toBe(0);
  });

  it("parses DATABASE_POOL_MAX with pg's default of ten", () => {
    expect(parseConfig({}).DATABASE_POOL_MAX).toBe(10);
    expect(parseConfig({ DATABASE_POOL_MAX: "5" }).DATABASE_POOL_MAX).toBe(5);
    expect(() => parseConfig({ DATABASE_POOL_MAX: "0" })).toThrow();
  });
});

describe("loadDotEnv", () => {
  function writeEnv(contents: string): string {
    const dir = mkdtempSync(join(tmpdir(), "api-dotenv-"));
    const path = join(dir, ".env");
    writeFileSync(path, contents);
    return path;
  }

  it("loads unset variables without overriding ones already set", () => {
    const path = writeEnv(
      [
        "# comment",
        "ANTHROPIC_API_KEY=sk-from-file",
        "PORT=4100",
        'SESSION_SIGNING_KEY="quoted secret"',
        "export CLAUDE_GM_MODEL=claude-sonnet-5-5 # inline note",
        "DEEPGRAM_API_KEY=",
        "",
      ].join("\n"),
    );
    const env: NodeJS.ProcessEnv = { PORT: "5000" };
    loadDotEnv(path, env);
    expect(env).toEqual({
      PORT: "5000",
      ANTHROPIC_API_KEY: "sk-from-file",
      SESSION_SIGNING_KEY: "quoted secret",
      CLAUDE_GM_MODEL: "claude-sonnet-5-5",
    });
  });

  it("does nothing when the file is missing", () => {
    const env: NodeJS.ProcessEnv = {};
    loadDotEnv(join(tmpdir(), "definitely-missing", ".env"), env);
    expect(env).toEqual({});
  });
});
