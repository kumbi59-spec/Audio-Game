import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { MultiplayerClientEvent, type LobbyParticipant, type MultiplayerServerEvent } from "@audio-rpg/shared";
import { verifyLobbyToken } from "../state/tokens.js";

export interface LobbyRouteOptions {
  /** Milliseconds between lobby_ready broadcast and the turn_request that triggers game start. Default 2000. */
  startDelayMs?: number;
}

interface LobbyConnection {
  socket: { send(data: string): void; close(): void };
  participant: LobbyParticipant;
}

interface LobbyRoom {
  connections: Map<string, LobbyConnection>;
  hostUserId: string;
  maxPlayers: number;
  /** Pending game-start countdown; cleared when anyone un-readies or leaves. */
  startTimer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, LobbyRoom>();

/** Exposed for test teardown only. */
export function clearRooms(): void {
  for (const room of rooms.values()) cancelStart(room);
  rooms.clear();
}

function broadcast(room: LobbyRoom, event: MultiplayerServerEvent): void {
  const msg = JSON.stringify(event);
  for (const { socket } of room.connections.values()) {
    try {
      socket.send(msg);
    } catch {
      // Socket already closed — ignore
    }
  }
}

function participantList(room: LobbyRoom): LobbyParticipant[] {
  return Array.from(room.connections.values()).map((c) => c.participant);
}

function lobbyState(campaignId: string, room: LobbyRoom): MultiplayerServerEvent {
  return {
    type: "lobby_state",
    v: "v1",
    campaignId,
    participants: participantList(room),
    maxPlayers: room.maxPlayers,
    hostUserId: room.hostUserId,
  };
}

function allReady(room: LobbyRoom): boolean {
  const participants = participantList(room);
  return participants.length >= 2 && participants.every((p) => p.ready);
}

function cancelStart(room: LobbyRoom): void {
  if (room.startTimer) {
    clearTimeout(room.startTimer);
    room.startTimer = null;
  }
}

/**
 * Starts the countdown to turn_request once at least two players are all
 * ready. At most one countdown runs per room.
 */
function maybeStart(campaignId: string, room: LobbyRoom, startDelayMs: number): void {
  if (room.startTimer || !allReady(room)) return;

  broadcast(room, {
    type: "lobby_ready",
    v: "v1",
    campaignId,
    participants: participantList(room),
  });

  const turnId = randomUUID();
  room.startTimer = setTimeout(() => {
    room.startTimer = null;
    if (rooms.get(campaignId) !== room || !allReady(room)) return;
    const hostConn = room.connections.get(room.hostUserId);
    broadcast(room, {
      type: "turn_request",
      v: "v1",
      campaignId,
      requestingUserId: room.hostUserId,
      requestingDisplayName: hostConn?.participant.displayName ?? "Host",
      turnId,
    });
    rooms.delete(campaignId);
  }, startDelayMs);
}

function handleLeave(
  campaignId: string,
  userId: string,
  app: FastifyInstance,
  startDelayMs: number,
): void {
  const room = rooms.get(campaignId);
  if (!room) return;
  const conn = room.connections.get(userId);
  if (!conn) return;

  room.connections.delete(userId);
  // The roster changed, so any countdown restarts from the new roster.
  cancelStart(room);

  if (room.connections.size === 0) {
    rooms.delete(campaignId);
    return;
  }

  const hostChanged = room.hostUserId === userId;
  if (hostChanged) {
    room.hostUserId = room.connections.keys().next().value as string;
  }

  broadcast(room, {
    type: "player_left",
    v: "v1",
    campaignId,
    userId,
    displayName: conn.participant.displayName,
  });
  // player_left carries no host, so clients learn the new one from here.
  if (hostChanged) broadcast(room, lobbyState(campaignId, room));

  app.log.info({ campaignId, userId }, "lobby participant left");

  // The player who left may have been the only one not ready.
  maybeStart(campaignId, room, startDelayMs);
}

export async function registerLobbyRoutes(
  app: FastifyInstance,
  options: LobbyRouteOptions = {},
): Promise<void> {
  const startDelayMs = options.startDelayMs ?? 2000;

  app.get<{ Params: { campaignId: string } }>(
    "/ws/lobby/:campaignId",
    { websocket: true },
    async (socket, req) => {
      const { campaignId } = req.params;
      let userId: string | null = null;

      socket.on("message", (raw: Buffer) => {
        let msg: unknown;
        try {
          msg = JSON.parse(raw.toString("utf8"));
        } catch {
          socket.send(
            JSON.stringify({
              type: "error",
              v: "v1",
              code: "bad_json",
              message: "Message was not valid JSON.",
              recoverable: true,
            }),
          );
          return;
        }

        const parsed = MultiplayerClientEvent.safeParse(msg);
        if (!parsed.success) {
          socket.send(
            JSON.stringify({
              type: "error",
              v: "v1",
              code: "bad_event",
              message: "Invalid multiplayer event.",
              recoverable: true,
            }),
          );
          return;
        }

        const event = parsed.data;

        if (event.campaignId !== campaignId) {
          socket.send(
            JSON.stringify({
              type: "error",
              v: "v1",
              code: "campaign_mismatch",
              message: "Event campaignId does not match lobby route.",
              recoverable: false,
            }),
          );
          return;
        }

        if (event.type === "lobby_join") {
          if (userId) {
            // A second join would add a ghost participant that never leaves.
            socket.send(
              JSON.stringify({
                type: "error",
                v: "v1",
                code: "already_joined",
                message: "This connection has already joined the lobby.",
                recoverable: true,
              }),
            );
            return;
          }
          const claims = verifyLobbyToken(event.authToken, campaignId);
          if (!claims) {
            socket.send(
              JSON.stringify({
                type: "error",
                v: "v1",
                code: "auth_failed",
                message: "Invalid auth token.",
                recoverable: false,
              }),
            );
            socket.close();
            return;
          }

          // Assign a stable UUID for this connection. Using a random UUID rather
          // than the token nonce means the client can receive it via myUserId in
          // lobby_state and use it to identify itself in the participant list.
          userId = randomUUID();
          app.log.info({ campaignId, userId, subject: claims.subject }, "lobby join authorized");

          let room = rooms.get(campaignId);
          if (!room) {
            room = { connections: new Map(), hostUserId: userId, maxPlayers: 4, startTimer: null };
            rooms.set(campaignId, room);
          }

          if (room.connections.size >= room.maxPlayers) {
            socket.send(
              JSON.stringify({
                type: "error",
                v: "v1",
                code: "lobby_full",
                message: "This lobby is full.",
                recoverable: false,
              }),
            );
            socket.close();
            return;
          }

          const participant: LobbyParticipant = {
            userId,
            displayName: event.displayName,
            ready: false,
            joinedAt: new Date().toISOString(),
          };
          room.connections.set(userId, { socket, participant });
          // A new player isn't ready yet, so a running countdown stops.
          cancelStart(room);

          // Send full state to the new joiner, including their own userId so the
          // client can identify itself in the participant list without guessing.
          socket.send(
            JSON.stringify({
              type: "lobby_state",
              v: "v1",
              campaignId,
              participants: participantList(room),
              maxPlayers: room.maxPlayers,
              hostUserId: room.hostUserId,
              myUserId: userId,
            } satisfies MultiplayerServerEvent),
          );

          // Notify already-connected participants
          for (const [uid, conn] of room.connections) {
            if (uid !== userId) {
              try {
                conn.socket.send(
                  JSON.stringify({
                    type: "player_joined",
                    v: "v1",
                    campaignId,
                    participant,
                  } satisfies MultiplayerServerEvent),
                );
              } catch {
                // Ignore already-closed connections
              }
            }
          }

          app.log.info(
            { campaignId, userId, displayName: event.displayName },
            "lobby participant joined",
          );
          return;
        }

        if (!userId) {
          socket.send(
            JSON.stringify({
              type: "error",
              v: "v1",
              code: "not_joined",
              message: "Send lobby_join first.",
              recoverable: true,
            }),
          );
          return;
        }

        const room = rooms.get(campaignId);
        if (!room) return;

        if (event.type === "lobby_ready") {
          const conn = room.connections.get(userId);
          if (!conn) return;
          conn.participant = { ...conn.participant, ready: event.ready };

          broadcast(room, lobbyState(campaignId, room));

          if (event.ready) maybeStart(campaignId, room, startDelayMs);
          else cancelStart(room);
          return;
        }

        if (event.type === "lobby_leave") {
          handleLeave(campaignId, userId, app, startDelayMs);
          socket.close();
        }
      });

      socket.on("close", () => {
        if (userId) handleLeave(campaignId, userId, app, startDelayMs);
      });
    },
  );
}
