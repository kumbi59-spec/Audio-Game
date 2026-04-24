import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { useVoiceCommands } from "@/voice/commandBus";

export default function Home(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);

  useLandmarkAnnounce(
    "Home",
    "4 primary actions. Continue an adventure, browse your library, create a world, or upload a game bible. Say help for commands.",
    headingRef,
  );

  useVoiceCommands({
    "continue|continue adventure": () => router.push("/campaign/last"),
    "library|my library": () => router.push("/library"),
    "create|create world|new world": () => router.push("/create"),
    "upload|upload bible|upload game bible": () => router.push("/upload"),
    "accessibility|settings": () => router.push("/settings/a11y"),
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        ref={headingRef}
        accessibilityRole="header"
        accessibilityLevel={1}
        style={styles.h1}
      >
        Home
      </Text>

      <PrimaryAction
        label="Continue adventure"
        hint="Resume your most recent campaign"
        onPress={() => router.push("/campaign/last")}
      />
      <PrimaryAction
        label="Library"
        hint="Browse your saved campaigns and uploaded worlds"
        onPress={() => router.push("/library")}
      />
      <PrimaryAction
        label="Create world"
        hint="Walk through a spoken wizard to design a new world"
        onPress={() => router.push("/create")}
      />
      <PrimaryAction
        label="Upload game bible"
        hint="Turn a PDF, DOCX, or text file into a playable world"
        onPress={() => router.push("/upload")}
      />

      <View style={styles.footerRow}>
        <SecondaryAction
          label="Accessibility"
          onPress={() => router.push("/settings/a11y")}
        />
      </View>
    </ScrollView>
  );
}

interface ActionProps {
  label: string;
  hint?: string;
  onPress: () => void;
}

function PrimaryAction({ label, hint, onPress }: ActionProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryAction({
  label,
  onPress,
}: Omit<ActionProps, "hint">): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
    >
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  h1: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 16,
  },
  primaryBtn: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: "#1f2937",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  secondaryBtn: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1f2937",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "600",
  },
  btnPressed: {
    opacity: 0.7,
  },
  footerRow: {
    marginTop: 24,
  },
});
