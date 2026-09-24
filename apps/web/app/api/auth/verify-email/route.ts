import { NextRequest, NextResponse } from "next/server";
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

  const result = await consumeVerificationToken(email, token);

  if (result === "expired") {
    return NextResponse.redirect(`${origin}/auth/sign-in?verify_error=expired`);
  }
  if (result === "invalid") {
    return NextResponse.redirect(`${origin}/auth/sign-in?verify_error=invalid`);
  }

  // Case-insensitive lookup so mixed-case signups (e.g. Kumbi59@gmail.com) work
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: "insensitive" } },
      select: { id: true, name: true, email: true },
    });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
        select: { id: true },
      });
      void sendWelcomeEmail(user.email, user.name ?? user.email.split("@")[0]);
    }
  } catch (err) {
    console.error("[verify-email] DB update failed:", err);
    // Still redirect to home — the token was valid, even if the DB write glitched
  }

  return NextResponse.redirect(`${origin}/?verified=1`);
}
