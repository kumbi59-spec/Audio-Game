import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { resetDailyMinutesIfNeeded } from "@/lib/db/queries/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, tier: true, aiMinutesRemaining: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Refresh free-tier daily allowance if a new day has started
  await resetDailyMinutesIfNeeded(session.user.id, user.tier);

  // Re-read if a reset just happened
  const aiMinutesRemaining = user.tier === "free"
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { aiMinutesRemaining: true } }))?.aiMinutesRemaining ?? user.aiMinutesRemaining
    : user.aiMinutesRemaining;

  return NextResponse.json({ ...user, aiMinutesRemaining });
}

const UpdateSchema = z.object({
  name: z.string().min(1).max(80).trim(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: z.infer<typeof UpdateSchema>;
  try {
    body = UpdateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { name: body.name } });
  } catch (err) {
    console.error("[me/profile] Failed to update name:", err);
    return NextResponse.json({ error: "Failed to update name. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
