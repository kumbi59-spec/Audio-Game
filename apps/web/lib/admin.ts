import { auth } from "@/auth";
import type { Tier } from "@audio-rpg/shared";

const ADMIN_EMAILS = (process.env["ADMIN_EMAILS"] ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

type AdminCandidate = {
  email: string | null | undefined;
  // A Date from the DB, or its ISO string once it has been through the JWT.
  emailVerified: Date | string | null | undefined;
};

export async function requireAdmin(): Promise<{ id: string; email: string } | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  const emailVerified = (session.user as { emailVerified?: Date | string | null }).emailVerified;
  if (!isVerifiedAdmin({ email: session.user.email, emailVerified })) return null;
  return { id: session.user.id, email: session.user.email };
}

/** Whether the address is on the admin list. Never grants rights on its own; use isVerifiedAdmin. */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Admin rights need a listed email that the account has proven it owns.
 * Without the verification check, anyone could sign up as a listed address
 * (or a case variant of it) and be treated as an admin.
 */
export function isVerifiedAdmin(user: AdminCandidate): boolean {
  return Boolean(user.email && user.emailVerified && isAdminEmail(user.email));
}

export function effectiveTierForUser(user: AdminCandidate, currentTier: string): Tier | string {
  if (isVerifiedAdmin(user)) return "creator";
  return currentTier;
}
