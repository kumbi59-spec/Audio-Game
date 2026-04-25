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

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
        router.push({
          pathname: "/campaign/[id]",
          params: { id: result.campaignId },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start campaign.");
      } finally {
        setBusyId(null);
      }
    },
    [router],
  );

  useVoiceCommands({
    "refresh|reload": () => {
      void refresh();
    },
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <Text
        ref={headingRef}
        accessibilityRole="header"
        aria-level={1}
        style={styles.h1}
      >
        Library
      </Text>

      <Section title="Continue an adventure">
        {campaigns === null ? (
          <ActivityIndicator />
        ) : campaigns.length === 0 ? (
          <Text style={styles.empty}>
            No campaigns yet. Start one from a world below.
          </Text>
        ) : (
          campaigns.map((c) => (
            <Pressable
              key={c.campaignId}
              accessibilityRole="button"
              accessibilityLabel={`Resume ${c.title}, scene ${c.sceneName}, turn ${c.turnNumber}`}
              onPress={() =>
                router.push({
                  pathname: "/campaign/[id]",
                  params: { id: c.campaignId },
                })
              }
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.rowTitle}>{c.title}</Text>
              <Text style={styles.rowMeta}>
                {c.sceneName} · turn {c.turnNumber}
              </Text>
            </Pressable>
          ))
        )}
      </Section>

      <Section title="Worlds">
        {worlds === null ? (
          <ActivityIndicator />
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
                styles.row,
                pressed && styles.rowPressed,
                busyId === w.worldId && styles.rowBusy,
              ]}
            >
              <Text style={styles.rowTitle}>{w.title}</Text>
              <Text style={styles.rowMeta}>
                {kindLabel(w.kind)}
                {busyId === w.worldId ? " · starting…" : ""}
              </Text>
            </Pressable>
          ))
        )}
      </Section>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" aria-level={2} style={styles.h2}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function describeContents(
  worlds: WorldSummary[] | null,
  campaigns: CampaignSummary[] | null,
): string {
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
    case "official":
      return "official";
    case "uploaded":
      return "uploaded";
    case "created":
      return "you created";
  }
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  h1: { fontSize: 32, fontWeight: "800" },
  h2: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  section: { marginTop: 8 },
  sectionBody: { gap: 8 },
  row: {
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  rowTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  rowMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  rowPressed: { opacity: 0.7 },
  rowBusy: { opacity: 0.5 },
  empty: { color: "#6b7280", fontSize: 16 },
  error: { color: "#b91c1c", fontWeight: "600", marginTop: 12 },
});
