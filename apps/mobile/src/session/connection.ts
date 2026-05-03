import type {
  ClientEvent,
  PlayerInput,
  ServerEvent,
} from "@audio-rpg/shared";
import { DEGRADED_MODE_COPY, ServerEvent as ServerEventSchema } from "@audio-rpg/shared";
import { apiWebSocketUrl } from "../api/config";
import { useSession } from "./store";

/**
 * Thin WebSocket wrapper around the /session route. Owns the socket and
 * dispatches parsed ServerEvents into the zustand store. Keeps reconnect
 * logic simple: one socket per campaign, closed when leaving.
 */
export class SessionConnection {
  private socket: WebSocket | null = null;
  private readonly url = apiWebSocketUrl("/session");
  private readonly onEvent: ((e: ServerEvent) => void)[] = [];

  async connect(args: { campaignId: string; authToken: string; tierToken?: string }): Promise<void> {
    await this.close();
    const socket = new WebSocket(this.url);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("error", onError);
        resolve();
      };
      const onError = (err: unknown) => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("error", onError);
        reject(err instanceof Error ? err : new Error("WebSocket connect failed"));
      };
      socket.addEventListener("open", onOpen);
      socket.addEventListener("error", onError);
    });

    useSession.getState().setConnected(true);
    socket.addEventListener("message", (msg) => this.handleMessage(msg));
    socket.addEventListener("close", () => {
      useSession.getState().setConnected(false);
    });

    const ready = this.waitForEvent(
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
  }

  private waitForEvent(predicate: (e: ServerEvent) => boolean): Promise<ServerEvent> {
    return new Promise((resolve) => {
      const off = this.onServerEvent((e) => {
        if (predicate(e)) {
          off();
          resolve(e);
        }
      });
    });
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
    const validated = ServerEventSchema.safeParse(parsed);
    if (!validated.success) return;
    const evt = validated.data;
    useSession.getState().handleEvent(evt);
    for (const cb of this.onEvent) cb(evt);
  }
}

export const sessionConnection = new SessionConnection();
