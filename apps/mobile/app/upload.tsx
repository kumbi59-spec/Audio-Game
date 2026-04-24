import { useRef } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";

export default function UploadBible(): JSX.Element {
  const headingRef = useRef<Text>(null);
  useLandmarkAnnounce(
    "Upload game bible",
    "Pick a PDF, DOCX, or text file, or paste text. We'll read it aloud when it's ready.",
    headingRef,
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text ref={headingRef} accessibilityRole="header" accessibilityLevel={1} style={styles.h1}>
        Upload game bible
      </Text>
      <Text style={styles.body}>
        Upload a PDF, DOCX, Markdown, or text file (up to 10 MB on
        Storyteller plan). Parsing typically finishes in under a minute.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  h1: { fontSize: 32, fontWeight: "800" },
  body: { fontSize: 18, lineHeight: 26 },
});
