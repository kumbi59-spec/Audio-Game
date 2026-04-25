import { Pressable, StyleSheet, Text, View } from "react-native";
import { EQ, R, SPACE, FS } from "@/design/tokens";
import { useCan } from "./store";

interface Props {
  /** Called when the user taps "Remove ads" — show the UpgradePrompt from the parent */
  onUpgradePress: () => void;
}

/**
 * Slim non-intrusive banner shown only on the free tier.
 * Renders nothing for paid users — zero performance cost.
 */
export function AdBanner({ onUpgradePress }: Props) {
  const can = useCan();
  if (!can.showAds) return null;

  return (
    <View
      style={styles.bar}
      accessibilityRole="none"
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.label} numberOfLines={1}>
        🎮 EchoQuest — Upgrade to remove ads
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove ads — upgrade to Storyteller"
        onPress={onUpgradePress}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.ctaText}>Remove ads</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: EQ.surface2,
    borderTopWidth: 1,
    borderTopColor: EQ.border,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    gap: SPACE[2],
  },
  label: {
    flex: 1,
    fontSize: FS.xs,
    color: EQ.textFaint,
  },
  cta: {
    backgroundColor: EQ.accent,
    borderRadius: R.sm,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  ctaText: { fontSize: FS.xs, fontWeight: "700", color: "#fff" },
});
