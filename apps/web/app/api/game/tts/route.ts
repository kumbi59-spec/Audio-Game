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
// ElevenLabs' voice_settings.speed only accepts 0.7–1.2. Wider ranges from the
// UI (0.5–2.0) are realised on the client via HTMLAudioElement.playbackRate.
const ELEVENLABS_SPEED_MIN = 0.7;
const ELEVENLABS_SPEED_MAX = 1.2;

// Voice-shape parameters. Defaults are tuned for long-form narration:
// - Lower stability (0.35) gives the model more emotional range across a
//   paragraph — preferable to the 0.5 "balanced" preset for storytelling.
// - similarity_boost stays high so the chosen voice still sounds like itself.
// - style adds a touch of expressiveness without flipping into theatrical.
// All three are overridable via env so production can tune without a redeploy.
const ELEVENLABS_STABILITY = clampUnit(
  Number(process.env["ELEVENLABS_STABILITY"] ?? 0.35),
);
const ELEVENLABS_SIMILARITY = clampUnit(
  Number(process.env["ELEVENLABS_SIMILARITY_BOOST"] ?? 0.75),
);
const ELEVENLABS_STYLE = clampUnit(
  Number(process.env["ELEVENLABS_STYLE"] ?? 0.15),
);
const ELEVENLABS_USE_SPEAKER_BOOST =
  process.env["ELEVENLABS_USE_SPEAKER_BOOST"] !== "false";

function clampUnit(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

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

  // Use the effective tier from the JWT (already has effectiveTierForEmail applied)
  // rather than reading raw tier from DB, which would block admin-email users.
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin === true;
  const tier = (session.user as { tier?: string }).tier ?? "free";
  // Admins always get unlimited TTS regardless of their stored tier.
  const cap: number | null = isAdmin ? null : (TTS_CHAR_CAPS[tier] ?? 0);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ttsCharsUsedThisMonth: true, ttsCharsResetAt: true },
  });

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
      user?.ttsCharsResetAt && user.ttsCharsResetAt >= startOfMonth
        ? user.ttsCharsUsedThisMonth
        : 0;

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

  const apiSpeed = Math.max(ELEVENLABS_SPEED_MIN, Math.min(ELEVENLABS_SPEED_MAX, body.speed));

  // Use the /stream endpoint so the upstream returns chunked audio as it
  // synthesises. We pipe that body straight to the client, which can start
  // playback before the full clip is buffered — TTFA drops from
  // O(synthesis time) to O(network round-trip).
  const res = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${body.voiceId}/stream`,
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
          stability: ELEVENLABS_STABILITY,
          similarity_boost: ELEVENLABS_SIMILARITY,
          style: ELEVENLABS_STYLE,
          use_speaker_boost: ELEVENLABS_USE_SPEAKER_BOOST,
          speed: apiSpeed,
        },
      }),
    }
  );

  if (!res.ok) {
    let errorMsg = `ElevenLabs error ${res.status}`;
    try {
      const errData = (await res.json()) as {
        detail?:
          | { message?: string; status?: string }
          | string
          | Array<{ msg?: string; loc?: unknown }>;
      };
      const detail = errData.detail;
      if (Array.isArray(detail)) {
        errorMsg = detail
          .map((d) => d?.msg ?? "validation error")
          .filter(Boolean)
          .join("; ") || errorMsg;
      } else if (typeof detail === "object" && detail?.message) {
        errorMsg = detail.message;
      } else if (typeof detail === "string") {
        errorMsg = detail;
      }
    } catch {
      // fall through with status-code message
    }
    console.error("ElevenLabs upstream error", {
      status: res.status,
      voiceId: body.voiceId,
      speed: apiSpeed,
      message: errorMsg,
    });
    return NextResponse.json({ error: errorMsg }, { status: res.status });
  }

  if (!res.body) {
    return NextResponse.json({ error: "ElevenLabs returned no body" }, { status: 502 });
  }

  // Credit usage asynchronously — don't block the audio response. Recording
  // happens before the body has been fully consumed by the client, but that's
  // fine: characters were submitted upstream, so the user owes them whether
  // or not the client finishes downloading.
  void recordTtsChars(session.user.id, body.text.length);

  // Stream the upstream body straight through. Next.js will forward it to
  // the client as it arrives.
  return new Response(res.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      // Hint to the browser that ranged requests aren't supported on this
      // ephemeral stream — avoids the audio element re-issuing a Range
      // request mid-playback.
      "Accept-Ranges": "none",
    },
  });
}
