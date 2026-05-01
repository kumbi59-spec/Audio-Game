import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/email/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

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

  // Derive base URL from the request origin so the link works regardless of
  // how NEXTAUTH_URL is configured in the environment.
  const origin = new URL(req.url).origin;

  const user = await prisma.user.findUnique({ where: { email: normalised }, select: { id: true } });
  if (user) {
    try {
      const token = await createPasswordResetToken(normalised);
      const url = `${origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(normalised)}`;
      await sendPasswordResetEmail(normalised, url);
    } catch (err) {
      console.error("[forgot-password] failed to send reset email:", err);
      return NextResponse.json(
        { error: "Failed to send reset email. Check that RESEND_FROM is set to an address on a verified Resend domain." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
