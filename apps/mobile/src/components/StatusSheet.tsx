import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { CampaignState } from "@audio-rpg/shared";
import { EQ, FS, R, SPACE, TOUCH_MIN } from "@/design/tokens";
import { speakOnce } from "@/audio/narrator";

type Tab = "achievements" | "people" | "lore";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  state: CampaignState;
}

function standingLabel(standing: number): string {
  if (standing >= 60) return "Ally";
  if (standing >= 20) return "Friendly";
  if (standing >= -20) return "Neutral";
  if (standing >= -60) return "Hostile";
  return "Enemy";
}

function standingColor(standing: number): string {
  if (standing >= 60) return EQ.success;
  if (standing >= 20) return "#4ade80";
  if (standing >= -20) return EQ.textMuted;
  if (standing >= -60) return EQ.warning;
  return EQ.danger;
}

export function StatusSheet({ visible, onDismiss, state }: Props) {
  const [tab, setTab] = useState<Tab>("achievements");

  if (!visible) return null;

  const handleOpen = () => {
    const achCount = state.achievements.length;
    const pplCount = state.relationships.length;
    const loreCount = state.codex.length;
    void speakOnce(
      `Status sheet. ${achCount} achievement${achCount !== 1 ? "s" : ""}, ` +
      `${pplCount} NPC${pplCount !== 1 ? "s" : ""}, ` +
      `${loreCount} lore entr${loreCount !== 1 ? "ies" : "y"}.`
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
        accessibilityLabel="Close status sheet"
      />
      <View style={styles.sheet} onLayout={handleOpen}>
        <View style={styles.handle} />

        <Text role="heading" aria-level={2} style={styles.h2}>
          Campaign Status
        </Text>

        {/* Tab bar */}
        <View style={styles.tabs} accessibilityRole="tablist">
          {(["achievements", "people", "lore"] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = {
              achievements: `Achievements${state.achievements.length > 0 ? ` (${state.achievements.length})` : ""}`,
              people: `People${state.relationships.length > 0 ? ` (${state.relationships.length})` : ""}`,
              lore: `Lore${state.codex.length > 0 ? ` (${state.codex.length})` : ""}`,
            };
            return (
              <Pressable
                key={t}
                role="tab"
                aria-selected={tab === t}
                accessibilityLabel={labels[t]}
                onPress={() => setTab(t)}
                style={({ pressed }) => [
                  styles.tab,
                  tab === t && styles.tabActive,
                  pressed && styles.tabPressed,
                ]}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {labels[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab content */}
        <ScrollView style={styles.content}>
          {tab === "achievements" && (
            state.achievements.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>No achievements yet. Keep adventuring!</Text>
              </View>
            ) : (
              state.achievements.map((a) => (
                <View key={a.key} style={styles.card}>
                  <Text style={styles.cardIcon}>🏆</Text>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{a.title}</Text>
                    <Text style={styles.cardDesc}>{a.description}</Text>
                    <Text style={styles.cardMeta}>Turn {a.unlocked_turn}</Text>
                  </View>
                </View>
              ))
            )
          )}

          {tab === "people" && (
            state.relationships.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No NPCs met yet. Explore and interact with the world!</Text>
              </View>
            ) : (
              [...state.relationships]
                .sort((a, b) => Math.abs(b.standing) - Math.abs(a.standing))
                .map((r) => {
                  const label = standingLabel(r.standing);
                  const color = standingColor(r.standing);
                  const barWidth = Math.min(100, Math.abs(r.standing));
                  return (
                    <View key={r.npc} style={styles.card}>
                      <View style={styles.cardBody}>
                        <View style={styles.npcRow}>
                          <Text style={styles.cardTitle}>{r.npc}</Text>
                          <Text style={[styles.npcLabel, { color }]}>{label}</Text>
                        </View>
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${barWidth}%` as `${number}%`, backgroundColor: color }]} />
                        </View>
                        {r.notes && <Text style={styles.cardDesc}>{r.notes}</Text>}
                      </View>
                    </View>
                  );
                })
            )
          )}

          {tab === "lore" && (
            state.codex.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={styles.emptyText}>No lore discovered yet. Investigate your surroundings!</Text>
              </View>
            ) : (
              [...state.codex]
                .sort((a, b) => b.unlocked_turn - a.unlocked_turn)
                .map((c) => (
                  <View key={c.key} style={styles.card}>
                    <Text style={styles.cardIcon}>📖</Text>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{c.title}</Text>
                      <Text style={styles.cardDesc}>{c.body}</Text>
                      <Text style={styles.cardMeta}>Discovered turn {c.unlocked_turn}</Text>
                    </View>
                  </View>
                ))
            )
          )}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onDismiss}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.closeBtnText}>Close</Text>
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
    padding: SPACE[4],
    paddingBottom: SPACE[8],
    maxHeight: "80%",
    gap: SPACE[3],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: EQ.surface3,
    alignSelf: "center",
    marginBottom: SPACE[1],
  },
  h2: { fontSize: FS["2xl"], fontWeight: "700", color: EQ.text, letterSpacing: -0.3 },

  tabs: {
    flexDirection: "row",
    gap: SPACE[2],
    borderBottomWidth: 1,
    borderBottomColor: EQ.border,
    paddingBottom: SPACE[2],
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_MIN,
    borderRadius: R.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACE[2],
    backgroundColor: EQ.surface2,
  },
  tabActive: {
    backgroundColor: EQ.accentBg,
    borderWidth: 1,
    borderColor: EQ.accent,
  },
  tabPressed: { opacity: 0.75 },
  tabText: { fontSize: FS.xs, fontWeight: "600", color: EQ.textMuted },
  tabTextActive: { color: EQ.accent },

  content: { flexGrow: 0, maxHeight: 340 },

  emptyState: { alignItems: "center", paddingVertical: SPACE[10], gap: SPACE[2] },
  emptyIcon: { fontSize: 32, opacity: 0.3 },
  emptyText: { fontSize: FS.sm, color: EQ.textFaint, textAlign: "center" },

  card: {
    flexDirection: "row",
    gap: SPACE[3],
    backgroundColor: EQ.surface2,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    padding: SPACE[3],
    marginBottom: SPACE[2],
    alignItems: "flex-start",
  },
  cardIcon: { fontSize: 20, lineHeight: 24 },
  cardBody: { flex: 1, gap: SPACE[1] },
  cardTitle: { fontSize: FS.sm, fontWeight: "700", color: EQ.text },
  cardDesc: { fontSize: FS.xs, color: EQ.textMuted, lineHeight: 18 },
  cardMeta: { fontSize: FS.xs, color: EQ.textFaint },

  npcRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  npcLabel: { fontSize: FS.xs, fontWeight: "700" },
  barBg: { height: 4, borderRadius: 2, backgroundColor: EQ.surface3, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 2 },

  closeBtn: {
    minHeight: TOUCH_MIN,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { color: EQ.textMuted, fontSize: FS.sm, fontWeight: "600" },
});
