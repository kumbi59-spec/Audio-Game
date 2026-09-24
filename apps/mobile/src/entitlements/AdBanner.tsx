import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { EQ, R, SPACE, FS } from "@/design/tokens";
import { useCan } from "./store";

/**
 * Adsterra Smartlink — the ad format Adsterra supports inside apps (their
 * embedded web ad units only work on websites). Opens in the system browser.
 */
const SPONSORED_SMARTLINK_URL =
  "https://www.profitableratecpmnetwork.com/zb1zt3aeix?key=6924bb55550ed25fb03c437c4d0a6b74";

interface Props {
  /** Called when the user taps "Remove ads" — show the UpgradePrompt from the parent */
  onUpgradePress: () => void;
}

/**
 * Slim non-intrusive banner shown only on the free tier, with a labelled
 * Sponsored (Adsterra Smartlink) button and a "Remove ads" upgrade button.
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
        accessibilityRole="link"
        accessibilityLabel="Sponsored — advertisement, opens in your browser"
        onPress={() => {
          void Linking.openURL(SPONSORED_SMARTLINK_URL).catch(() => {});
        }}
        style={({ pressed }) => [styles.sponsored, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.sponsoredText}>Sponsored</Text>
      </Pressable>
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
  sponsored: {
    borderWidth: 1,
    borderColor: EQ.border,
    borderRadius: R.sm,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  sponsoredText: { fontSize: FS.xs, fontWeight: "600", color: EQ.textFaint },
});
