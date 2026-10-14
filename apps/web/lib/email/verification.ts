import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
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

// Pass a transaction client to consume the token in the same transaction as
// the write it authorises, so a failed write leaves the link usable.
export async function consumeVerificationToken(
  email: string,
  token: string,
  db: Prisma.TransactionClient = prisma,
): Promise<"ok" | "invalid" | "expired"> {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.identifier !== email) return "invalid";
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return "expired";
  }

  await db.verificationToken.delete({ where: { token } });
  return "ok";
}
