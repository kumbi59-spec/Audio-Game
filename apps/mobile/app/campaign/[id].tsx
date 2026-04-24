import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { useVoiceCommands } from "@/voice/commandBus";

export default function ActiveCampaign(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const headingRef = useRef<Text>(null);

  useLandmarkAnnounce(
    "Active campaign",
    "The scaffold does not yet connect to the game master. Tap the mic or say a choice number to try a turn.",
    headingRef,
  );

  useVoiceCommands({
    "repeat|read that again": () => {
      /* Phase 1: replay last narration_chunk stream */
    },
    "summarize|where am i|what just happened": () => {
      /* Phase 1: request_recap via WebSocket */
    },
    "inventory|what do i have": () => {
      /* Phase 1: open inventory modal with spoken list */
    },
    "save|save and pause|pause": () => {
      /* Phase 1: send pause event */
    },
    "do something else|custom action": () => {
      /* Phase 1: open freeform mic */
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text ref={headingRef} accessibilityRole="header" accessibilityLevel={1} style={styles.h1}>
        Active campaign
      </Text>
      <Text accessibilityRole="text" style={styles.meta}>
        Campaign id: {id}
      </Text>
      <View accessibilityRole="text" style={styles.transcript}>
        <Text style={styles.transcriptText}>
          The game master will narrate here. Choices appear below, and you can
          always say "do something else" to attempt a freeform action.
        </Text>
      </View>

      <View style={styles.dock}>
        <DockButton label="Mic" hint="Hold to speak a choice or custom action" />
        <DockButton label="Repeat" hint="Replay the last narration" />
        <DockButton label="Summarize" hint="Recap the scene so far" />
        <DockButton label="Menu" hint="Inventory, character, quests, save" />
      </View>
    </ScrollView>
  );
}

function DockButton({ label, hint }: { label: string; hint: string }): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.dockBtn, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.dockBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  h1: { fontSize: 32, fontWeight: "800" },
  meta: { fontSize: 14, color: "#6b7280" },
  transcript: {
    minHeight: 240,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f3f4f6",
  },
  transcriptText: { fontSize: 18, lineHeight: 28 },
  dock: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  dockBtn: {
    flexGrow: 1,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  dockBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
