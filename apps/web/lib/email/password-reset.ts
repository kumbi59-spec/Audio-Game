import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

const EXPIRES_IN_MS = 60 * 60 * 1000; // 1 hour
const PREFIX = "pwreset:";
const HASH_VERSION = "v2";

function hashResetToken(token: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const digest = createHash("sha256").update(`${secret}:${token}`).digest("hex");
  return `${HASH_VERSION}:${digest}`;
}

async function ensureLegacyResetTokensInvalidated(): Promise<void> {
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: { startsWith: PREFIX },
      token: { not: { startsWith: `${HASH_VERSION}:` } },
    },
  });
}

function safeTokenHashEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function createPasswordResetToken(email: string): Promise<string> {
  await ensureLegacyResetTokensInvalidated();

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const expires = new Date(Date.now() + EXPIRES_IN_MS);
  const identifier = `${PREFIX}${email.toLowerCase()}`;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token: tokenHash, expires } });

  return token;
}

// Validates the token WITHOUT deleting it so the caller can retry if the
// downstream update fails. Call deletePasswordResetToken after a successful update.
export async function validatePasswordResetToken(
  email: string,
  token: string,
): Promise<"ok" | "invalid" | "expired"> {
  await ensureLegacyResetTokensInvalidated();

  const identifier = `${PREFIX}${email.toLowerCase()}`;
  const tokenHash = hashResetToken(token);
  const record = await prisma.verificationToken.findFirst({ where: { identifier, token: tokenHash } });

  if (!record || !safeTokenHashEquals(record.token, tokenHash)) return "invalid";
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return "expired";
  }
  return "ok";
}

export async function deletePasswordResetToken(email: string): Promise<void> {
  await ensureLegacyResetTokensInvalidated();

  const identifier = `${PREFIX}${email.toLowerCase()}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
}
