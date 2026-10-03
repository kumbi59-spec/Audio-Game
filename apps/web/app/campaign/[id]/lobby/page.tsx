"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";
import type {
  LobbyParticipant,
  MultiplayerServerEvent,
  MultiplayerClientEvent,
} from "@audio-rpg/shared";

// ── Local types ────────────────────────────────────────────────────────────

type LobbyStatus = "connecting" | "waiting" | "starting" | "error";

interface LobbyState {
  participants: LobbyParticipant[];
  maxPlayers: number;
  hostUserId: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────

const LOBBY_ACCESS_ERRORS: Record<string, string> = {
  not_invited: "You need an invite link from the host to join this lobby.",
  lobby_not_found: "This lobby doesn't exist or has expired. Ask the host for a new invite link.",
  lobby_full: "This lobby is full.",
};

function useLobbySocket(campaignId: string, invite: string | null) {
  const { data: authSession } = useSession();
  const [status, setStatus] = useState<LobbyStatus>("connecting");
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  const send = useCallback((event: MultiplayerClientEvent) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }, []);

  const markReady = useCallback(
    (ready: boolean) => {
      send({ type: "lobby_ready", v: "v1", campaignId, ready });
    },
    [send, campaignId],
  );

  const leave = useCallback(() => {
    send({ type: "lobby_leave", v: "v1", campaignId });
    wsRef.current?.close();
    router.push("/library");
  }, [send, campaignId, router]);

  useEffect(() => {
    if (!authSession?.user) return;

    let cancelled = false;

    async function connect() {
      // Fetch an HMAC-signed session token from the web API proxy (requires auth).
      let token: string;
      try {
        const res = await fetch(
          `/api/game/lobby-token?campaignId=${encodeURIComponent(campaignId)}` +
            (invite ? `&invite=${encodeURIComponent(invite)}` : ""),
        );
        if (!res.ok) {
          // Surface the server's reason (e.g. SESSION_SIGNING_KEY unset → 503)
          // so a misconfiguration is debuggable from the UI alone.
          let reason = `${res.status}`;
          try {
            const body = (await res.json()) as { error?: string };
            if (body.error) reason = LOBBY_ACCESS_ERRORS[body.error] ?? body.error;
          } catch {
            // body wasn't JSON; keep the status code
          }
          throw new Error(reason);
        }
        const data = (await res.json()) as { token: string; inviteCode?: string };
        token = data.token;
        if (!cancelled && data.inviteCode) setInviteCode(data.inviteCode);
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          const detail = err instanceof Error ? err.message : "unknown error";
          setError(`Could not obtain lobby credentials: ${detail}`);
        }
        return;
      }

      if (cancelled) return;

      const configuredBase = process.env["NEXT_PUBLIC_API_URL"];
      const onLocalhost =
        typeof window !== "undefined" &&
        /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
      // In a deployed (non-localhost) browser, refusing to fall back to
      // localhost is what turns "Could not reach the multiplayer lobby" from
      // a mystery into an actionable config error.
      if (!configuredBase && !onLocalhost) {
        setStatus("error");
        setError(
          "Multiplayer is not configured for this deployment (NEXT_PUBLIC_API_URL is unset).",
        );
        return;
      }
      const apiBase = configuredBase ?? "http://localhost:4000";
      const wsUrl = apiBase.replace(/^http/, "ws") + `/ws/lobby/${campaignId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        const joinEvent: MultiplayerClientEvent = {
          type: "lobby_join",
          v: "v1",
          campaignId,
          authToken: token,
          displayName: authSession!.user?.name ?? "Player",
        };
        ws.send(JSON.stringify(joinEvent));
      };

      ws.onmessage = (ev) => {
        let raw: { type: string; message?: string };
        try {
          raw = JSON.parse(ev.data as string) as { type: string; message?: string };
        } catch {
          return;
        }

        if (raw.type === "error") {
          if (!cancelled) {
            setStatus("error");
            setError(raw.message ?? "An error occurred. Please try again.");
          }
          return;
        }

        const msg = raw as unknown as MultiplayerServerEvent;
        switch (msg.type) {
          case "lobby_state":
            // The server echoes myUserId only in the first lobby_state after joining.
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
              prev
                ? { ...prev, participants: [...prev.participants, msg.participant] }
                : prev,
            );
            break;
          case "player_left":
            setLobby((prev) =>
              prev
                ? {
                    ...prev,
                    participants: prev.participants.filter((p) => p.userId !== msg.userId),
                  }
                : prev,
            );
            break;
          case "lobby_ready":
            setLobby((prev) =>
              prev ? { ...prev, participants: msg.participants } : prev,
            );
            setStatus("starting");
            break;
          case "turn_request":
            router.push(`/play?campaign=${encodeURIComponent(msg.campaignId)}`);
            break;
        }
      };

      ws.onerror = () => {
        if (!cancelled) {
          setStatus("error");
          setError(
            `Could not reach the multiplayer lobby at ${wsUrl}. Check your connection and try again.`,
          );
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setStatus((curr) => (curr === "starting" || curr === "error" ? curr : "connecting"));
        }
      };
    }

    void connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, invite, authSession]);

  return { status, lobby, error, markReady, leave, myUserId, inviteCode };
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
  return (
    <li
      className="flex items-center justify-between rounded-xl border px-4 py-3 border-border bg-surface"
      aria-label={`${participant.displayName}${isYou ? " (you)" : ""}${isHost ? ", host" : ""} — ${participant.ready ? "ready" : "not ready"}`}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: "var(--accentBg, rgba(99,102,241,0.12))", color: "var(--accent)" }}
          aria-hidden="true"
        >
          {participant.displayName.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {participant.displayName}
            {isYou && (
              <span className="ml-2 text-xs font-normal text-muted">
                (you)
              </span>
            )}
          </p>
          {isHost && (
            <p className="text-xs text-accent">
              Host
            </p>
          )}
        </div>
      </div>
      <span
        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{
          backgroundColor: participant.ready
            ? "color-mix(in srgb, var(--success) 12%, transparent)"
            : "var(--surface-3)",
          color: participant.ready ? "var(--success)" : "var(--text-muted)",
        }}
        aria-hidden="true"
      >
        {participant.ready ? "Ready" : "Waiting…"}
      </span>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function LobbyPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const invite = useSearchParams().get("invite");
  const { status, lobby, error, markReady, leave, myUserId, inviteCode } =
    useLobbySocket(campaignId, invite);
  // The invite link carries the lobby's secret invite code; without it,
  // other players can't join.
  const inviteUrl =
    inviteCode && typeof window !== "undefined"
      ? `${window.location.origin}/campaign/${encodeURIComponent(campaignId)}/lobby?invite=${encodeURIComponent(inviteCode)}`
      : "";

  const me = myUserId ? lobby?.participants.find((p) => p.userId === myUserId) : undefined;
  const readyCount = lobby?.participants.filter((p) => p.ready).length ?? 0;
  const totalCount = lobby?.participants.length ?? 0;
  const allReady = totalCount > 0 && readyCount === totalCount;

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground" tabIndex={-1}>
          Multiplayer Lobby
        </h1>

        {/* Status */}
        {status === "connecting" && (
          <p className="mt-6 text-sm text-muted" role="status">
            Connecting to lobby…
          </p>
        )}

        {status === "error" && (
          <div
            className="mt-6 rounded-xl border px-4 py-3 text-sm border-border bg-surface text-foreground"
            role="alert"
          >
            <p className="font-semibold">Unable to connect</p>
            <p className="mt-1 text-muted">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold bg-accent-solid text-on-accent"
            >
              Retry
            </button>
          </div>
        )}

        {(status === "waiting" || status === "starting") && lobby && (
          <>
            {/* Participants */}
            <section className="mt-6" aria-label="Lobby participants">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                Players — {readyCount} / {totalCount} ready
              </h2>
              <ul className="space-y-2" aria-live="polite" aria-atomic="false">
                {lobby.participants.map((p) => (
                  <ParticipantRow
                    key={p.userId}
                    participant={p}
                    isHost={p.userId === lobby.hostUserId}
                    isYou={p.userId === myUserId}
                  />
                ))}
                {/* Empty slots */}
                {Array.from({ length: lobby.maxPlayers - lobby.participants.length }).map(
                  (_, i) => (
                    <li
                      key={`empty-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 border-border"
                      aria-label="Open slot"
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm bg-surface-3 text-subtle"
                        aria-hidden="true"
                      >
                        ?
                      </span>
                      <p className="text-sm text-subtle">
                        Waiting for player…
                      </p>
                    </li>
                  ),
                )}
              </ul>
            </section>

            {/* All ready banner */}
            {allReady && (
              <div
                className="mt-6 rounded-xl border px-4 py-3 text-center text-sm font-semibold"
                style={{ borderColor: "var(--success)", backgroundColor: "color-mix(in srgb, var(--success) 8%, transparent)", color: "var(--success)" }}
                role="status"
                aria-live="assertive"
              >
                All players ready — starting adventure…
              </div>
            )}

            {/* Actions */}
            {!allReady && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => markReady(!me?.ready)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{
                    backgroundColor: me?.ready ? "var(--surface3)" : "var(--accent-solid)",
                    color: me?.ready ? "var(--text-muted)" : "var(--on-accent)",
                  }}
                  aria-pressed={me?.ready ?? false}
                >
                  {me?.ready ? "Unready" : "Mark Ready"}
                </button>
                <button
                  onClick={leave}
                  className="rounded-xl border px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring border-border text-muted"
                >
                  Leave
                </button>
              </div>
            )}

            {/* Invite link */}
            <section className="mt-8" aria-label="Invite friends">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">
                Invite link
              </h2>
              <div
                className="flex items-center gap-2 rounded-xl border px-4 py-3 border-border bg-surface"
              >
                <code className="flex-1 truncate text-xs text-muted">
                  {inviteUrl || "Loading invite link…"}
                </code>
                <button
                  onClick={() => {
                    if (inviteUrl) void navigator.clipboard.writeText(inviteUrl);
                  }}
                  disabled={!inviteUrl}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: "var(--accentBg, rgba(99,102,241,0.12))", color: "var(--accent)" }}
                  aria-label="Copy invite link to clipboard"
                >
                  Copy
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
