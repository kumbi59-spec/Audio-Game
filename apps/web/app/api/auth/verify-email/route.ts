import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/email/verification";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Use x-forwarded-host so the redirect goes to the public URL, not the
  // internal Render host (localhost:10000).
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const origin =
    host && !host.startsWith("localhost")
      ? `${proto}://${host}`
      : (process.env["NEXTAUTH_URL"] ?? process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000");

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
