import type { FastifyInstance } from "fastify";
import { createSlidingWindowLimiter } from "./rate-limit.js";

/**
 * Deepgram short-lived key minter. The mobile client opens its own
 * WebSocket directly to Deepgram (low-latency audio path), but must
 * never hold the master DEEPGRAM_API_KEY. This route mints a temporary
 * project key with streaming scope that expires within seconds.
 *
 * When DEEPGRAM_API_KEY is not set the route returns 503 so the client
 * falls back to the platform recognizer (Web Speech on web,
 * expo-speech-recognition on native, mock in tests).
 */

// Per-IP mint window; caps cost inflation from rapid key minting. A
// session mints one key per utterance, so a few per minute is normal use.
const STT_MINTS_PER_WINDOW = 10;
const STT_MINT_WINDOW_MS = 60_000;
const sttMintLimiter = createSlidingWindowLimiter({
  limit: STT_MINTS_PER_WINDOW,
  windowMs: STT_MINT_WINDOW_MS,
});

/** Exposed for test teardown only. */
export function clearSttRateLimit(): void {
  sttMintLimiter.clear();
}

function sttConfig(): { apiKey: string; projectId: string } | null {
  const apiKey = process.env["DEEPGRAM_API_KEY"];
  const projectId = process.env["DEEPGRAM_PROJECT_ID"];
  return apiKey && projectId ? { apiKey, projectId } : null;
}

export async function registerSttRoutes(app: FastifyInstance): Promise<void> {
  // Availability probe for clients; never mints, so it costs nothing and
  // doesn't count against the mint limit.
  app.get("/stt/status", async () => ({ available: sttConfig() !== null }));

  app.post("/stt/token", async (req, reply) => {
    const deepgram = sttConfig();
    if (!deepgram) {
      return reply.status(503).send({
        error: "stt_unavailable",
        message:
          "DEEPGRAM_API_KEY / DEEPGRAM_PROJECT_ID are not set. Client should fall back to platform STT.",
      });
    }
    const { apiKey, projectId } = deepgram;
    const retryAfterSeconds = sttMintLimiter.retryAfterSeconds(req.ip);
    if (retryAfterSeconds > 0) {
      reply.header("Retry-After", String(retryAfterSeconds));
      return reply.status(429).send({ error: "stt_rate_limited", retryAfterSeconds });
    }
    try {
      const upstream = await fetch(
        `https://api.deepgram.com/v1/projects/${encodeURIComponent(projectId)}/keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${apiKey}`,
          },
          body: JSON.stringify({
            comment: "audio-rpg ephemeral client key",
            scopes: ["usage:write"],
            time_to_live_in_seconds: 120,
          }),
        },
      );
      if (!upstream.ok) {
        const body = await upstream.text();
        app.log.error({ status: upstream.status, body }, "deepgram key mint failed");
        return reply.status(502).send({ error: "stt_upstream_error" });
      }
      const data = (await upstream.json()) as {
        key: string;
        api_key_id: string;
        expiration_date: string;
      };
      // Only a key that was actually minted counts against the window.
      sttMintLimiter.record(req.ip);
      return {
        token: data.key,
        keyId: data.api_key_id,
        expiresAt: data.expiration_date,
        model: "nova-3",
      };
    } catch (err) {
      app.log.error({ err }, "stt token error");
      return reply.status(502).send({ error: "stt_upstream_error" });
    }
  });
}
