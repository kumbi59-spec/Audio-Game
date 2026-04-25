import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { useVoiceCommands } from "@/voice/commandBus";
import {
  createCampaign,
  listCampaigns,
  listWorlds,
  type CampaignSummary,
  type WorldSummary,
} from "@/api/rest";
import { sessionConnection } from "@/session/connection";
import { useSession } from "@/session/store";
import { EQ, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";

export default function Library(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);
  const [worlds, setWorlds] = useState<WorldSummary[] | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const summary = describeContents(worlds, campaigns);
  useLandmarkAnnounce("Library", summary, headingRef);

  const refresh = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const [w, c] = await Promise.all([listWorlds(), listCampaigns()]);
      setWorlds(w);
      setCampaigns(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load library.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const startWorld = useCallback(
    async (world: WorldSummary) => {
      setBusyId(world.worldId);
      try {
        const result = await createCampaign({ worldId: world.worldId });
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
        setError(e instanceof Error ? e.message : "Could not start campaign.");
      } finally {
        setBusyId(null);
      }
    },
    [router],
  );

  useVoiceCommands({ "refresh|reload": () => { void refresh(); } });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={EQ.accent} />}
    >
      <Text ref={headingRef} role="heading" aria-level={1} style={styles.h1}>
        Library
      </Text>

      <Section title="CONTINUE ADVENTURE">
        {campaigns === null ? (
          <ActivityIndicator color={EQ.accent} />
        ) : campaigns.length === 0 ? (
          <Text style={styles.empty}>No campaigns yet. Start one from a world below.</Text>
        ) : (
          campaigns.map((c) => (
            <Pressable
              key={c.campaignId}
              accessibilityRole="button"
              accessibilityLabel={`Resume ${c.title}, scene ${c.sceneName}, turn ${c.turnNumber}`}
              onPress={() => router.push({ pathname: "/campaign/[id]", params: { id: c.campaignId } })}
              style={({ pressed }) => [styles.card, styles.cardActive, pressed && styles.cardPressed]}
            >
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={styles.cardMeta}>{c.sceneName} · turn {c.turnNumber}</Text>
            </Pressable>
          ))
        )}
      </Section>

      <Section title="WORLDS">
        {worlds === null ? (
          <ActivityIndicator color={EQ.accent} />
        ) : worlds.length === 0 ? (
          <Text style={styles.empty}>No worlds yet.</Text>
        ) : (
          worlds.map((w) => (
            <Pressable
              key={w.worldId}
              accessibilityRole="button"
              accessibilityLabel={`Start a new ${w.title} campaign. ${w.kind} world.`}
              onPress={() => startWorld(w)}
              disabled={busyId !== null}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                busyId === w.worldId && styles.cardBusy,
              ]}
            >
              <Text style={styles.cardTitle}>{w.title}</Text>
              <Text style={styles.cardMeta}>
                {kindLabel(w.kind)}{busyId === w.worldId ? " · starting…" : ""}
              </Text>
            </Pressable>
          ))
        )}
      </Section>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">{error}</Text>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.section}>
      <Text role="heading" aria-level={2} style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function describeContents(worlds: WorldSummary[] | null, campaigns: CampaignSummary[] | null): string {
  if (worlds === null || campaigns === null) return "Loading your library.";
  const parts: string[] = [];
  if (campaigns.length === 0) parts.push("No saved campaigns.");
  else parts.push(`${campaigns.length} saved campaigns.`);
  if (worlds.length === 0) parts.push("No worlds.");
  else parts.push(`${worlds.length} worlds.`);
  return parts.join(" ");
}

function kindLabel(kind: WorldSummary["kind"]): string {
  switch (kind) {
    case "official": return "Official";
    case "uploaded": return "Uploaded";
    case "created":  return "You created";
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EQ.bg },
  container: { padding: SPACE[6], gap: SPACE[4] },
  h1: { fontSize: FS.hero, fontWeight: "700", color: EQ.text, letterSpacing: -0.5 },
  section: { gap: SPACE[3] },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: EQ.textFaint,
    letterSpacing: 1.2,
  },
  sectionBody: { gap: SPACE[2] },
  card: {
    minHeight: TOUCH_MIN + 16,
    borderRadius: R.xl,
    backgroundColor: EQ.surface2,
    borderWidth: 1,
    borderColor: EQ.border,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    justifyContent: "center",
  },
  cardActive: { borderColor: EQ.accent },
  cardTitle: { fontSize: FS.base, fontWeight: "700", color: EQ.text },
  cardMeta: { fontSize: FS.xs, color: EQ.textMuted, marginTop: 3 },
  cardPressed: { opacity: 0.7 },
  cardBusy: { opacity: 0.5 },
  empty: { color: EQ.textMuted, fontSize: FS.base },
  error: { color: EQ.danger, fontWeight: "600", marginTop: SPACE[2] },
});
