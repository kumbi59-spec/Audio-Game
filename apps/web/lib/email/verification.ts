import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const EXPIRES_IN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EXPIRES_IN_MS);

  // Replace any existing token for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  return token;
}

export async function consumeVerificationToken(
  email: string,
  token: string,
): Promise<"ok" | "invalid" | "expired"> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.identifier !== email) return "invalid";
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return "expired";
  }

  await prisma.verificationToken.delete({ where: { token } });
  return "ok";
}
