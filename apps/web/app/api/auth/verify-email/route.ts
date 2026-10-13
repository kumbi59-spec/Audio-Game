import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/email/verification";
import { sendWelcomeEmail } from "@/lib/email";
import { getPublicOrigin } from "@/lib/site-url";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Redirect to the canonical public URL, not the internal Render host
  // (localhost:10000) or a request-controlled Host header.
  const origin = getPublicOrigin(req);

  if (!token || !email) {
    return NextResponse.redirect(`${origin}/auth/sign-in?verify_error=invalid`);
  }

  // Consume the token and mark the email verified in one transaction: if the
  // write fails, the token survives and the same link works on a retry.
  let verified: Awaited<ReturnType<typeof verifyEmail>>;
  try {
    verified = await prisma.$transaction((tx) => verifyEmail(tx, email, token));
  } catch (err) {
    console.error("[verify-email] DB update failed:", err);
    return NextResponse.redirect(`${origin}/auth/sign-in?verify_error=failed`);
  }

  const { result, user } = verified;
  if (result === "expired") {
    return NextResponse.redirect(`${origin}/auth/sign-in?verify_error=expired`);
  }
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/sign-in?verify_error=invalid`);
  }

  sendWelcomeEmail(user.email, user.name ?? user.email.split("@")[0]).catch((err) => {
    console.warn("[verify-email] Failed to send welcome email:", err);
  });

  return NextResponse.redirect(`${origin}/?verified=1`);
}

async function verifyEmail(tx: Prisma.TransactionClient, email: string, token: string) {
  const result = await consumeVerificationToken(email, token, tx);
  if (result !== "ok") return { result } as const;

  // Case-insensitive lookup so mixed-case signups (e.g. Kumbi59@gmail.com) work
  const user = await tx.user.findFirst({
    where: { email: { equals: email.toLowerCase(), mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  });
  if (!user) return { result: "invalid" } as const;
  await tx.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
    select: { id: true },
  });
  return { result, user } as const;
}
