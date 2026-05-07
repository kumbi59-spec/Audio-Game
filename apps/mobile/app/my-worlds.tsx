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
  listWorlds,
  getWorldsAnalytics,
  type WorldSummary,
  type WorldAnalyticsSummary,
} from "@/api/rest";
import { EQ, FS, R, SPACE, TOUCH_MIN } from "@/design/tokens";

interface WorldWithAnalytics extends WorldSummary {
  analytics: WorldAnalyticsSummary | null;
}

export default function MyWorldsScreen(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);
  const [worlds, setWorlds] = useState<WorldWithAnalytics[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const creatorWorldCount = worlds?.length ?? 0;
  const summary =
    worlds === null
      ? "Loading your worlds."
      : creatorWorldCount === 0
      ? "You have no created or uploaded worlds yet."
      : `${creatorWorldCount} world${creatorWorldCount === 1 ? "" : "s"} you created or uploaded.`;

  useLandmarkAnnounce("My Worlds", summary, headingRef);

  const refresh = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const all = await listWorlds();
      const mine = all.filter((w) => w.kind === "uploaded" || w.kind === "created");
      if (mine.length === 0) {
        setWorlds([]);
        return;
      }
      const analytics = await getWorldsAnalytics(mine.map((w) => w.worldId));
      const byId = new Map(analytics.map((a) => [a.worldId, a]));
      setWorlds(
        mine.map((w) => ({ ...w, analytics: byId.get(w.worldId) ?? null })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load worlds.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useVoiceCommands({ "refresh|reload": () => { void refresh(); } });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={EQ.accent} />
      }
    >
      <View style={styles.header}>
        <Text ref={headingRef} role="heading" aria-level={1} style={styles.h1}>
          My Worlds
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a new world"
          onPress={() => router.push("/create")}
          style={({ pressed }) => [styles.createBtn, pressed && styles.pressed]}
        >
          <Text style={styles.createBtnText}>+ Create</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>
        Worlds you have uploaded or created. Pull to refresh stats.
      </Text>

      {worlds === null ? (
        <ActivityIndicator color={EQ.accent} style={styles.spinner} />
      ) : worlds.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No worlds yet</Text>
          <Text style={styles.emptyBody}>
            Create your own world or upload a Game Bible to see your creator analytics here.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create your first world"
            onPress={() => router.push("/create")}
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
          >
            <Text style={styles.emptyBtnText}>Create Your First World</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {worlds.map((w) => (
            <WorldCard key={w.worldId} world={w} onPlay={() => router.push("/library")} />
          ))}
        </View>
      )}

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}

function WorldCard({
  world,
  onPlay,
}: {
  world: WorldWithAnalytics;
  onPlay: () => void;
}): JSX.Element {
  const { analytics } = world;
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="none"
      accessibilityLabel={[
        world.title,
        world.kind === "uploaded" ? "Uploaded world" : "Created world",
        analytics
          ? `${analytics.sessionCount} session${analytics.sessionCount === 1 ? "" : "s"}, ${analytics.totalTurns} turns played`
          : "",
      ]
        .filter(Boolean)
        .join(". ")}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{world.title}</Text>
        <Text style={styles.kindBadge}>{kindLabel(world.kind)}</Text>
      </View>

      {analytics && (analytics.sessionCount > 0 || analytics.totalTurns > 0) ? (
        <View
          style={styles.statsRow}
          accessible={false}
        >
          <StatBox label="Sessions" value={analytics.sessionCount} />
          <View style={styles.statDivider} />
          <StatBox label="Turns" value={analytics.totalTurns} />
        </View>
      ) : (
        <Text style={styles.noStats}>No sessions played yet.</Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play ${world.title}`}
        onPress={onPlay}
        style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
      >
        <Text style={styles.playBtnText}>Play in Library</Text>
      </Pressable>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function kindLabel(kind: WorldSummary["kind"]): string {
  switch (kind) {
    case "uploaded": return "Uploaded";
    case "created":  return "Wizard";
    default:         return kind;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EQ.bg },
  container: { padding: SPACE[6], gap: SPACE[4] },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { fontSize: FS.hero, fontWeight: "700", color: EQ.text, letterSpacing: -0.5 },
  subtitle: { fontSize: FS.sm, color: EQ.textMuted, marginTop: -SPACE[2] },
  createBtn: {
    backgroundColor: EQ.accent,
    borderRadius: R.lg,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    minHeight: TOUCH_MIN,
    justifyContent: "center",
  },
  createBtnText: { fontSize: FS.sm, fontWeight: "700", color: "#fff" },
  spinner: { marginTop: SPACE[10] },
  emptyState: { alignItems: "center", paddingVertical: SPACE[10], gap: SPACE[3] },
  emptyTitle: { fontSize: FS.lg, fontWeight: "700", color: EQ.text },
  emptyBody: { fontSize: FS.sm, color: EQ.textMuted, textAlign: "center", maxWidth: 280 },
  emptyBtn: {
    marginTop: SPACE[2],
    backgroundColor: EQ.accent,
    borderRadius: R.lg,
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[3],
    minHeight: TOUCH_MIN,
    justifyContent: "center",
  },
  emptyBtnText: { fontSize: FS.base, fontWeight: "700", color: "#fff" },
  list: { gap: SPACE[3] },
  card: {
    borderRadius: R["2xl"],
    backgroundColor: EQ.surface2,
    borderWidth: 1,
    borderColor: EQ.border,
    padding: SPACE[4],
    gap: SPACE[3],
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE[2] },
  cardTitle: { fontSize: FS.base, fontWeight: "700", color: EQ.text, flex: 1 },
  kindBadge: {
    fontSize: FS.xs,
    fontWeight: "600",
    color: EQ.textFaint,
    backgroundColor: EQ.surface,
    borderRadius: R.sm,
    paddingHorizontal: SPACE[2],
    paddingVertical: 3,
    overflow: "hidden",
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: R.lg,
    backgroundColor: EQ.surface,
    borderWidth: 1,
    borderColor: EQ.border,
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: SPACE[3] },
  statValue: { fontSize: FS.xl, fontWeight: "700", color: EQ.text },
  statLabel: { fontSize: FS.xs, color: EQ.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: EQ.border },
  noStats: { fontSize: FS.sm, color: EQ.textFaint, textAlign: "center" },
  playBtn: {
    borderWidth: 1,
    borderColor: EQ.accent,
    borderRadius: R.lg,
    paddingVertical: SPACE[3],
    minHeight: TOUCH_MIN,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnText: { fontSize: FS.sm, fontWeight: "700", color: EQ.accent },
  error: { color: EQ.danger, fontWeight: "600", marginTop: SPACE[2] },
  pressed: { opacity: 0.7 },
});
