import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/** Dev-only signing keys: the schema default and the .env.example placeholder. */
const INSECURE_SIGNING_KEYS = new Set(["dev-insecure-change-me", "change-me"]);

const FALSE_STRINGS = new Set(["false", "0", "off", "no"]);
const TRUE_STRINGS = new Set(["true", "1", "on", "yes"]);

/**
 * Boolean env var. z.coerce.boolean() reads any non-empty string as true,
 * so "false" would switch a feature on; this accepts the usual spellings
 * and rejects anything else at boot.
 */
function envBoolean(fallback: boolean) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim().toLowerCase();
    if (normalized === "") return undefined;
    if (FALSE_STRINGS.has(normalized)) return false;
    if (TRUE_STRINGS.has(normalized)) return true;
    return value;
  }, z.boolean().default(fallback));
}

const Env = z.object({
  PORT: z.coerce.number().int().default(4000),
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_GM_MODEL: z.string().default("claude-sonnet-5-5"),
  CLAUDE_SUMMARY_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  SESSION_SIGNING_KEY: z.string().default("dev-insecure-change-me"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:8081,http://localhost:19006"),
  NODE_ENV: z.string().default("development"),
  /**
   * Mounts POST /auth/token, which mints a tier token for any tier with no
   * auth. Local development only; never mounted when NODE_ENV=production.
   */
  ENABLE_DEV_TIER_TOKENS: envBoolean(false),
  /**
   * Reverse-proxy hops in front of the API (Render adds one). Request IPs,
   * and so the per-IP rate limits, come from X-Forwarded-For through this
   * many hops. 0 trusts no proxy headers.
   */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  /**
   * Per-attempt timeout budget for a GM turn generation call.
   * Intended SLO: the first attempt should satisfy most requests
   * within this budget; retries are a short-tail mitigation.
   */
  GM_TURN_TIMEOUT_MS: z.coerce.number().int().default(15000),
  /**
   * Extra retries after the initial attempt.
   * Bounded to protect API latency SLOs and avoid retry storms.
   */
  GM_TURN_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  /**
   * Linear backoff in milliseconds between retry attempts.
   * Backoff delay = attempt_number * GM_TURN_RETRY_BACKOFF_MS.
   */
  GM_TURN_RETRY_BACKOFF_MS: z.coerce.number().int().min(0).default(250),

  TURN_REQUEST_DEADLINE_MS: z.coerce.number().int().min(1000).default(9000),
  GM_CIRCUIT_BREAKER_ENABLED: envBoolean(true),
  GM_CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().min(1).default(3),
  GM_CIRCUIT_BREAKER_COOLDOWN_MS: z.coerce.number().int().min(1000).default(15000),
});

/**
 * Loads `KEY=value` lines from a .env file into `env`. Variables that are
 * already set always win, so a real deploy environment is never
 * overridden. Empty values are skipped so the code's defaults apply.
 */
export function loadDotEnv(path: string, env: NodeJS.ProcessEnv = process.env): void {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    const key = match?.[1];
    if (!key || env[key] !== undefined) continue;
    let value = match?.[2] ?? "";
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) {
      value = value.slice(1, -1);
    } else {
      // Drop an inline comment: `KEY=value # note`.
      const comment = value.search(/\s#/);
      if (comment >= 0) value = value.slice(0, comment).trimEnd();
    }
    if (value) env[key] = value;
  }
}

export function parseConfig(env: NodeJS.ProcessEnv) {
  const parsed = Env.parse(env);
  if (
    parsed.NODE_ENV === "production" &&
    (!parsed.SESSION_SIGNING_KEY.trim() || INSECURE_SIGNING_KEYS.has(parsed.SESSION_SIGNING_KEY))
  ) {
    // Session, lobby and tier tokens are HMACs over this key; with the
    // public default anyone could forge them.
    throw new Error(
      "SESSION_SIGNING_KEY must be set to a secret value in production (the same value as the web app's).",
    );
  }
  return {
    ...parsed,
    allowedOrigins: parsed.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
  };
}

// The repo-root .env the README has you create (src/ and dist/ are both
// three levels down). Tests run without it so they never pick up a local
// DATABASE_URL or API keys.
if (!process.env["VITEST"]) {
  loadDotEnv(fileURLToPath(new URL("../../../.env", import.meta.url)));
}

export const config = parseConfig(process.env);
