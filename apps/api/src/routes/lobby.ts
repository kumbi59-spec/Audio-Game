import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { MultiplayerClientEvent, type LobbyParticipant, type MultiplayerServerEvent } from "@audio-rpg/shared";
import { verifySessionToken } from "../state/tokens.js";

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
}

const rooms = new Map<string, LobbyRoom>();

/** Exposed for test teardown only. */
export function clearRooms(): void {
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

function handleLeave(campaignId: string, userId: string, app: FastifyInstance): void {
  const room = rooms.get(campaignId);
  if (!room) return;
  const conn = room.connections.get(userId);
  if (!conn) return;

  room.connections.delete(userId);

  if (room.connections.size === 0) {
    rooms.delete(campaignId);
    return;
  }

  if (room.hostUserId === userId) {
    room.hostUserId = room.connections.keys().next().value as string;
  }

  broadcast(room, {
    type: "player_left",
    v: "v1",
    campaignId,
    userId,
    displayName: conn.participant.displayName,
  });

  app.log.info({ campaignId, userId }, "lobby participant left");
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
          if (!verifySessionToken(event.authToken, campaignId)) {
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

          // Derive a per-player stable userId from the token nonce
          const tokenParts = event.authToken.split(".");
          userId = tokenParts[1] ?? randomUUID();

          let room = rooms.get(campaignId);
          if (!room) {
            room = { connections: new Map(), hostUserId: userId, maxPlayers: 4 };
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

          // Send full state to the new joiner
          socket.send(
            JSON.stringify({
              type: "lobby_state",
              v: "v1",
              campaignId,
              participants: participantList(room),
              maxPlayers: room.maxPlayers,
              hostUserId: room.hostUserId,
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

          const participants = participantList(room);
          broadcast(room, {
            type: "lobby_state",
            v: "v1",
            campaignId,
            participants,
            maxPlayers: room.maxPlayers,
            hostUserId: room.hostUserId,
          });

          if (
            participants.length >= 2 &&
            participants.every((p) => p.ready)
          ) {
            broadcast(room, {
              type: "lobby_ready",
              v: "v1",
              campaignId,
              participants,
            });

            const hostConn = room.connections.get(room.hostUserId);
            const hostDisplayName = hostConn?.participant.displayName ?? "Host";
            const hostId = room.hostUserId;
            const turnId = randomUUID();

            setTimeout(() => {
              const r = rooms.get(campaignId);
              if (!r) return;
              broadcast(r, {
                type: "turn_request",
                v: "v1",
                campaignId,
                requestingUserId: hostId,
                requestingDisplayName: hostDisplayName,
                turnId,
              });
              rooms.delete(campaignId);
            }, startDelayMs);
          }
          return;
        }

        if (event.type === "lobby_leave") {
          handleLeave(campaignId, userId, app);
          socket.close();
        }
      });

      socket.on("close", () => {
        if (userId) handleLeave(campaignId, userId, app);
      });
    },
  );
}
