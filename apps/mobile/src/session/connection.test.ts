import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTransportEnvelope, type ServerEvent } from "@audio-rpg/shared";

vi.mock("react-native", () => ({ Platform: { OS: "web" } }));
vi.mock("@/audio/narrator", () => ({
  configureNarrator: vi.fn(),
  resetNpcVoiceMap: vi.fn(),
  updateNpcVoiceMap: vi.fn(),
}));
vi.mock("@/audio/cues", () => ({ setCuePreferences: vi.fn() }));

import { SessionConnection } from "./connection";
import { useSession } from "./store";

/** Socket double: the test drives open, messages and close by hand. */
class FakeSocket extends EventTarget {
  static instances: FakeSocket[] = [];
  readyState = 0;
  readonly sent: unknown[] = [];

  constructor(readonly url: string) {
    super();
    FakeSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  /** Like a real socket, the close event arrives later (see emitClose). */
  close(): void {
    if (this.readyState < 2) this.readyState = 2;
  }

  emitOpen(): void {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  emitClose(): void {
    this.readyState = 3;
    this.dispatchEvent(new Event("close"));
  }

  receive(data: unknown): void {
    this.dispatchEvent(
      new MessageEvent("message", { data: typeof data === "string" ? data : JSON.stringify(data) }),
    );
  }

  receiveEvent(evt: ServerEvent): void {
    this.receive(createTransportEnvelope("session.server_event", { ...evt, v: "v1" }));
  }
}

async function flush(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

function lastSocket(): FakeSocket {
  const socket = FakeSocket.instances[FakeSocket.instances.length - 1];
  if (!socket) throw new Error("no socket was opened");
  return socket;
}

const ARGS = { campaignId: "camp-1", authToken: "token-1" };

/** Runs connect() through open, join and session_ready. */
async function connectFully(conn: SessionConnection, args = ARGS): Promise<FakeSocket> {
  const pending = conn.connect(args);
  await flush();
  const socket = lastSocket();
  socket.emitOpen();
  await flush();
  socket.receiveEvent({ type: "session_ready", campaignId: args.campaignId, turnNumber: 0 });
  await pending;
  return socket;
}

describe("SessionConnection", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeSocket);
    useSession.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("joins and resolves on an enveloped session_ready", async () => {
    const conn = new SessionConnection();
    const socket = await connectFully(conn);
    expect(socket.sent).toContainEqual({ type: "join", campaignId: "camp-1", authToken: "token-1" });
    expect(useSession.getState().connected).toBe(true);
  });

  it("accepts enveloped and bare events and drops garbage", async () => {
    const conn = new SessionConnection();
    const socket = await connectFully(conn);
    const seen: string[] = [];
    conn.onServerEvent((e) => seen.push(e.type));

    socket.receiveEvent({ type: "narration_chunk", turnId: "t1", text: "Enveloped. ", done: false });
    socket.receive({ type: "narration_chunk", turnId: "t1", text: "Bare.", done: false });
    socket.receive("not json");
    socket.receive({ type: "nonsense" });
    socket.receive(createTransportEnvelope("session.server_event", { type: "nonsense" }));

    expect(seen).toEqual(["narration_chunk", "narration_chunk"]);
    expect(useSession.getState().transcript).toEqual([
      { id: "t1", role: "gm", text: "Enveloped. Bare.", streaming: true },
    ]);
  });

  it("rejects when the socket closes before session_ready", async () => {
    const conn = new SessionConnection();
    const pending = conn.connect(ARGS);
    await flush();
    const socket = lastSocket();
    socket.emitOpen();
    await flush();
    socket.emitClose();
    await expect(pending).rejects.toThrow(/closed before the session was ready/);
    expect(useSession.getState().connected).toBe(false);
  });

  it("rejects when the socket closes before it opens", async () => {
    const conn = new SessionConnection();
    const pending = conn.connect(ARGS);
    await flush();
    lastSocket().emitClose();
    await expect(pending).rejects.toThrow();
  });

  it("rejects with the server's message when the join fails", async () => {
    const conn = new SessionConnection();
    const pending = conn.connect(ARGS);
    await flush();
    const socket = lastSocket();
    socket.emitOpen();
    await flush();
    socket.receiveEvent({ type: "error", code: "join_failed", message: "Bad token.", recoverable: false });
    await expect(pending).rejects.toThrow("Bad token.");
    expect(useSession.getState().connected).toBe(false);
  });

  it("ignores a replaced socket's late close after a reconnect", async () => {
    const conn = new SessionConnection();
    const first = await connectFully(conn);
    const second = await connectFully(conn, { campaignId: "camp-2", authToken: "token-2" });
    expect(first.readyState).toBe(2);

    first.emitClose();
    expect(useSession.getState().connected).toBe(true);

    // Nor does it start a reconnect of the old campaign.
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(FakeSocket.instances).toEqual([first, second]);
  });

  it("re-joins a dropped session with backoff", async () => {
    const conn = new SessionConnection();
    const first = await connectFully(conn);
    vi.useFakeTimers();
    useSession.getState().appendPlayer("Open the door");

    first.emitClose();
    expect(useSession.getState().connected).toBe(false);
    expect(useSession.getState().awaitingGm).toBe(false);

    await vi.advanceTimersByTimeAsync(999);
    expect(FakeSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    const second = lastSocket();
    expect(second).not.toBe(first);
    second.emitOpen();
    await flush();
    expect(second.sent).toContainEqual({ type: "join", campaignId: "camp-1", authToken: "token-1" });
    second.receiveEvent({ type: "session_ready", campaignId: "camp-1", turnNumber: 4 });
    await flush();
    expect(useSession.getState().connected).toBe(true);
    expect(useSession.getState().connectionError).toBeNull();
  });

  it("reports the connection lost once every reconnect attempt fails", async () => {
    const conn = new SessionConnection();
    const first = await connectFully(conn);
    vi.useFakeTimers();
    first.emitClose();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const before = FakeSocket.instances.length;
      await vi.advanceTimersByTimeAsync(1000 * 2 ** attempt);
      expect(FakeSocket.instances).toHaveLength(before + 1);
      lastSocket().emitClose();
      await flush();
    }

    await vi.advanceTimersByTimeAsync(60_000);
    expect(FakeSocket.instances).toHaveLength(5);
    expect(useSession.getState().connectionError).toBeTruthy();
    expect(useSession.getState().connected).toBe(false);
  });

  it("does not reconnect after close()", async () => {
    const conn = new SessionConnection();
    const first = await connectFully(conn);
    vi.useFakeTimers();
    await conn.close();
    expect(first.sent).toContainEqual({ type: "leave" });
    first.emitClose();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(FakeSocket.instances).toHaveLength(1);
    expect(useSession.getState().connected).toBe(false);
  });
});
