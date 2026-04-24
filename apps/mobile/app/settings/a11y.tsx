import { useRef } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";

export default function AccessibilityCenter(): JSX.Element {
  const headingRef = useRef<Text>(null);
  useLandmarkAnnounce(
    "Accessibility center",
    "Voice, TTS, haptics, text size, and sound cue settings live here.",
    headingRef,
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text ref={headingRef} accessibilityRole="header" aria-level={1} style={styles.h1}>
        Accessibility center
      </Text>
      <Text style={styles.body}>
        Settings for narrator voice, speech rate, audio-only mode, haptics,
        text size, contrast, captions, and sound cues. All accessibility
        features are free on every tier.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  h1: { fontSize: 32, fontWeight: "800" },
  body: { fontSize: 18, lineHeight: 26 },
});
