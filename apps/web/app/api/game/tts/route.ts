import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { recordTtsChars } from "@/lib/db/queries/users";

const Schema = z.object({
  text: z.string().min(1).max(4000),
  voiceId: z.string().default("21m00Tcm4TlvDq8ikWAM"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
});

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Monthly ElevenLabs character caps by tier. null = unlimited.
// Defaults are tuned to keep healthy margins; override per deployment with env vars.
const TTS_CHAR_CAPS: Record<string, number | null> = {
  free: 0,
  storyteller: Number(process.env["ELEVENLABS_STORYTELLER_MONTHLY_CHAR_CAP"] ?? 40_000),
  creator: Number(process.env["ELEVENLABS_CREATOR_MONTHLY_CHAR_CAP"] ?? 90_000),
  enterprise: null,
};

export async function POST(req: NextRequest) {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, ttsCharsUsedThisMonth: true, ttsCharsResetAt: true },
  });

  const tier = user?.tier ?? "free";
  const cap = TTS_CHAR_CAPS[tier] ?? 0;

  if (cap === 0) {
    return NextResponse.json({ error: "ElevenLabs requires a paid plan" }, { status: 403 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Monthly cap check (cap === null means unlimited)
  if (cap !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const charsUsed =
      user!.ttsCharsResetAt >= startOfMonth ? user!.ttsCharsUsedThisMonth : 0;

    if (charsUsed + body.text.length > cap) {
      return NextResponse.json(
        {
          error: "tts_cap_reached",
          message: `Monthly ElevenLabs limit reached (${cap.toLocaleString()} characters). Switching to browser narrator for the rest of the month.`,
          charsUsed,
          cap,
        },
        { status: 429 },
      );
    }
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

  // Credit usage asynchronously — don't block the audio response
  void recordTtsChars(session.user.id, body.text.length);

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
