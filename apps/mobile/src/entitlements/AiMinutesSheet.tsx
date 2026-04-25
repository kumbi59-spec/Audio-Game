import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AI_MINUTE_PACKS, type AiMinutePack } from "@audio-rpg/shared";
import { EQ, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";
import { speakOnce } from "@/audio/narrator";
import { useEntitlements } from "./store";
import { purchaseMinutePack } from "./purchases";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  /** Called when the user taps a pack — integrate with your payment SDK here */
  onPurchase?: (pack: AiMinutePack) => void;
}

/**
 * Bottom sheet that lets free users buy AI minute credit packs.
 * Reads the prompt aloud on open for screen-reader users.
 */
export function AiMinutesSheet({ visible, onDismiss, onPurchase }: Props) {
  const remaining = useEntitlements((s) => s.entitlements.aiMinutesRemaining);

  if (!visible) return null;

  const announce = () => {
    void speakOnce(
      `You have ${remaining ?? 0} AI minutes remaining. Buy a pack to keep playing. Choose 60 minutes for $1.99, 3 hours for $4.99, or 10 hours for $14.99.`,
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
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <View style={styles.sheet} onLayout={announce}>
        <View style={styles.handle} />

        <Text role="heading" aria-level={2} style={styles.h2}>
          Top up AI Minutes
        </Text>
        <Text style={styles.sub}>
          You have{" "}
          <Text style={styles.accent}>{remaining ?? 0} minutes</Text> remaining.
        </Text>

        <View style={styles.packs}>
          {AI_MINUTE_PACKS.map((pack) => (
            <Pressable
              key={pack.id}
              accessibilityRole="button"
              accessibilityLabel={`Buy ${pack.label} for $${(pack.priceCents / 100).toFixed(2)}`}
              onPress={() => {
                onDismiss();
                if (onPurchase) {
                  onPurchase(pack);
                } else {
                  void purchaseMinutePack(pack);
                }
              }}
              style={({ pressed }) => [styles.packCard, pressed && { opacity: 0.75 }]}
            >
              {pack.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pack.badge}</Text>
                </View>
              )}
              <Text style={styles.packMinutes}>{pack.label}</Text>
              <Text style={styles.packPrice}>
                ${(pack.priceCents / 100).toFixed(2)}
              </Text>
              <Text style={styles.packUnit}>one-time</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.note}>
          Or upgrade to Storyteller ($9/mo) for unlimited AI time and no ads.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.dismissText}>Maybe later</Text>
        </Pressable>
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

  packs: { flexDirection: "row", gap: SPACE[2] },
  packCard: {
    flex: 1,
    backgroundColor: EQ.surface2,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    padding: SPACE[3],
    alignItems: "center",
    gap: SPACE[1],
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: EQ.accent,
    paddingHorizontal: SPACE[2],
    paddingVertical: 2,
    borderBottomLeftRadius: R.sm,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#fff" },
  packMinutes: { fontSize: FS.base, fontWeight: "700", color: EQ.text, marginTop: SPACE[2] },
  packPrice: { fontSize: FS["2xl"], fontWeight: "700", color: EQ.accent },
  packUnit: { fontSize: FS.xs, color: EQ.textFaint },

  note: { fontSize: FS.xs, color: EQ.textFaint, lineHeight: 18, textAlign: "center" },

  dismissBtn: {
    minHeight: TOUCH_MIN,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissText: { color: EQ.textMuted, fontSize: FS.sm, fontWeight: "600" },
});
