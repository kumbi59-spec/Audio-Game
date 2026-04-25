import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Tier } from "@audio-rpg/shared";
import { TIER_HIGHLIGHTS, PRICING } from "@audio-rpg/shared";
import { EQ, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";
import { speakOnce } from "@/audio/narrator";

interface Props {
  visible: boolean;
  requiredTier: Exclude<Tier, "free" | "enterprise">;
  featureName: string;
  onDismiss: () => void;
  onUpgrade?: (tier: Tier) => void;
}

/**
 * Bottom-sheet paywall prompt. Appears when a user on a lower tier
 * tries to access a gated feature. Reads the feature name aloud on open.
 */
export function UpgradePrompt({ visible, requiredTier, featureName, onDismiss, onUpgrade }: Props) {
  const pricing = PRICING[requiredTier];
  const highlights = TIER_HIGHLIGHTS[requiredTier];
  const tierLabel = requiredTier === "storyteller" ? "Storyteller" : "Creator";

  if (!visible) return null;

  const announce = () => {
    void speakOnce(
      `${featureName} requires the ${tierLabel} plan. ${tierLabel} is $${pricing.monthly} per month or $${pricing.annual} per year. Scroll to see what's included.`,
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close upgrade prompt" />
      <View style={styles.sheet} onLayout={announce}>
        <View style={styles.handle} />

        <Text role="heading" aria-level={2} style={styles.h2}>
          Unlock {featureName}
        </Text>
        <Text style={styles.sub}>
          Available on the{" "}
          <Text style={styles.accent}>{tierLabel}</Text> plan
        </Text>

        {/* Pricing pills */}
        <View style={styles.pricingRow}>
          <View style={styles.pricePill}>
            <Text style={styles.priceAmount}>${pricing.monthly}</Text>
            <Text style={styles.priceUnit}>/month</Text>
          </View>
          <Text style={styles.pricingOr}>or</Text>
          <View style={[styles.pricePill, styles.pricePillAnnual]}>
            <Text style={[styles.priceAmount, { color: EQ.accent }]}>${pricing.annual}</Text>
            <Text style={styles.priceUnit}>/year</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 30%</Text>
            </View>
          </View>
        </View>

        {/* What's included */}
        <Text style={styles.includesLabel}>WHAT'S INCLUDED</Text>
        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          {highlights.map((item) => (
            <View key={item} style={styles.listItem}>
              <Text style={styles.listCheck} aria-hidden>✓</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Accessibility note */}
        <Text style={styles.accessNote}>
          All accessibility features — narrator, voice commands, keyboard navigation — are always free.
        </Text>

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
            onPress={onDismiss}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.secondaryBtnText}>Maybe later</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Upgrade to ${tierLabel}`}
            onPress={() => {
              onDismiss();
              onUpgrade?.(requiredTier);
            }}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.primaryBtnText}>Upgrade to {tierLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: EQ.surface,
    borderTopLeftRadius: R["3xl"],
    borderTopRightRadius: R["3xl"],
    padding: SPACE[6],
    paddingBottom: SPACE[8],
    gap: SPACE[3],
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: EQ.surface3,
    alignSelf: "center",
    marginBottom: SPACE[2],
  },

  h2: { fontSize: FS["2xl"], fontWeight: "700", color: EQ.text, letterSpacing: -0.3 },
  sub: { fontSize: FS.base, color: EQ.textMuted },
  accent: { color: EQ.accent, fontWeight: "700" },

  pricingRow: { flexDirection: "row", alignItems: "center", gap: SPACE[3] },
  pricePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    backgroundColor: EQ.surface2,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    padding: SPACE[3],
  },
  pricePillAnnual: { borderColor: EQ.accent, position: "relative" },
  priceAmount: { fontSize: FS["2xl"], fontWeight: "700", color: EQ.text },
  priceUnit: { fontSize: FS.sm, color: EQ.textMuted },
  pricingOr: { fontSize: FS.sm, color: EQ.textFaint },
  saveBadge: {
    position: "absolute",
    top: -8,
    right: SPACE[2],
    backgroundColor: EQ.accent,
    borderRadius: R.sm,
    paddingHorizontal: SPACE[2],
    paddingVertical: 2,
  },
  saveBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  includesLabel: { fontSize: 10, fontWeight: "600", color: EQ.textFaint, letterSpacing: 1.2, marginTop: SPACE[1] },
  listScroll: { maxHeight: 180 },
  listItem: { flexDirection: "row", gap: SPACE[2], paddingVertical: SPACE[1] },
  listCheck: { color: EQ.accent, fontWeight: "700", fontSize: FS.base },
  listText: { color: EQ.textMuted, fontSize: FS.sm, flex: 1, lineHeight: 20 },

  accessNote: { fontSize: FS.xs, color: EQ.textFaint, lineHeight: 18 },

  ctaRow: { flexDirection: "row", gap: SPACE[2], marginTop: SPACE[2] },
  primaryBtn: {
    flex: 2,
    minHeight: TOUCH_MIN,
    borderRadius: R.lg,
    backgroundColor: EQ.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: EQ.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  primaryBtnText: { color: "#fff", fontSize: FS.base, fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    minHeight: TOUCH_MIN,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: { color: EQ.textMuted, fontSize: FS.sm, fontWeight: "600" },
});
