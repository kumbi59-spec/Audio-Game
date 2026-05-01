import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/email/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

const APP_URL = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";

export async function POST(req: Request) {
  const { email } = await req.json() as { email?: string };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();

  if (!process.env["RESEND_API_KEY"]) {
    return NextResponse.json(
      { error: "Email service is not configured on this server. Contact the site administrator to reset your password manually." },
      { status: 422 },
    );
  }

  // Always respond with success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email: normalised }, select: { id: true, name: true } });
  if (user) {
    try {
      const token = await createPasswordResetToken(normalised);
      const url = `${APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(normalised)}`;
      await sendPasswordResetEmail(normalised, url);
    } catch (err) {
      console.error("[forgot-password] failed to send reset email:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
