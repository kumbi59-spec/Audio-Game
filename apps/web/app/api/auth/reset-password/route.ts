import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { consumePasswordResetToken } from "@/lib/email/password-reset";

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

  try {
    const normalised = email.trim().toLowerCase();
    const result = await consumePasswordResetToken(normalised, token);
    if (result === "expired") {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 410 });
    }
    if (result === "invalid") {
      return NextResponse.json({ error: "Invalid or already-used reset link." }, { status: 400 });
    }

    // Find by case-insensitive email then update by ID to avoid P2025 on case mismatch
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const passwordHash = await hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  } catch (err) {
    console.error("[reset-password] error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
