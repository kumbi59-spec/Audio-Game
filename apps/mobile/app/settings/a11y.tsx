import { useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { usePrefs } from "@/prefs/store";
import { speakOnce } from "@/audio/narrator";
import { playCue } from "@/audio/cues";

export default function AccessibilityCenter(): JSX.Element {
  const headingRef = useRef<Text>(null);
  const prefs = usePrefs();

  useLandmarkAnnounce(
    "Accessibility center",
    "Toggle narrator, sound cues, haptics, contrast, motion, and audio-only mode.",
    headingRef,
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        ref={headingRef}
        role="heading"
        aria-level={1}
        style={styles.h1}
      >
        Accessibility center
      </Text>

      <Toggle
        label="Narrator (spoken narration)"
        value={prefs.narratorEnabled}
        onChange={(v) => {
          prefs.setNarratorEnabled(v);
          if (v) void speakOnce("Narrator on.");
        }}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Speech rate</Text>
        <View style={styles.rateRow}>
          <RateButton
            label="Slower"
            onPress={() => {
              prefs.setSpeechRate(prefs.speechRate - 0.1);
              void speakOnce("Slower.");
            }}
          />
          <Text style={styles.rateValue} accessibilityLiveRegion="polite">
            {prefs.speechRate.toFixed(1)}x
          </Text>
          <RateButton
            label="Faster"
            onPress={() => {
              prefs.setSpeechRate(prefs.speechRate + 0.1);
              void speakOnce("Faster.");
            }}
          />
        </View>
      </View>

      <Toggle
        label="Sound cues"
        value={prefs.soundCuesEnabled}
        onChange={(v) => {
          prefs.setSoundCuesEnabled(v);
          if (v) void playCue("success");
        }}
      />

      <Toggle
        label="Haptic feedback"
        value={prefs.hapticsEnabled}
        onChange={(v) => {
          prefs.setHapticsEnabled(v);
          if (v) void playCue("discovery");
        }}
      />

      <Toggle
        label="High contrast"
        value={prefs.highContrast}
        onChange={prefs.setHighContrast}
      />

      <Toggle
        label="Reduce motion"
        value={prefs.reduceMotion}
        onChange={prefs.setReduceMotion}
      />

      <Toggle
        label="Audio-only mode"
        value={prefs.audioOnly}
        onChange={prefs.setAudioOnly}
      />

      <Text style={styles.note}>
        All accessibility features are free on every plan and never gated by
        a paywall.
      </Text>
    </ScrollView>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <Pressable
      role="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
      </View>
    </Pressable>
  );
}

function RateButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.rateBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  h1: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingVertical: 8,
  },
  label: { fontSize: 17, fontWeight: "600", color: "#111827", flex: 1, paddingRight: 12 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rateValue: { fontSize: 16, fontWeight: "700", minWidth: 48, textAlign: "center" },
  rateBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1f2937",
    justifyContent: "center",
  },
  rateBtnText: { color: "#1f2937", fontWeight: "700" },
  track: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  trackOff: { backgroundColor: "#d1d5db" },
  trackOn: { backgroundColor: "#4f46e5" },
  thumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  thumbOff: { alignSelf: "flex-start" },
  thumbOn: { alignSelf: "flex-end" },
  note: { color: "#6b7280", marginTop: 16, fontSize: 14 },
});
