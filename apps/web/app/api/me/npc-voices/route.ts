import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/me/npc-voices?worldId=... — returns the user's saved NPC voice
 *  mapping for that world so the client can prime its in-memory cache and
 *  give every named NPC the same voice they had last session. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const worldId = new URL(request.url).searchParams.get("worldId");
  if (!worldId) {
    return NextResponse.json({ error: "worldId required" }, { status: 400 });
  }

  const rows = await prisma.npcVoiceAssignment.findMany({
    where: { userId: session.user.id, worldId },
    select: { npcKey: true, voiceId: true, gender: true, displayName: true },
  });
  return NextResponse.json({
    assignments: rows.map((r) => ({
      npcKey: r.npcKey,
      voiceId: r.voiceId,
      gender: r.gender as "male" | "female" | "neutral",
      displayName: r.displayName,
    })),
  });
}

const UpsertSchema = z.object({
  worldId: z.string().min(1).max(128),
  npcKey: z.string().min(1).max(128),
  voiceId: z.string().min(1).max(128),
  gender: z.enum(["male", "female", "neutral"]).default("neutral"),
  displayName: z.string().min(1).max(200),
});

/** POST /api/me/npc-voices — upsert one mapping. Called by the client when
 *  the auto-assigner picks a voice for an NPC it hasn't seen before. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  let body: z.infer<typeof UpsertSchema>;
  try {
    body = UpsertSchema.parse(await request.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const row = await prisma.npcVoiceAssignment.upsert({
    where: {
      userId_worldId_npcKey: {
        userId: session.user.id,
        worldId: body.worldId,
        npcKey: body.npcKey,
      },
    },
    create: {
      userId: session.user.id,
      worldId: body.worldId,
      npcKey: body.npcKey,
      voiceId: body.voiceId,
      gender: body.gender,
      displayName: body.displayName,
    },
    update: {
      voiceId: body.voiceId,
      gender: body.gender,
      displayName: body.displayName,
    },
    select: { npcKey: true, voiceId: true, gender: true, displayName: true },
  });

  return NextResponse.json({
    npcKey: row.npcKey,
    voiceId: row.voiceId,
    gender: row.gender as "male" | "female" | "neutral",
    displayName: row.displayName,
  });
}

const DeleteSchema = z.object({
  worldId: z.string().min(1).max(128),
  /** Empty array → wipe every NPC voice assignment for this world. */
  npcKeys: z.array(z.string().min(1).max(128)).default([]),
});

/** DELETE /api/me/npc-voices — reset selected (or all) NPC voice assignments
 *  for a world. Used by the "Reset assignments" button in voice settings. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  let body: z.infer<typeof DeleteSchema>;
  try {
    body = DeleteSchema.parse(await request.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const where = body.npcKeys.length > 0
    ? { userId: session.user.id, worldId: body.worldId, npcKey: { in: body.npcKeys } }
    : { userId: session.user.id, worldId: body.worldId };

  const result = await prisma.npcVoiceAssignment.deleteMany({ where });
  return NextResponse.json({ deleted: result.count });
}
