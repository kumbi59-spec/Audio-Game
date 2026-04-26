import { auth } from "@/auth";

const ADMIN_EMAILS = (process.env["ADMIN_EMAILS"] ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(): Promise<{ id: string; email: string } | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) return null;
  return { id: session.user.id, email: session.user.email };
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
