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
import { EQ, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";

export default function AccessibilityCenter(): JSX.Element {
  const headingRef = useRef<Text>(null);
  const prefs = usePrefs();

  useLandmarkAnnounce(
    "Accessibility center",
    "Toggle narrator, sound cues, haptics, contrast, motion, and audio-only mode.",
    headingRef,
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text ref={headingRef} role="heading" aria-level={1} style={styles.h1}>
        Accessibility center
      </Text>

      <SectionLabel>AUDIO</SectionLabel>

      <Toggle
        label="Narrator (spoken narration)"
        hint="Spoken narration for all game text"
        value={prefs.narratorEnabled}
        onChange={(v) => {
          prefs.setNarratorEnabled(v);
          if (v) void speakOnce("Narrator on.");
        }}
      />
      <Toggle
        label="Sound cues"
        hint="Short sounds for game events"
        value={prefs.soundCuesEnabled}
        onChange={(v) => {
          prefs.setSoundCuesEnabled(v);
          if (v) void playCue("success");
        }}
      />

      <View style={styles.row}>
        <View style={styles.rowInfo}>
          <Text style={styles.label}>Speech rate</Text>
          <Text style={styles.hint}>Narration playback speed</Text>
        </View>
        <View style={styles.rateRow}>
          <RateButton
            label="Slower"
            onPress={() => {
              prefs.setSpeechRate(prefs.speechRate - 0.1);
              void speakOnce("Slower.");
            }}
          />
          <Text style={styles.rateValue} accessibilityLiveRegion="polite">
            {prefs.speechRate.toFixed(1)}×
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

      <SectionLabel>DISPLAY</SectionLabel>

      <Toggle
        label="High contrast"
        hint="Stronger colour contrast throughout"
        value={prefs.highContrast}
        onChange={prefs.setHighContrast}
      />
      <Toggle
        label="Reduce motion"
        hint="Disable animations and transitions"
        value={prefs.reduceMotion}
        onChange={prefs.setReduceMotion}
      />

      <SectionLabel>INTERACTION</SectionLabel>

      <Toggle
        label="Haptic feedback"
        hint="Vibrate on choices, saves, and danger events"
        value={prefs.hapticsEnabled}
        onChange={(v) => {
          prefs.setHapticsEnabled(v);
          if (v) void playCue("discovery");
        }}
      />
      <Toggle
        label="Audio-only mode"
        hint="Hide all non-essential visual elements"
        value={prefs.audioOnly}
        onChange={prefs.setAudioOnly}
      />

      <Text style={styles.note}>
        All accessibility features are free on every plan and never gated by a paywall.
      </Text>
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: string }): JSX.Element {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <Pressable
      role="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
      </View>
    </Pressable>
  );
}

function RateButton({ label, onPress }: { label: string; onPress: () => void }): JSX.Element {
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
  root: { flex: 1, backgroundColor: EQ.bg },
  container: { padding: SPACE[6], gap: SPACE[2] },

  h1: { fontSize: FS.hero, fontWeight: "700", color: EQ.text, letterSpacing: -0.5, marginBottom: SPACE[3] },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: EQ.textFaint,
    letterSpacing: 1.2,
    marginTop: SPACE[4],
    marginBottom: SPACE[1],
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: TOUCH_MIN,
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: EQ.border2,
  },
  rowInfo: { flex: 1, paddingRight: SPACE[3] },
  label: { fontSize: FS.base, fontWeight: "600", color: EQ.text },
  hint: { fontSize: FS.xs, color: EQ.textFaint, marginTop: 2 },

  rateRow: { flexDirection: "row", alignItems: "center", gap: SPACE[2] },
  rateValue: { fontSize: FS.base, fontWeight: "700", color: EQ.text, minWidth: 40, textAlign: "center" },
  rateBtn: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: SPACE[3],
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface,
    justifyContent: "center",
  },
  rateBtnText: { color: EQ.text, fontWeight: "700", fontSize: FS.sm },

  track: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  trackOff: { backgroundColor: EQ.surface3 },
  trackOn: { backgroundColor: EQ.accent },
  thumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  thumbOff: { alignSelf: "flex-start" },
  thumbOn: { alignSelf: "flex-end" },

  note: { color: EQ.textFaint, marginTop: SPACE[6], fontSize: FS.sm, lineHeight: 20 },
});
