import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { validatePasswordResetToken, deletePasswordResetToken } from "@/lib/email/password-reset";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";


const RESET_IP_LIMIT = 30;
const RESET_IDENTIFIER_FAIL_LIMIT = 5;
const RESET_WINDOW_SECONDS = 60 * 60;
const RESET_COOLDOWN_SECONDS = 15 * 60;
const THROTTLED_MESSAGE = "Unable to process reset request right now. Please try again later.";

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
  const ip = getClientIp(req);
  const ipDecision = await consumeRateLimit({
    key: `auth:reset:ip:${ip}`,
    limit: RESET_IP_LIMIT,
    windowSeconds: RESET_WINDOW_SECONDS,
  });
  if (!ipDecision.allowed) {
    return NextResponse.json({ error: THROTTLED_MESSAGE }, { status: 429, headers: { "Retry-After": String(ipDecision.retryAfterSeconds) } });
  }

  const identifierKey = `${normalised}:${token}`;
  const guardDecision = await consumeRateLimit({
    key: `auth:reset:identifier:${identifierKey}`,
    limit: RESET_IDENTIFIER_FAIL_LIMIT,
    windowSeconds: RESET_WINDOW_SECONDS,
    cooldownSeconds: RESET_COOLDOWN_SECONDS,
    incrementOnFailureOnly: true,
    wasFailure: false,
  });
  if (!guardDecision.allowed) {
    return NextResponse.json({ error: THROTTLED_MESSAGE }, { status: 429, headers: { "Retry-After": String(guardDecision.retryAfterSeconds) } });
  }

  try {
    // Validate token WITHOUT deleting — so the user can retry if the update fails
    const result = await validatePasswordResetToken(normalised, token);
    if (result === "expired") {
      await consumeRateLimit({ key: `auth:reset:identifier:${identifierKey}`, limit: RESET_IDENTIFIER_FAIL_LIMIT, windowSeconds: RESET_WINDOW_SECONDS, cooldownSeconds: RESET_COOLDOWN_SECONDS, incrementOnFailureOnly: true, wasFailure: true });
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 410 });
    }
    if (result === "invalid") {
      await consumeRateLimit({ key: `auth:reset:identifier:${identifierKey}`, limit: RESET_IDENTIFIER_FAIL_LIMIT, windowSeconds: RESET_WINDOW_SECONDS, cooldownSeconds: RESET_COOLDOWN_SECONDS, incrementOnFailureOnly: true, wasFailure: true });
      return NextResponse.json({ error: "Invalid or already-used reset link." }, { status: 400 });
    }

    // Find user case-insensitively (handles mixed-case signups like Kumbi59@gmail.com)
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user) {
      await consumeRateLimit({ key: `auth:reset:identifier:${identifierKey}`, limit: RESET_IDENTIFIER_FAIL_LIMIT, windowSeconds: RESET_WINDOW_SECONDS, cooldownSeconds: RESET_COOLDOWN_SECONDS, incrementOnFailureOnly: true, wasFailure: true });
      return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    }

    // Update password then delete the token — in this order so a DB hiccup doesn't
    // strand the user with a consumed token and no password change
    const passwordHash = await hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash }, select: { id: true } });
    await deletePasswordResetToken(normalised);
  } catch (err) {
    console.error("[reset-password] error:", err);
    return NextResponse.json({ error: "Something went wrong — please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
