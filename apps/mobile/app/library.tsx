import { useRef } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";

export default function Library(): JSX.Element {
  const headingRef = useRef<Text>(null);
  useLandmarkAnnounce("Library", "Your saved campaigns will appear here.", headingRef);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text ref={headingRef} accessibilityRole="header" aria-level={1} style={styles.h1}>
        Library
      </Text>
      <Text style={styles.body}>
        You have no campaigns yet. From the Home screen, create a world or
        upload a game bible to begin.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  h1: { fontSize: 32, fontWeight: "800" },
  body: { fontSize: 18, lineHeight: 26 },
});
