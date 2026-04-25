import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { useVoiceCommands } from "@/voice/commandBus";
import { createCampaign } from "@/api/rest";
import { sessionConnection } from "@/session/connection";
import { useSession } from "@/session/store";

export default function Home(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLandmarkAnnounce(
    "Home",
    "Tap or say start sample adventure to begin The Sunken Bell. Other options will arrive in upcoming updates.",
    headingRef,
  );

  const startSample = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      const result = await createCampaign({});
      useSession.getState().joined({
        campaignId: result.campaignId,
        authToken: result.authToken,
        title: result.title,
        state: result.state,
      });
      await sessionConnection.connect({
        campaignId: result.campaignId,
        authToken: result.authToken,
      });
      sessionConnection.sendPlayerInput({
        kind: "utility",
        command: "begin",
      });
      router.push({
        pathname: "/campaign/[id]",
        params: { id: result.campaignId },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start a campaign.");
    } finally {
      setStarting(false);
    }
  }, [router]);

  useVoiceCommands({
    "start sample|sample adventure|begin sample|play sunken bell": () => {
      void startSample();
    },
    "library|my library": () => router.push("/library"),
    "create|create world|new world": () => router.push("/create"),
    "upload|upload bible|upload game bible": () => router.push("/upload"),
    "accessibility|settings": () => router.push("/settings/a11y"),
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        ref={headingRef}
        role="heading"
        aria-level={1}
        style={styles.h1}
      >
        Home
      </Text>

      <PrimaryAction
        label={starting ? "Starting…" : "Start sample adventure"}
        hint="Begin The Sunken Bell, a short gothic mystery"
        onPress={startSample}
        disabled={starting}
        loading={starting}
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
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}

interface ActionProps {
  label: string;
  hint?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function PrimaryAction({ label, hint, onPress, disabled, loading }: ActionProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed, disabled && styles.btnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
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
  container: { padding: 24, gap: 16 },
  h1: { fontSize: 36, fontWeight: "800", marginBottom: 16 },
  primaryBtn: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: "#1f2937",
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  primaryBtnText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  secondaryBtn: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1f2937",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#1f2937", fontSize: 18, fontWeight: "600" },
  btnPressed: { opacity: 0.7 },
  btnDisabled: { opacity: 0.5 },
  footerRow: { marginTop: 24 },
  error: { color: "#b91c1c", fontWeight: "600", marginTop: 12 },
});
