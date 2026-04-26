import type { AiMinutePack, Tier } from "@audio-rpg/shared";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import { useEntitlements } from "./store";

type PurchaseResult = { success: boolean; error?: string };

type ActiveEntitlement = {
  identifier?: string;
  productIdentifier?: string;
};

type CustomerInfo = {
  entitlements?: {
    active?: Record<string, ActiveEntitlement>;
  };
};

type RevenueCatPackage = {
  identifier?: string;
  product?: {
    identifier?: string;
  };
};

type RevenueCatOfferings = {
  all?: Record<string, { availablePackages?: RevenueCatPackage[] }>;
  current?: { availablePackages?: RevenueCatPackage[] };
};

type RevenueCatModule = {
  configure: (params: { apiKey: string }) => Promise<void> | void;
  getOfferings: () => Promise<RevenueCatOfferings>;
  purchasePackage: (pkg: RevenueCatPackage) => Promise<{ customerInfo?: CustomerInfo }>;
  restorePurchases: () => Promise<CustomerInfo>;
};

let purchasesInstance: RevenueCatModule | null = null;

const TIER_ENTITLEMENT_IDS = {
  storyteller: ["storyteller", "tier_storyteller", "pro"],
  creator: ["creator", "tier_creator", "premium"],
} as const;

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

async function loadPurchases(): Promise<RevenueCatModule> {
  if (purchasesInstance) return purchasesInstance;

  // Use runtime require to keep TypeScript compiling before the package is installed.
  const runtimeRequire = Function("return require")() as (id: string) => unknown;
  const loaded = runtimeRequire("react-native-purchases") as { default?: RevenueCatModule } | RevenueCatModule;
  purchasesInstance = ("default" in (loaded as { default?: RevenueCatModule })
    ? (loaded as { default?: RevenueCatModule }).default
    : loaded) as RevenueCatModule;

  if (!purchasesInstance || typeof purchasesInstance.configure !== "function") {
    throw new Error("react-native-purchases is unavailable or invalid.");
  }

  return purchasesInstance;
}

function findTier(customerInfo: CustomerInfo): Tier {
  const active = customerInfo.entitlements?.active ?? {};
  const keys = Object.keys(active).map(normalize);
  const values = Object.values(active).flatMap((entry) => [
    normalize(entry.identifier),
    normalize(entry.productIdentifier),
  ]);

  const hasCreator = [...TIER_ENTITLEMENT_IDS.creator].some((id) =>
    keys.includes(normalize(id)) || values.includes(normalize(id)),
  );
  if (hasCreator) return "creator";

  const hasStoryteller = [...TIER_ENTITLEMENT_IDS.storyteller].some((id) =>
    keys.includes(normalize(id)) || values.includes(normalize(id)),
  );
  if (hasStoryteller) return "storyteller";

  return "free";
}

function extractPackMinutes(pack: AiMinutePack, customerInfo: CustomerInfo): number {
  const active = customerInfo.entitlements?.active ?? {};
  const candidateIds = [
    pack.id,
    `minutes_${pack.minutes}`,
    `pack_${pack.minutes}`,
    `ai_minutes_${pack.minutes}`,
  ].map(normalize);

  const matched = Object.entries(active).some(([key, entry]) => {
    const haystack = [normalize(key), normalize(entry.identifier), normalize(entry.productIdentifier)];
    return candidateIds.some((id) => haystack.includes(id));
  });

  return matched ? pack.minutes : 0;
}

function syncEntitlementsFromCustomerInfo(customerInfo: CustomerInfo, purchasedPack?: AiMinutePack): void {
  const tier = findTier(customerInfo);
  const base = TIER_ENTITLEMENTS[tier];

  if (!purchasedPack || base.aiMinutesRemaining === null) {
    useEntitlements.getState().setEntitlements(base);
    return;
  }

  const current = useEntitlements.getState().entitlements;
  const currentMinutes = current.aiMinutesRemaining ?? 0;
  const addedMinutes = extractPackMinutes(purchasedPack, customerInfo);

  useEntitlements.getState().setEntitlements({
    ...base,
    aiMinutesRemaining: currentMinutes + addedMinutes,
  });
}

function pickPackage(
  offerings: RevenueCatOfferings,
  candidates: string[],
): RevenueCatPackage | undefined {
  const ids = candidates.map(normalize);
  const allPackages = [
    ...(offerings.current?.availablePackages ?? []),
    ...Object.values(offerings.all ?? {}).flatMap((o) => o.availablePackages ?? []),
  ];

  return allPackages.find((pkg) => {
    const packageId = normalize(pkg.identifier);
    const productId = normalize(pkg.product?.identifier);
    return ids.some((id) => id === packageId || id === productId);
  });
}

export async function configurePurchases(apiKey: string): Promise<void> {
  if (!apiKey.trim()) return;

  const purchases = await loadPurchases();
  await purchases.configure({ apiKey });

  try {
    const customerInfo = await purchases.restorePurchases();
    syncEntitlementsFromCustomerInfo(customerInfo);
  } catch {
    // Configuration should not fail app boot just because restore was unavailable.
  }
}

export async function purchaseMinutePack(pack: AiMinutePack): Promise<PurchaseResult> {
  try {
    const purchases = await loadPurchases();
    const offerings = await purchases.getOfferings();
    const pkg = pickPackage(offerings, [pack.id, `pack_${pack.minutes}`, `minutes_${pack.minutes}`]);

    if (!pkg) {
      return { success: false, error: `No RevenueCat package found for ${pack.id}.` };
    }

    const { customerInfo } = await purchases.purchasePackage(pkg);
    syncEntitlementsFromCustomerInfo(customerInfo ?? {}, pack);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Purchase failed.";
    return { success: false, error: message };
  }
}

export async function purchaseSubscription(
  tier: "storyteller" | "creator",
  period: "monthly" | "annual",
): Promise<PurchaseResult> {
  try {
    const purchases = await loadPurchases();
    const offerings = await purchases.getOfferings();

    const pkg = pickPackage(offerings, [
      `${tier}_${period}`,
      `${tier}.${period}`,
      `${tier}-${period}`,
      `${tier}_${period}_subscription`,
    ]);

    if (!pkg) {
      return { success: false, error: `No RevenueCat package found for ${tier} ${period}.` };
    }

    const { customerInfo } = await purchases.purchasePackage(pkg);
    syncEntitlementsFromCustomerInfo(customerInfo ?? {});

    const purchasedTier = useEntitlements.getState().entitlements.tier;
    if (purchasedTier !== tier && tier === "creator") {
      return { success: false, error: "Creator entitlement not active after purchase." };
    }
    if (purchasedTier === "free") {
      return { success: false, error: "Subscription entitlement not active after purchase." };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Purchase failed.";
    return { success: false, error: message };
  }
}

export async function restorePurchases(): Promise<void> {
  const purchases = await loadPurchases();
  const customerInfo = await purchases.restorePurchases();
  syncEntitlementsFromCustomerInfo(customerInfo);
}

// Re-export store selector so callers can access setTier / setEntitlements when needed.
export { useEntitlements };
