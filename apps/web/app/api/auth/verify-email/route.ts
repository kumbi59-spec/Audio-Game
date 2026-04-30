import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/email/verification";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/auth/sign-in?verify_error=invalid", req.url));
  }

  const result = await consumeVerificationToken(email, token);

  if (result === "expired") {
    return NextResponse.redirect(new URL("/auth/sign-in?verify_error=expired", req.url));
  }
  if (result === "invalid") {
    return NextResponse.redirect(new URL("/auth/sign-in?verify_error=invalid", req.url));
  }

  // Mark email as verified
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
    select: { name: true, email: true },
  });

  // Send welcome email now that the address is confirmed
  void sendWelcomeEmail(user.email, user.name ?? user.email.split("@")[0]);

  return NextResponse.redirect(new URL("/?verified=1", req.url));
}
