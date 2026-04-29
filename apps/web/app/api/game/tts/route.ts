import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  text: z.string().min(1).max(4000),
  voiceId: z.string().default("21m00Tcm4TlvDq8ikWAM"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
});

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

export async function POST(req: NextRequest) {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 503 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const res = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${body.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: body.text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: body.speed,
        },
      }),
    }
  );

  if (!res.ok) {
    let errorMsg = `ElevenLabs error ${res.status}`;
    try {
      const errData = await res.json() as { detail?: { message?: string; status?: string } | string };
      const detail = errData.detail;
      if (typeof detail === "object" && detail?.message) {
        errorMsg = detail.message;
      } else if (typeof detail === "string") {
        errorMsg = detail;
      }
    } catch {
      // fall through with status-code message
    }
    return NextResponse.json({ error: errorMsg }, { status: res.status });
  }

  const audioBuffer = await res.arrayBuffer();
  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
