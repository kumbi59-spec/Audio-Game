import type {
  ClientEvent,
  PlayerInput,
  ServerEvent,
} from "@audio-rpg/shared";
import {
  DEGRADED_MODE_COPY,
  ServerEvent as ServerEventSchema,
  TransportEnvelope,
} from "@audio-rpg/shared";
import { apiWebSocketUrl } from "../api/config";
import { useSession } from "./store";

export interface ConnectArgs {
  campaignId: string;
  authToken: string;
  tierToken?: string;
}

/** Reconnect attempts after a drop, with delays of 1s, 2s, 4s… */
const MAX_RECONNECT_ATTEMPTS = 4;
const RECONNECT_BASE_DELAY_MS = 1000;

/**
 * Thin WebSocket wrapper around the /session route. Owns the socket and
 * dispatches parsed ServerEvents into the zustand store. One socket per
 * campaign, closed when leaving; a dropped socket is re-joined with
 * backoff before the store reports the connection lost.
 */
export class SessionConnection {
  private socket: WebSocket | null = null;
  private readonly url = apiWebSocketUrl("/session");
  private readonly onEvent: ((e: ServerEvent) => void)[] = [];
  /** The session to re-join after a drop; cleared by close(). */
  private args: ConnectArgs | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  async connect(args: ConnectArgs): Promise<void> {
    this.reconnectAttempts = 0;
    await this.open(args);
  }

  private async open(args: ConnectArgs): Promise<void> {
    await this.close();
    this.args = args;
    const socket = new WebSocket(this.url);
    this.socket = socket;
    let established = false;

    try {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          socket.removeEventListener("open", onOpen);
          socket.removeEventListener("error", onError);
          socket.removeEventListener("close", onError);
        };
        const onOpen = () => {
          cleanup();
          resolve();
        };
        const onError = (err: unknown) => {
          cleanup();
          reject(err instanceof Error ? err : new Error("WebSocket connect failed"));
        };
        socket.addEventListener("open", onOpen);
        socket.addEventListener("error", onError);
        socket.addEventListener("close", onError);
      });

      useSession.getState().setConnected(true);
      socket.addEventListener("message", (msg) => {
        if (this.socket === socket) this.handleMessage(msg);
      });
      socket.addEventListener("close", () => {
        // A replaced socket closing late must not mark the new one down.
        if (this.socket !== socket) return;
        this.socket = null;
        useSession.getState().setConnected(false);
        if (established) this.scheduleReconnect(args);
      });

      const ready = this.waitForEvent(
        socket,
        (e) =>
          (e.type === "session_ready" && e.campaignId === args.campaignId) ||
          e.type === "error",
      );

      this.sendRaw({
        type: "join",
        campaignId: args.campaignId,
        authToken: args.authToken,
        ...(args.tierToken ? { tierToken: args.tierToken } : {}),
      });

      const evt = await ready;
      if (evt.type === "error") {
        const reliabilityCopy = DEGRADED_MODE_COPY[evt.code as keyof typeof DEGRADED_MODE_COPY];
        throw new Error(reliabilityCopy ?? evt.message);
      }
    } catch (err) {
      this.discard(socket);
      throw err;
    }

    established = true;
    this.reconnectAttempts = 0;
    useSession.getState().setConnectionError(null);
  }

  /** Resolves on the first matching event; rejects if the socket closes first. */
  private waitForEvent(
    socket: WebSocket,
    predicate: (e: ServerEvent) => boolean,
  ): Promise<ServerEvent> {
    return new Promise((resolve, reject) => {
      const onClose = () => {
        off();
        reject(new Error("The connection closed before the session was ready."));
      };
      const off = this.onServerEvent((e) => {
        if (predicate(e)) {
          off();
          socket.removeEventListener("close", onClose);
          resolve(e);
        }
      });
      socket.addEventListener("close", onClose);
    });
  }

  private scheduleReconnect(args: ConnectArgs, lastError?: unknown): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      useSession
        .getState()
        .setConnectionError(
          lastError instanceof Error
            ? lastError.message
            : "Lost the connection to the game server.",
        );
      return;
    }
    const delay = RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts;
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open(args).catch((err: unknown) => {
        // A connect() or close() since then owns the connection.
        if (this.args !== args || this.socket) return;
        this.scheduleReconnect(args, err);
      });
    }, delay);
  }

  /** Drops a socket that failed to join, without touching reconnect state. */
  private discard(socket: WebSocket): void {
    if (this.socket !== socket) return;
    this.socket = null;
    socket.close();
    useSession.getState().setConnected(false);
  }

  onServerEvent(cb: (e: ServerEvent) => void): () => void {
    this.onEvent.push(cb);
    return () => {
      const idx = this.onEvent.indexOf(cb);
      if (idx >= 0) this.onEvent.splice(idx, 1);
    };
  }

  sendPlayerInput(input: PlayerInput): void {
    this.sendRaw({ type: "player_input", input });
  }

  requestRecap(): void {
    this.sendRaw({ type: "request_recap" });
  }

  pause(): void {
    this.sendRaw({ type: "pause" });
  }

  async close(): Promise<void> {
    this.args = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (!this.socket) return;
    const socket = this.socket;
    this.socket = null;
    try {
      this.sendRaw({ type: "leave" }, socket);
    } catch {
      /* ignore */
    }
    socket.close();
    useSession.getState().setConnected(false);
  }

  private sendRaw(evt: ClientEvent, socket: WebSocket | null = this.socket): void {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify(evt));
  }

  private handleMessage(msg: MessageEvent): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof msg.data === "string" ? msg.data : "");
    } catch {
      return;
    }
    // The API wraps every event in a transport envelope; bare events are
    // still accepted.
    const envelope = TransportEnvelope.safeParse(parsed);
    const validated = ServerEventSchema.safeParse(
      envelope.success ? envelope.data.payload : parsed,
    );
    if (!validated.success) return;
    const evt = validated.data;
    useSession.getState().handleEvent(evt);
    for (const cb of this.onEvent) cb(evt);
  }
}

export const sessionConnection = new SessionConnection();
