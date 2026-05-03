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
  GM_TURN_TIMEOUT_MS: z.coerce.number().int().default(15000),
  GM_TURN_MAX_RETRIES: z.coerce.number().int().default(1),
});

export const config = (() => {
  const parsed = Env.parse(process.env);
  return {
    ...parsed,
    allowedOrigins: parsed.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
  };
})();
