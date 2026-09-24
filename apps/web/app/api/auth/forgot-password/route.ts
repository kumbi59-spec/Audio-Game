import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/email/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPublicOrigin } from "@/lib/site-url";


const FORGOT_IP_LIMIT = 10;
const FORGOT_EMAIL_LIMIT = 5;
const FORGOT_WINDOW_SECONDS = 60 * 60;
const THROTTLED_MESSAGE = "If the details are valid, we'll send reset instructions shortly.";

export async function POST(req: Request) {
  const { email } = await req.json() as { email?: string };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();
  const ip = getClientIp(req);

  const ipDecision = await consumeRateLimit({
    key: `auth:forgot:ip:${ip}`,
    limit: FORGOT_IP_LIMIT,
    windowSeconds: FORGOT_WINDOW_SECONDS,
  });
  if (!ipDecision.allowed) {
    return NextResponse.json({ error: THROTTLED_MESSAGE }, { status: 429, headers: { "Retry-After": String(ipDecision.retryAfterSeconds) } });
  }

  const emailDecision = await consumeRateLimit({
    key: `auth:forgot:email:${normalised}`,
    limit: FORGOT_EMAIL_LIMIT,
    windowSeconds: FORGOT_WINDOW_SECONDS,
  });
  if (!emailDecision.allowed) {
    return NextResponse.json({ error: THROTTLED_MESSAGE }, { status: 429, headers: { "Retry-After": String(emailDecision.retryAfterSeconds) } });
  }

  if (!process.env["RESEND_API_KEY"]) {
    return NextResponse.json(
      { error: "Email service is not configured on this server. Contact the site administrator to reset your password manually." },
      { status: 422 },
    );
  }

  // Never build the emailed link from Host/X-Forwarded-Host: a forged header
  // would send the victim a reset link (and token) pointing at another host.
  const origin = getPublicOrigin(req);

  try {
    // Find case-insensitively so mixed-case signups (e.g. Kumbi59@gmail.com) still work
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
      select: { email: true },
    });
    if (user) {
      const token = await createPasswordResetToken(user.email);
      const url = `${origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
      await sendPasswordResetEmail(user.email, url);
    }
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return NextResponse.json(
      { error: "Failed to send reset email. Check server logs for details." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
