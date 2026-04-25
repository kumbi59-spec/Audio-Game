import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Readable } from "node:stream";

const VOICE_DEFAULTS = {
  narrator: "21m00Tcm4TlvDq8ikWAM",
  voice_a: "AZnzlk1XvdvUeBnXmlld",
  voice_b: "VR6AewLTigWG4xSOukaG",
  voice_c: "pNInz6obpgDQGcFmaJgB",
} as const;

function resolvedVoiceId(role: keyof typeof VOICE_DEFAULTS): string {
  return getConfiguredVoices()[role];
}

function getConfiguredVoices(): Record<keyof typeof VOICE_DEFAULTS, string> {
  return {
    narrator: process.env["ELEVENLABS_VOICE_NARRATOR"] ?? VOICE_DEFAULTS.narrator,
    voice_a: process.env["ELEVENLABS_VOICE_A"] ?? VOICE_DEFAULTS.voice_a,
    voice_b: process.env["ELEVENLABS_VOICE_B"] ?? VOICE_DEFAULTS.voice_b,
    voice_c: process.env["ELEVENLABS_VOICE_C"] ?? VOICE_DEFAULTS.voice_c,
  };
}

const QuerySchema = z.object({
  text: z.string().min(1).max(3000),
  voiceId: z.string().default("21m00Tcm4TlvDq8ikWAM"),
  model: z.string().default("eleven_flash_v2_5"),
  voiceRole: z.enum(["narrator", "voice_a", "voice_b", "voice_c"]).optional(),
});

/**
 * TTS proxy. The client never holds an ElevenLabs key; it requests
 * narration by turnId+voiceId and we stream MP3 audio back. In production
 * this is fronted by a Cloudflare Worker that adds an edge cache keyed on
 * (voiceId, sha256(text)). Here we just stream straight from ElevenLabs.
 *
 * If ELEVENLABS_API_KEY is not set, the route returns 503 so the mobile
 * client can fall back to the on-device TTS (expo-speech) without error.
 */
export async function registerTtsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/tts/stream", async (req, reply) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const key = process.env["ELEVENLABS_API_KEY"];
    if (!key) {
      return reply.status(503).send({
        error: "tts_unavailable",
        message:
          "ELEVENLABS_API_KEY is not set. Client should fall back to on-device TTS.",
      });
    }

    const { text, model, voiceRole } = parsed.data;
    const voiceId =
      voiceRole && parsed.data.voiceId === "21m00Tcm4TlvDq8ikWAM"
        ? resolvedVoiceId(voiceRole)
        : parsed.data.voiceId;
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": key,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      },
    );

    if (!upstream.ok || !upstream.body) {
      const detail = await safeReadErrorBody(upstream);
      app.log.error({ status: upstream.status, detail }, "elevenlabs upstream failed");
      return reply.status(502).send({ error: "tts_upstream_error" });
    }

    reply.header("Content-Type", "audio/mpeg");
    reply.header("Cache-Control", "public, max-age=3600, immutable");
    return reply.send(Readable.fromWeb(upstream.body as never));
  });

  app.get("/tts/voices", async (_req, reply) => {
    return reply.send(getConfiguredVoices());
  });
}

async function safeReadErrorBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 400);
  } catch {
    return "<unreadable>";
  }
}
