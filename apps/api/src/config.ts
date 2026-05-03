import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().int().default(4000),
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_GM_MODEL: z.string().default("claude-sonnet-4-6"),
  CLAUDE_SUMMARY_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  SESSION_SIGNING_KEY: z.string().default("dev-insecure-change-me"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:8081,http://localhost:19006"),
  NODE_ENV: z.string().default("development"),
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
});

export const config = (() => {
  const parsed = Env.parse(process.env);
  return {
    ...parsed,
    allowedOrigins: parsed.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
  };
})();
