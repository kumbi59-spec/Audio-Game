import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { validatePasswordResetToken, deletePasswordResetToken } from "@/lib/email/password-reset";

export async function POST(req: Request) {
  const { email, token, newPassword } = await req.json() as {
    email?: string;
    token?: string;
    newPassword?: string;
  };

  if (!email || !token || !newPassword || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();

  try {
    // Validate token WITHOUT deleting — so the user can retry if the update fails
    const result = await validatePasswordResetToken(normalised, token);
    if (result === "expired") {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 410 });
    }
    if (result === "invalid") {
      return NextResponse.json({ error: "Invalid or already-used reset link." }, { status: 400 });
    }

    // Find user case-insensitively (handles mixed-case signups like Kumbi59@gmail.com)
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "No account found for that email." }, { status: 404 });
    }

    // Update password then delete the token — in this order so a DB hiccup doesn't
    // strand the user with a consumed token and no password change
    const passwordHash = await hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await deletePasswordResetToken(normalised);
  } catch (err) {
    const detail = err instanceof Error ? `${err.constructor.name}: ${err.message.slice(0, 200)}` : String(err);
    console.error("[reset-password] error:", err);
    return NextResponse.json({ error: detail }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
