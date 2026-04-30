import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/email/verification";
import { sendVerificationEmail } from "@/lib/email";

const APP_URL = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  try {
    const token = await createVerificationToken(user.email);
    const url = `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    await sendVerificationEmail(user.email, user.name ?? user.email.split("@")[0], url);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }
}
