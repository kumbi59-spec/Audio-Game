import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const EXPIRES_IN_MS = 60 * 60 * 1000; // 1 hour
const PREFIX = "pwreset:";

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EXPIRES_IN_MS);
  const identifier = `${PREFIX}${email.toLowerCase()}`;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  return token;
}

export async function consumePasswordResetToken(
  email: string,
  token: string,
): Promise<"ok" | "invalid" | "expired"> {
  const identifier = `${PREFIX}${email.toLowerCase()}`;
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.identifier !== identifier) return "invalid";
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return "expired";
  }

  await prisma.verificationToken.delete({ where: { token } });
  return "ok";
}
