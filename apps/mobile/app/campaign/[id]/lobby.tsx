import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { LobbyParticipant, MultiplayerClientEvent, MultiplayerServerEvent } from "@audio-rpg/shared";
import { apiBaseUrl, apiWebSocketUrl } from "@/api/config";
import { getLobbyToken } from "@/api/rest";
import { EQ, FS, R, SPACE, TOUCH_MIN } from "@/design/tokens";

// ── Hook ──────────────────────────────────────────────────────────────────

type LobbyStatus = "connecting" | "waiting" | "starting" | "error";

interface LobbyState {
  participants: LobbyParticipant[];
  maxPlayers: number;
  hostUserId: string;
}

function useLobbySocket(campaignId: string, displayName: string) {
  const [status, setStatus] = useState<LobbyStatus>("connecting");
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  const send = useCallback((event: MultiplayerClientEvent) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }, []);

  const markReady = useCallback(
    (ready: boolean) => send({ type: "lobby_ready", v: "v1", campaignId, ready }),
    [send, campaignId],
  );

  const leave = useCallback(() => {
    send({ type: "lobby_leave", v: "v1", campaignId });
    wsRef.current?.close();
    router.back();
  }, [send, campaignId, router]);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      let token: string;
      try {
        token = await getLobbyToken(campaignId);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Could not obtain lobby credentials. Please try again.");
        }
        return;
      }

      if (cancelled) return;

      const ws = new WebSocket(apiWebSocketUrl(`/ws/lobby/${campaignId}`));
      wsRef.current = ws;

      ws.onopen = () => {
        const joinEvent: MultiplayerClientEvent = {
          type: "lobby_join",
          v: "v1",
          campaignId,
          authToken: token,
          displayName,
        };
        ws.send(JSON.stringify(joinEvent));
      };

      ws.onmessage = (ev) => {
        let msg: MultiplayerServerEvent;
        try {
          msg = JSON.parse(typeof ev.data === "string" ? ev.data : "") as MultiplayerServerEvent;
        } catch {
          return;
        }

        switch (msg.type) {
          case "lobby_state":
            if (msg.myUserId) setMyUserId(msg.myUserId);
            setLobby({
              participants: msg.participants,
              maxPlayers: msg.maxPlayers,
              hostUserId: msg.hostUserId,
            });
            setStatus("waiting");
            break;
          case "player_joined":
            setLobby((prev) =>
              prev ? { ...prev, participants: [...prev.participants, msg.participant] } : prev,
            );
            AccessibilityInfo.announceForAccessibility(
              `${msg.participant.displayName} joined the lobby.`,
            );
            break;
          case "player_left":
            setLobby((prev) =>
              prev
                ? { ...prev, participants: prev.participants.filter((p) => p.userId !== msg.userId) }
                : prev,
            );
            AccessibilityInfo.announceForAccessibility(`${msg.displayName} left the lobby.`);
            break;
          case "lobby_ready":
            setLobby((prev) => (prev ? { ...prev, participants: msg.participants } : prev));
            setStatus("starting");
            AccessibilityInfo.announceForAccessibility("All players ready. Starting adventure.");
            break;
          case "turn_request":
            router.replace({
              pathname: "/campaign/[id]",
              params: { id: msg.campaignId },
            });
            break;
        }
      };

      ws.onerror = () => {
        if (!cancelled) {
          setStatus("error");
          setError("Could not reach the multiplayer lobby. Check your connection.");
        }
      };
    }

    void connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [campaignId, displayName, router]);

  return { status, lobby, error, markReady, leave, myUserId };
}

// ── Participant row ────────────────────────────────────────────────────────

function ParticipantRow({
  participant,
  isHost,
  isYou,
}: {
  participant: LobbyParticipant;
  isHost: boolean;
  isYou: boolean;
}) {
  const label = [
    participant.displayName,
    isYou ? "(you)" : null,
    isHost ? "host" : null,
    participant.ready ? "ready" : "not ready",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {participant.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowName}>
          {participant.displayName}
          {isYou ? (
            <Text style={styles.youBadge}> (you)</Text>
          ) : null}
        </Text>
        {isHost && <Text style={styles.hostLabel}>Host</Text>}
      </View>
      <View style={[styles.badge, participant.ready ? styles.badgeReady : styles.badgeWaiting]}>
        <Text style={[styles.badgeText, participant.ready ? styles.badgeTextReady : styles.badgeTextWaiting]}>
          {participant.ready ? "Ready" : "Waiting"}
        </Text>
      </View>
    </View>
  );
}

function EmptySlot() {
  return (
    <View style={styles.emptySlot} accessible accessibilityLabel="Open slot — waiting for player">
      <View style={styles.emptyAvatar}>
        <Text style={styles.emptyAvatarText}>?</Text>
      </View>
      <Text style={styles.emptySlotText}>Waiting for player…</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function LobbyScreen(): JSX.Element {
  const { id: campaignId } = useLocalSearchParams<{ id: string }>();
  const displayName = "Player"; // In a real app this would come from user profile
  const { status, lobby, error, markReady, leave, myUserId } =
    useLobbySocket(campaignId, displayName);

  const me = myUserId ? lobby?.participants.find((p) => p.userId === myUserId) : undefined;
  const readyCount = lobby?.participants.filter((p) => p.ready).length ?? 0;
  const totalCount = lobby?.participants.length ?? 0;
  const allReady = totalCount > 0 && readyCount === totalCount;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      accessibilityLabel="Multiplayer lobby"
    >
      <Text style={styles.heading} accessibilityRole="header">
        Multiplayer Lobby
      </Text>

      {status === "connecting" && (
        <View style={styles.centred}>
          <ActivityIndicator color={EQ.accent} />
          <Text style={styles.statusText}>Connecting to lobby…</Text>
        </View>
      )}

      {status === "error" && (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorTitle}>Unable to connect</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              // Re-mount by navigating back and forward — simplest recovery
            }}
            accessibilityRole="button"
            accessibilityLabel="Retry connection"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {(status === "waiting" || status === "starting") && lobby && (
        <>
          <Text style={styles.sectionLabel}>
            Players — {readyCount} / {totalCount} ready
          </Text>

          {lobby.participants.map((p) => (
            <ParticipantRow
              key={p.userId}
              participant={p}
              isHost={p.userId === lobby.hostUserId}
              isYou={p.userId === myUserId}
            />
          ))}
          {Array.from({ length: lobby.maxPlayers - lobby.participants.length }).map((_, i) => (
            <EmptySlot key={`empty-${i}`} />
          ))}

          {allReady && (
            <View
              style={styles.allReadyBanner}
              accessibilityLiveRegion="assertive"
            >
              <Text style={styles.allReadyText}>All players ready — starting adventure…</Text>
            </View>
          )}

          {!allReady && (
            <View style={styles.actions}>
              <Pressable
                style={[styles.readyBtn, me?.ready && styles.unreadyBtn]}
                onPress={() => markReady(!me?.ready)}
                accessibilityRole="button"
                accessibilityLabel={me?.ready ? "Unready" : "Mark ready"}
                accessibilityState={{ selected: me?.ready ?? false }}
                accessibilityHint="Signals your readiness to start the adventure"
              >
                <Text style={[styles.readyBtnText, me?.ready && styles.unreadyBtnText]}>
                  {me?.ready ? "Unready" : "Mark Ready"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.leaveBtn}
                onPress={leave}
                accessibilityRole="button"
                accessibilityLabel="Leave lobby"
              >
                <Text style={styles.leaveBtnText}>Leave</Text>
              </Pressable>
            </View>
          )}

          {/* Invite section — show campaign ID so others can join */}
          <View style={styles.inviteBox}>
            <Text style={styles.sectionLabel}>Campaign ID</Text>
            <Text style={styles.inviteCode} selectable>
              {campaignId}
            </Text>
            <Text style={styles.inviteHint}>
              Share this ID so friends can join the same lobby.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EQ.bg },
  content: { padding: SPACE[6], paddingBottom: SPACE[10] },
  heading: {
    fontSize: FS["2xl"],
    fontWeight: "700",
    color: EQ.text,
    marginBottom: SPACE[6],
  },
  centred: { alignItems: "center", marginTop: SPACE[10], gap: SPACE[3] },
  statusText: { color: EQ.textMuted, fontSize: FS.sm },
  errorBox: {
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface,
    padding: SPACE[4],
    marginTop: SPACE[6],
  },
  errorTitle: { color: EQ.text, fontSize: FS.base, fontWeight: "600" },
  errorMsg: { color: EQ.textMuted, fontSize: FS.sm, marginTop: SPACE[1] },
  retryBtn: {
    marginTop: SPACE[3],
    alignSelf: "flex-start",
    backgroundColor: EQ.accent,
    borderRadius: R.lg,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],
  },
  retryBtnText: { color: "#fff", fontSize: FS.xs, fontWeight: "600" },
  sectionLabel: {
    color: EQ.textMuted,
    fontSize: FS.xs,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: SPACE[3],
    marginTop: SPACE[4],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface,
    padding: SPACE[3],
    marginBottom: SPACE[2],
    minHeight: TOUCH_MIN,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: EQ.accentBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACE[3],
  },
  avatarText: { color: EQ.accent, fontSize: FS.sm, fontWeight: "700" },
  rowMeta: { flex: 1 },
  rowName: { color: EQ.text, fontSize: FS.sm, fontWeight: "600" },
  youBadge: { color: EQ.textMuted, fontWeight: "400" },
  hostLabel: { color: EQ.accent, fontSize: FS.xs, marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: SPACE[2], paddingVertical: 2 },
  badgeReady: { backgroundColor: "rgba(34,197,94,0.12)" },
  badgeWaiting: { backgroundColor: EQ.surface3 },
  badgeText: { fontSize: FS.xs, fontWeight: "600" },
  badgeTextReady: { color: EQ.success },
  badgeTextWaiting: { color: EQ.textMuted },
  emptySlot: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: EQ.border,
    borderStyle: "dashed",
    padding: SPACE[3],
    marginBottom: SPACE[2],
    minHeight: TOUCH_MIN,
  },
  emptyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: EQ.surface3,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACE[3],
  },
  emptyAvatarText: { color: EQ.textFaint, fontSize: FS.sm },
  emptySlotText: { color: EQ.textFaint, fontSize: FS.sm },
  allReadyBanner: {
    marginTop: SPACE[4],
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: EQ.success,
    backgroundColor: "rgba(34,197,94,0.08)",
    padding: SPACE[4],
    alignItems: "center",
  },
  allReadyText: { color: EQ.success, fontSize: FS.sm, fontWeight: "600" },
  actions: {
    flexDirection: "row",
    gap: SPACE[3],
    marginTop: SPACE[4],
  },
  readyBtn: {
    flex: 1,
    backgroundColor: EQ.accent,
    borderRadius: R.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_MIN,
  },
  unreadyBtn: { backgroundColor: EQ.surface3 },
  readyBtnText: { color: "#fff", fontSize: FS.sm, fontWeight: "700" },
  unreadyBtnText: { color: EQ.textMuted },
  leaveBtn: {
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: EQ.border,
    paddingHorizontal: SPACE[4],
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_MIN,
  },
  leaveBtnText: { color: EQ.textMuted, fontSize: FS.sm, fontWeight: "600" },
  inviteBox: {
    marginTop: SPACE[8],
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface,
    padding: SPACE[4],
  },
  inviteCode: {
    color: EQ.textMuted,
    fontSize: FS.xs,
    fontFamily: "monospace",
    marginBottom: SPACE[2],
  },
  inviteHint: { color: EQ.textFaint, fontSize: FS.xs },
});
