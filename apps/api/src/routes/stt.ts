import type { FastifyInstance } from "fastify";

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
export async function registerSttRoutes(app: FastifyInstance): Promise<void> {
  app.post("/stt/token", async (_req, reply) => {
    const apiKey = process.env["DEEPGRAM_API_KEY"];
    const projectId = process.env["DEEPGRAM_PROJECT_ID"];
    if (!apiKey || !projectId) {
      return reply.status(503).send({
        error: "stt_unavailable",
        message:
          "DEEPGRAM_API_KEY / DEEPGRAM_PROJECT_ID are not set. Client should fall back to platform STT.",
      });
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
