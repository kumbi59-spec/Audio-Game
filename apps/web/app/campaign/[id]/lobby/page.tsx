"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

function useLobbySocket(campaignId: string) {
  const { data: authSession } = useSession();
  const [status, setStatus] = useState<LobbyStatus>("connecting");
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
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

    const apiBase = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
    const wsUrl = apiBase.replace(/^http/, "ws") + `/ws/lobby/${campaignId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const token = (authSession as { accessToken?: string }).accessToken ?? "";
      const joinEvent: MultiplayerClientEvent = {
        type: "lobby_join",
        v: "v1",
        campaignId,
        authToken: token,
        displayName: authSession.user?.name ?? "Player",
      };
      ws.send(JSON.stringify(joinEvent));
    };

    ws.onmessage = (ev) => {
      let msg: MultiplayerServerEvent;
      try {
        msg = JSON.parse(ev.data as string) as MultiplayerServerEvent;
      } catch {
        return;
      }

      switch (msg.type) {
        case "lobby_state":
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
      setStatus("error");
      setError("Connection failed. The multiplayer lobby is not yet available in this region.");
    };

    ws.onclose = () => {
      if (status !== "starting" && status !== "error") {
        setStatus("connecting");
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, authSession]);

  return { status, lobby, error, markReady, leave, currentUserId: authSession?.user?.email ?? "" };
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
      className="flex items-center justify-between rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
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
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {participant.displayName}
            {isYou && (
              <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                (you)
              </span>
            )}
          </p>
          {isHost && (
            <p className="text-xs" style={{ color: "var(--accent)" }}>
              Host
            </p>
          )}
        </div>
      </div>
      <span
        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{
          backgroundColor: participant.ready
            ? "rgba(34, 197, 94, 0.12)"
            : "var(--surface3)",
          color: participant.ready ? "#22c55e" : "var(--text-muted)",
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
  const { status, lobby, error, markReady, leave, currentUserId } =
    useLobbySocket(campaignId);

  const me = lobby?.participants.find((p) => p.userId === currentUserId);
  const readyCount = lobby?.participants.filter((p) => p.ready).length ?? 0;
  const totalCount = lobby?.participants.length ?? 0;
  const allReady = totalCount > 0 && readyCount === totalCount;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }} tabIndex={-1}>
          Multiplayer Lobby
        </h1>

        {/* Coming-soon notice */}
        <div
          className="mt-4 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-muted)" }}
          role="note"
        >
          Multiplayer is coming soon. This lobby screen is a preview of the experience.
        </div>

        {/* Status */}
        {status === "connecting" && (
          <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }} role="status">
            Connecting to lobby…
          </p>
        )}

        {status === "error" && (
          <div
            className="mt-6 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            role="alert"
          >
            <p className="font-semibold">Unable to connect</p>
            <p className="mt-1" style={{ color: "var(--text-muted)" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              Retry
            </button>
          </div>
        )}

        {(status === "waiting" || status === "starting") && lobby && (
          <>
            {/* Participants */}
            <section className="mt-6" aria-label="Lobby participants">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Players — {readyCount} / {totalCount} ready
              </h2>
              <ul className="space-y-2" aria-live="polite" aria-atomic="false">
                {lobby.participants.map((p) => (
                  <ParticipantRow
                    key={p.userId}
                    participant={p}
                    isHost={p.userId === lobby.hostUserId}
                    isYou={p.userId === currentUserId}
                  />
                ))}
                {/* Empty slots */}
                {Array.from({ length: lobby.maxPlayers - lobby.participants.length }).map(
                  (_, i) => (
                    <li
                      key={`empty-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-dashed px-4 py-3"
                      style={{ borderColor: "var(--border)" }}
                      aria-label="Open slot"
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm"
                        style={{ backgroundColor: "var(--surface3)", color: "var(--text-faint)" }}
                        aria-hidden="true"
                      >
                        ?
                      </span>
                      <p className="text-sm" style={{ color: "var(--text-faint)" }}>
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
                style={{ borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.08)", color: "#22c55e" }}
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
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: me?.ready ? "var(--surface3)" : "var(--accent)",
                    color: me?.ready ? "var(--text-muted)" : "#fff",
                  }}
                  aria-pressed={me?.ready ?? false}
                >
                  {me?.ready ? "Unready" : "Mark Ready"}
                </button>
                <button
                  onClick={leave}
                  className="rounded-xl border px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  Leave
                </button>
              </div>
            )}

            {/* Invite link */}
            <section className="mt-8" aria-label="Invite friends">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Invite link
              </h2>
              <div
                className="flex items-center gap-2 rounded-xl border px-4 py-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <code className="flex-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                  {typeof window !== "undefined" ? window.location.href : ""}
                </code>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      void navigator.clipboard.writeText(window.location.href);
                    }
                  }}
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
