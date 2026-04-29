import { z } from "zod";

/**
 * Subscription tiers. "free" is the default for all unauthenticated
 * or new users. Tier checks are always performed server-side; the client
 * receives an Entitlements object and may gate UI accordingly.
 */
export const Tier = z.enum(["free", "storyteller", "creator", "enterprise"]);
export type Tier = z.infer<typeof Tier>;

/**
 * Feature flags derived from the user's tier. The server computes this
 * and returns it with every session; the client never trusts its own
 * tier value for enforcement.
 */
export const Entitlements = z.object({
  tier: Tier,
  /** ElevenLabs multi-voice TTS narration */
  premiumTts: z.boolean(),
  /** Upload a Game Bible (PDF / DOCX / text) */
  bibleUpload: z.boolean(),
  /** World Builder Wizard with Claude suggestions */
  worldWizard: z.boolean(),
  /** Maximum number of saved campaigns (null = unlimited) */
  maxCampaigns: z.number().int().positive().nullable(),
  /** Maximum turns per play session before a soft paywall prompt (null = unlimited) */
  sessionTurnLimit: z.number().int().positive().nullable(),
  /** Can publish worlds to the public library */
  publicPublishing: z.boolean(),
  /** Show interstitial ads between sessions (free tier only) */
  showAds: z.boolean(),
  /**
   * Remaining AI-minute credits purchased à la carte.
   * null means the tier includes unlimited AI time (no credit deduction).
   * Free users start with 60 minutes; packs can be purchased in-app.
   */
  aiMinutesRemaining: z.number().int().nonnegative().nullable(),
});
export type Entitlements = z.infer<typeof Entitlements>;

export const TIER_ENTITLEMENTS: Record<Tier, Entitlements> = {
  free: {
    tier: "free",
    premiumTts: false,
    bibleUpload: false,
    worldWizard: false,
    maxCampaigns: 3,
    sessionTurnLimit: 20,
    publicPublishing: false,
    showAds: true,
    aiMinutesRemaining: 60,
  },
  storyteller: {
    tier: "storyteller",
    premiumTts: true,
    bibleUpload: true,
    worldWizard: false,
    maxCampaigns: null,
    sessionTurnLimit: null,
    publicPublishing: false,
    showAds: false,
    aiMinutesRemaining: null,
  },
  creator: {
    tier: "creator",
    premiumTts: true,
    bibleUpload: true,
    worldWizard: true,
    maxCampaigns: null,
    sessionTurnLimit: null,
    publicPublishing: true,
    showAds: false,
    aiMinutesRemaining: null,
  },
  enterprise: {
    tier: "enterprise",
    premiumTts: true,
    bibleUpload: true,
    worldWizard: true,
    maxCampaigns: null,
    sessionTurnLimit: null,
    publicPublishing: true,
    showAds: false,
    aiMinutesRemaining: null,
  },
};

export const PRICING: Record<Exclude<Tier, "free" | "enterprise">, { monthly: number; annual: number }> = {
  storyteller: { monthly: 15, annual: 129 },
  creator: { monthly: 29, annual: 239 },
};

/**
 * À-la-carte AI minute credit packs available to free users (and paid users
 * who want a top-up buffer). Price in USD cents.
 */
export const AI_MINUTE_PACKS = [
  { id: "pack_60",  minutes: 60,  priceCents: 299,  label: "60 min",  badge: null },
  { id: "pack_180", minutes: 180, priceCents: 699,  label: "3 hours", badge: "Best value" },
  { id: "pack_600", minutes: 600, priceCents: 1999, label: "10 hours", badge: "Power player" },
] as const;
export type AiMinutePack = (typeof AI_MINUTE_PACKS)[number];

/** What each tier unlocks over the previous tier (for upgrade UI copy). */
export const TIER_HIGHLIGHTS: Record<Tier, string[]> = {
  free: [
    "3 prebuilt campaigns",
    "60 free AI minutes included",
    "Buy more AI minutes any time",
    "Browser TTS narration",
    "Voice command navigation",
    "Full keyboard access",
  ],
  storyteller: [
    "Everything in Free",
    "Generous AI session allowance",
    "No ads between sessions",
    "ElevenLabs premium voice narration",
    "Upload your own Game Bible",
    "Unlimited saved campaigns",
    "No per-session turn limits",
  ],
  creator: [
    "Everything in Storyteller",
    "World Builder Wizard",
    "Claude-assisted world design",
    "Publish worlds to the library",
    "Creator analytics",
  ],
  enterprise: [
    "Everything in Creator",
    "Institutional licensing",
    "Custom accessibility integrations",
    "Priority support & SLA",
  ],
};
