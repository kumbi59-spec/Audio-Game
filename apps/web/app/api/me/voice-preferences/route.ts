import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PreferencesSchema = z.object({
  ttsProvider: z.enum(["browser", "elevenlabs"]),
  ttsVoiceId: z.string().max(128).default(""),
  ttsSpeed: z.number().min(0.5).max(2.0),
  ttsPitch: z.number().min(0.5).max(2.0),
  volume: z.number().min(0).max(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      ttsProvider: true,
      ttsVoiceId: true,
      ttsSpeed: true,
      ttsPitch: true,
      volume: true,
      clonedVoiceId: true,
      clonedVoiceLabel: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ttsProvider: user.ttsProvider as "browser" | "elevenlabs",
    ttsVoiceId: user.ttsVoiceId ?? "",
    ttsSpeed: user.ttsSpeed,
    ttsPitch: user.ttsPitch,
    volume: user.volume,
    clonedVoiceId: user.clonedVoiceId ?? null,
    clonedVoiceLabel: user.clonedVoiceLabel ?? null,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  let body: z.infer<typeof PreferencesSchema>;
  try {
    body = PreferencesSchema.parse(await request.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ttsProvider: body.ttsProvider,
      ttsVoiceId: body.ttsVoiceId || null,
      ttsSpeed: body.ttsSpeed,
      ttsPitch: body.ttsPitch,
      volume: body.volume,
    },
    select: {
      ttsProvider: true,
      ttsVoiceId: true,
      ttsSpeed: true,
      ttsPitch: true,
      volume: true,
      clonedVoiceId: true,
      clonedVoiceLabel: true,
    },
  });

  return NextResponse.json({
    ttsProvider: updated.ttsProvider as "browser" | "elevenlabs",
    ttsVoiceId: updated.ttsVoiceId ?? "",
    ttsSpeed: updated.ttsSpeed,
    ttsPitch: updated.ttsPitch,
    volume: updated.volume,
    clonedVoiceId: updated.clonedVoiceId ?? null,
    clonedVoiceLabel: updated.clonedVoiceLabel ?? null,
  });
}
