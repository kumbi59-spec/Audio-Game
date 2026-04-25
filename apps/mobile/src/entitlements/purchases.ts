// TODO: npx expo install react-native-purchases
// TODO: import Purchases from "react-native-purchases";

import type { AiMinutePack } from "@audio-rpg/shared";
import { useEntitlements } from "./store";

export async function configurePurchases(_apiKey: string): Promise<void> {
  // TODO: await Purchases.configure({ apiKey });
}

export async function purchaseMinutePack(pack: AiMinutePack): Promise<{ success: boolean; error?: string }> {
  // TODO: const { customerInfo } = await Purchases.purchaseStoreProduct(product);
  // TODO: verify entitlement and call useEntitlements.getState().setEntitlements(...)
  void pack;
  return { success: false, error: "Payment SDK not yet configured. See TODO in purchases.ts." };
}

export async function purchaseSubscription(
  tier: "storyteller" | "creator",
  period: "monthly" | "annual",
): Promise<{ success: boolean; error?: string }> {
  // TODO: const { customerInfo } = await Purchases.purchaseStoreProduct(product);
  // TODO: map RevenueCat entitlement to Tier and call setTier
  void tier; void period;
  return { success: false, error: "Payment SDK not yet configured. See TODO in purchases.ts." };
}

export async function restorePurchases(): Promise<void> {
  // TODO: const customerInfo = await Purchases.restorePurchases();
  // TODO: sync tier from customerInfo.entitlements.active
}

// Re-export store selector so callers can access setTier / setEntitlements when needed.
export { useEntitlements };
