import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import type { Tier, Entitlements } from "@audio-rpg/shared";

export type FeatureKey = keyof Entitlements;

/**
 * Returns the entitlements object for a given tier.
 * Pure — safe to call anywhere without Zustand.
 */
export function entitlementsForTier(tier: Tier): Entitlements {
  return TIER_ENTITLEMENTS[tier];
}

/**
 * Returns true when the feature is available for the given tier.
 */
export function canAccessFeature(tier: Tier, feature: FeatureKey): boolean {
  const ents = TIER_ENTITLEMENTS[tier];
  const val = ents[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return false;
}

/**
 * Returns the minimum tier required to access a feature,
 * or null if the feature is unavailable on all tiers.
 */
export function minimumTierFor(feature: FeatureKey): Tier | null {
  const tiers: Tier[] = ["free", "storyteller", "creator", "enterprise"];
  for (const tier of tiers) {
    if (canAccessFeature(tier, feature)) return tier;
  }
  return null;
}

/**
 * Returns a user-facing upgrade prompt string or null if no upgrade is needed.
 */
export function upgradePromptFor(currentTier: Tier, feature: FeatureKey): string | null {
  if (canAccessFeature(currentTier, feature)) return null;
  const required = minimumTierFor(feature);
  if (!required) return null;
  const labels: Record<Tier, string> = {
    free: "Free",
    storyteller: "Storyteller",
    creator: "Creator",
    enterprise: "Enterprise",
  };
  return `This feature requires the ${labels[required]} plan.`;
}
