import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/email/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";


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

  // Derive the public-facing origin from reverse-proxy headers (Render sets
  // x-forwarded-host/proto). req.url is the internal address (localhost:10000).
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const origin = host && !host.startsWith("localhost")
    ? `${proto}://${host}`
    : (process.env["NEXTAUTH_URL"] ?? process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000");

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
