import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  cloneVoice,
  deleteVoice,
  ElevenLabsApiError,
  ElevenLabsConfigError,
} from "@/lib/elevenlabs/voice-cloning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB — covers ~10 minutes of mono mp3 at 128kbps
const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
]);

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError(401, "Unauthenticated");

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError(400, "Invalid multipart payload");

  const sample = form.get("sample");
  const consent = form.get("consent");
  const labelRaw = form.get("label");

  if (!(sample instanceof Blob)) return jsonError(400, "Missing audio sample");
  if (consent !== "yes") {
    return jsonError(400, "You must confirm you have rights to the voice in this sample.");
  }
  if (sample.size > MAX_BYTES) {
    return jsonError(413, `Sample too large (max ${Math.round(MAX_BYTES / (1024 * 1024))} MB)`);
  }
  if (sample.type && !ALLOWED_TYPES.has(sample.type)) {
    return jsonError(415, `Unsupported audio type: ${sample.type}`);
  }

  const label = (typeof labelRaw === "string" && labelRaw.trim()) || "My voice";
  const filename = (sample as File).name || "sample.mp3";

  // Replace any existing clone first so we don't accumulate orphans on the
  // ElevenLabs side. Best-effort delete; if it fails we still try to add.
  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clonedVoiceId: true },
  });
  if (existing?.clonedVoiceId) {
    try {
      await deleteVoice(existing.clonedVoiceId);
    } catch (err) {
      console.warn(`[voice-clone] couldn't delete prior clone ${existing.clonedVoiceId}:`, err);
    }
  }

  try {
    const cloned = await cloneVoice({
      name: `EchoQuest-${session.user.id.slice(0, 8)}-${label.slice(0, 24)}`,
      description: `User-cloned voice for EchoQuest user ${session.user.id}`,
      sample,
      filename,
    });

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        clonedVoiceId: cloned.voiceId,
        clonedVoiceLabel: label,
        // Auto-switch them onto ElevenLabs + the new clone, since that's
        // almost certainly why they uploaded the sample.
        ttsProvider: "elevenlabs",
        ttsVoiceId: cloned.voiceId,
      },
      select: { clonedVoiceId: true, clonedVoiceLabel: true, ttsVoiceId: true, ttsProvider: true },
    });

    return NextResponse.json({
      clonedVoiceId: updated.clonedVoiceId,
      clonedVoiceLabel: updated.clonedVoiceLabel,
      ttsProvider: updated.ttsProvider,
      ttsVoiceId: updated.ttsVoiceId,
    });
  } catch (err) {
    if (err instanceof ElevenLabsConfigError) return jsonError(503, err.message);
    if (err instanceof ElevenLabsApiError) return jsonError(err.status, err.message);
    return jsonError(500, `Voice clone failed: ${(err as Error).message}`);
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return jsonError(401, "Unauthenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clonedVoiceId: true, ttsVoiceId: true },
  });
  if (!user?.clonedVoiceId) return NextResponse.json({ ok: true, deleted: false });

  try {
    await deleteVoice(user.clonedVoiceId);
  } catch (err) {
    if (err instanceof ElevenLabsConfigError) {
      // If we can't reach ElevenLabs, still clear the local pointer so the
      // user's UI is consistent — operator can manually clean up later.
      console.warn(`[voice-clone] deleting locally only: ${err.message}`);
    } else {
      return jsonError(502, `Failed to delete remote voice: ${(err as Error).message}`);
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      clonedVoiceId: null,
      clonedVoiceLabel: null,
      // If they were narrating with the cloned voice, fall back to default.
      ...(user.ttsVoiceId === user.clonedVoiceId ? { ttsVoiceId: null } : {}),
    },
  });

  return NextResponse.json({ ok: true, deleted: true });
}
