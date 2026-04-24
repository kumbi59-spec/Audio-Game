import { useRef } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";

export default function CreateWorld(): JSX.Element {
  const headingRef = useRef<Text>(null);
  useLandmarkAnnounce(
    "Create world",
    "A 10-step spoken wizard will build your world. This screen is a placeholder in the scaffold.",
    headingRef,
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text ref={headingRef} accessibilityRole="header" aria-level={1} style={styles.h1}>
        Create world
      </Text>
      <Text style={styles.body}>
        The Create World wizard walks you through name, genre, tone, rules,
        starting scenario, and narration style, then hands you straight to
        the first scene.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  h1: { fontSize: 32, fontWeight: "800" },
  body: { fontSize: 18, lineHeight: 26 },
});
