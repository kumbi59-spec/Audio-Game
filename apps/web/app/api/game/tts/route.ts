import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { recordTtsChars, refundTtsChars, reserveTtsChars } from "@/lib/db/queries/users";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/audio/voices-catalog";

const Schema = z.object({
  text: z.string().min(1).max(4000),
  // An ElevenLabs voice id goes into the upstream URL path, so only plain ids
  // are accepted. An empty id (the "Default" voice) means the default.
  voiceId: z
    .string()
    .regex(/^[A-Za-z0-9]{0,64}$/)
    .default(DEFAULT_ELEVENLABS_VOICE_ID)
    .transform((id) => id || DEFAULT_ELEVENLABS_VOICE_ID),
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
  const userId = session.user.id;

  // Use the effective tier from the JWT (already has effectiveTierForEmail applied)
  // rather than reading raw tier from DB, which would block admin-email users.
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin === true;
  const tier = (session.user as { tier?: string }).tier ?? "free";
  // Admins always get unlimited TTS regardless of their stored tier. A known
  // tier's null cap (enterprise) is unlimited too, so it is looked up with
  // Object.hasOwn rather than ?? (which would turn it into 0); unknown tiers
  // get none.
  const cap: number | null = isAdmin ? null : Object.hasOwn(TTS_CHAR_CAPS, tier) ? TTS_CHAR_CAPS[tier] : 0;

  if (cap === 0) {
    return NextResponse.json({ error: "ElevenLabs requires a paid plan" }, { status: 403 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Monthly cap (cap === null means unlimited). The characters are reserved
  // before the upstream call, so parallel requests can't overrun the cap, and
  // handed back if the call fails.
  const chars = body.text.length;
  const reservedAt = new Date();
  if (cap !== null && !(await reserveTtsChars(userId, chars, cap, reservedAt))) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ttsCharsUsedThisMonth: true, ttsCharsResetAt: true },
    });
    const startOfMonth = new Date(reservedAt);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const charsUsed =
      user?.ttsCharsResetAt && user.ttsCharsResetAt >= startOfMonth
        ? user.ttsCharsUsedThisMonth
        : 0;

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

  const refundReservation = async () => {
    if (cap === null) return;
    try {
      await refundTtsChars(userId, chars, reservedAt);
    } catch (error) {
      console.error("Failed to refund ElevenLabs character reservation", { userId, chars, error });
    }
  };

  const apiSpeed = Math.max(ELEVENLABS_SPEED_MIN, Math.min(ELEVENLABS_SPEED_MAX, body.speed));

  // Use the /stream endpoint so the upstream returns chunked audio as it
  // synthesises. We pipe that body straight to the client, which can start
  // playback before the full clip is buffered — TTFA drops from
  // O(synthesis time) to O(network round-trip).
  let res: Response;
  try {
    res = await fetch(
      `${ELEVENLABS_BASE}/text-to-speech/${body.voiceId}/stream`,
      {
        method: "POST",
        // A prefetched clip the player skipped is aborted by the browser; stop
        // the upstream synthesis with it.
        signal: req.signal,
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
  } catch (error) {
    // Network failure, or the client aborted the prefetch.
    await refundReservation();
    if (!req.signal.aborted) console.error("ElevenLabs request failed", { voiceId: body.voiceId, error });
    return NextResponse.json({ error: "ElevenLabs request failed" }, { status: 502 });
  }

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
    await refundReservation();
    return NextResponse.json({ error: errorMsg }, { status: res.status });
  }

  if (!res.body) {
    await refundReservation();
    return NextResponse.json({ error: "ElevenLabs returned no body" }, { status: 502 });
  }

  // Capped usage was reserved above. Unlimited usage is still recorded,
  // asynchronously so it doesn't block the audio response. Either way the
  // count lands before the client has consumed the body, which is fine: the
  // characters were submitted upstream, so the user owes them whether or not
  // the client finishes downloading.
  if (cap === null) {
    recordTtsChars(userId, chars).catch((error) => {
      console.error("Failed to record ElevenLabs character usage", { userId, chars, error });
    });
  }

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
