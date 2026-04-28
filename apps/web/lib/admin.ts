import { auth } from "@/auth";
import type { Tier } from "@audio-rpg/shared";

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

const TIER_RANK: Record<Tier, number> = {
  free: 0,
  storyteller: 1,
  creator: 2,
  enterprise: 3,
};

export function effectiveTierForEmail(email: string | null | undefined, currentTier: Tier): Tier {
  if (!email || !isAdminEmail(email)) return currentTier;
  // Admin emails are elevated to at least creator, but never downgraded from higher paid tiers.
  return TIER_RANK[currentTier] >= TIER_RANK.creator ? currentTier : "creator";
}

export function tierFromUnknown(value: string): Tier {
  if (value === "storyteller" || value === "creator" || value === "enterprise") return value;
  return "free";
}

export function effectiveTierForUnknownEmail(email: string | null | undefined, currentTier: string): Tier {
  const normalizedTier = tierFromUnknown(currentTier);
  return effectiveTierForEmail(email, normalizedTier);
}
