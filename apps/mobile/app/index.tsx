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
import { EQ, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";

export default function Home(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLandmarkAnnounce(
    "Home",
    "Tap or say start new adventure to begin The Sunken Bell. Say library, create world, or upload game bible for other options.",
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
      sessionConnection.sendPlayerInput({ kind: "utility", command: "begin" });
      router.push({ pathname: "/campaign/[id]", params: { id: result.campaignId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start a campaign.");
    } finally {
      setStarting(false);
    }
  }, [router]);

  useVoiceCommands({
    "start sample|sample adventure|begin sample|play sunken bell|new adventure|start new": () => {
      void startSample();
    },
    "library|my library|browse": () => router.push("/library"),
    "create|create world|new world": () => router.push("/create"),
    "upload|upload bible|upload game bible": () => router.push("/upload"),
    "accessibility|settings": () => router.push("/settings/a11y"),
  });

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brandLabel}>ECHOQUEST</Text>
        <Text
          ref={headingRef}
          role="heading"
          aria-level={1}
          accessibilityLabel="Home"
          style={styles.h1}
        >
          Your adventure{"\n"}awaits.
        </Text>
        <Text style={styles.tagline}>
          Narrated interactive adventures, powered by AI.{"\n"}Accessible to everyone.
        </Text>
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>CONTINUE ADVENTURE</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={starting ? "Beginning your adventure…" : "Start sample adventure"}
        accessibilityHint="Begin The Sunken Bell, a short gothic mystery"
        accessibilityState={{ busy: starting, disabled: starting }}
        onPress={startSample}
        disabled={starting}
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && styles.btnPressed,
          starting && styles.btnDisabled,
        ]}
      >
        <View pointerEvents="none" style={styles.topEdgeHighlight} />
        {starting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.primaryBtnTitle}>Start New Adventure</Text>
            <Text style={styles.primaryBtnSub}>The Sunken Bell · gothic mystery</Text>
          </>
        )}
      </Pressable>

      <View style={[styles.sectionLabel, { marginTop: SPACE[4] }]}>
        <Text style={styles.sectionLabelText}>EXPLORE</Text>
      </View>

      <View style={styles.grid}>
        <NavCard
          label="Browse Library"
          accessibilityLabel="Library"
          sub="Your campaigns & worlds"
          onPress={() => router.push("/library")}
        />
        <NavCard
          label="Create World"
          accessibilityLabel="Create world"
          sub="Spoken wizard"
          onPress={() => router.push("/create")}
        />
        <NavCard
          label="Upload Bible"
          accessibilityLabel="Upload game bible"
          sub="PDF, DOCX, text"
          onPress={() => router.push("/upload")}
          wide
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Accessibility"
          onPress={() => router.push("/settings/a11y")}
          style={({ pressed }) => [styles.textLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.textLinkText}>Accessibility Settings</Text>
        </Pressable>
      </View>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}

function NavCard({
  label,
  accessibilityLabel,
  sub,
  onPress,
  wide,
}: {
  label: string;
  accessibilityLabel?: string;
  sub: string;
  onPress: () => void;
  wide?: boolean;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={sub}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navCard,
        wide && styles.navCardWide,
        pressed && styles.btnPressed,
      ]}
    >
      <View pointerEvents="none" style={styles.topEdgeHighlight} />
      <Text style={styles.navCardLabel}>{label}</Text>
      <Text style={styles.navCardSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EQ.bg },
  container: { padding: SPACE[6], gap: SPACE[3] },

  header: { gap: SPACE[2], marginBottom: SPACE[2] },
  brandLabel: {
    fontSize: FS.xs,
    fontWeight: "600",
    color: EQ.accent,
    letterSpacing: 2,
  },
  h1: {
    fontSize: FS.hero,
    fontWeight: "700",
    color: EQ.text,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  tagline: {
    fontSize: FS.sm,
    color: EQ.textMuted,
    lineHeight: 20,
  },

  sectionLabel: { marginTop: SPACE[2] },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: EQ.textFaint,
    letterSpacing: 1.2,
  },

  primaryBtn: {
    minHeight: TOUCH_MIN + 16,
    borderRadius: R.lg,
    backgroundColor: EQ.accent,
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    justifyContent: "center",
    shadowColor: EQ.accent,
    borderWidth: 1,
    borderColor: EQ.border2,
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryBtnTitle: { color: "#fff", fontSize: FS.lg, fontWeight: "700" },
  primaryBtnSub: { color: "rgba(255,255,255,0.65)", fontSize: FS.xs, marginTop: 3 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACE[2] },
  navCard: {
    flex: 1,
    minWidth: "45%",
    minHeight: TOUCH_MIN + 12,
    backgroundColor: EQ.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    shadowColor: EQ.bg2,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
    padding: SPACE[4],
    justifyContent: "center",
    overflow: "hidden",
  },
  navCardWide: { flexBasis: "100%", flexGrow: 0 },
  navCardLabel: { fontSize: FS.sm, fontWeight: "700", color: EQ.text },
  navCardSub: { fontSize: FS.xs, color: EQ.textMuted, marginTop: 3 },

  footer: { alignItems: "center", marginTop: SPACE[4] },
  textLink: { padding: SPACE[2] },
  textLinkText: { color: EQ.accent, fontSize: FS.sm, fontWeight: "600" },

  btnPressed: { opacity: 0.75 },
  btnDisabled: { opacity: 0.4 },
  error: { color: EQ.danger, fontWeight: "600", marginTop: SPACE[2] },
  topEdgeHighlight: {
    position: "absolute",
    top: 0,
    left: 1,
    right: 1,
    height: 1,
    backgroundColor: EQ.border2,
    opacity: 0.9,
  },
});
