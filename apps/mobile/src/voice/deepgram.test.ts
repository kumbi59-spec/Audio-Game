import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

import { createDeepgramRecognizer, type MicCapture } from "./deepgram";

/** Socket double: the test drives open, messages and close by hand. */
class FakeSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static instances: FakeSocket[] = [];
  readyState = 0;
  readonly sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((evt: { data: unknown }) => void) | null = null;

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  send(data: unknown): void {
    this.sent.push(data);
  }

  close(): void {
    if (this.readyState === FakeSocket.CLOSED) return;
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }

  emitOpen(): void {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }

  emitError(): void {
    this.onerror?.();
  }

  result(transcript: string, speechFinal: boolean): void {
    this.onmessage?.({
      data: JSON.stringify({
        type: "Results",
        is_final: true,
        speech_final: speechFinal,
        channel: { alternatives: [{ transcript }] },
      }),
    });
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

function fakeMic(startError?: Error): MicCapture & { stop: ReturnType<typeof vi.fn> } {
  return {
    start: vi.fn(async () => {
      if (startError) throw startError;
    }),
    stop: vi.fn(async () => undefined),
  };
}

/** Runs start() through the token fetch and socket open. */
async function started(recognizer: ReturnType<typeof createDeepgramRecognizer>): Promise<FakeSocket> {
  const pending = recognizer.start();
  await flush();
  const socket = lastSocket();
  socket.emitOpen();
  await pending;
  return socket;
}

describe("createDeepgramRecognizer", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ token: "t", expiresAt: "", model: "nova-3" }),
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("ends the utterance on speech_final once something was heard", async () => {
    const recognizer = createDeepgramRecognizer(fakeMic());
    const socket = await started(recognizer);

    let ended = false;
    void recognizer.waitForUtterance?.(10_000).then(() => {
      ended = true;
    });
    // Leading silence can endpoint before the player says anything.
    socket.result("", true);
    await flush();
    expect(ended).toBe(false);

    socket.result("open the door", true);
    await flush();
    expect(ended).toBe(true);

    const transcript = recognizer.stop();
    await flush();
    socket.close();
    await expect(transcript).resolves.toBe("open the door");
  });

  it("ends the utterance after maxMs of no endpoint", async () => {
    vi.useFakeTimers();
    const recognizer = createDeepgramRecognizer(fakeMic());
    await started(recognizer);

    let ended = false;
    void recognizer.waitForUtterance?.(10_000).then(() => {
      ended = true;
    });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(ended).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(ended).toBe(true);
  });

  it("closes the socket and stops listening when the mic fails to start", async () => {
    const mic = fakeMic(new Error("Microphone permission denied."));
    const recognizer = createDeepgramRecognizer(mic);
    const pending = recognizer.start();
    await flush();
    const socket = lastSocket();
    socket.emitOpen();

    await expect(pending).rejects.toThrow("Microphone permission denied.");
    expect(socket.readyState).toBe(FakeSocket.CLOSED);
    expect(recognizer.isListening()).toBe(false);
    expect(mic.stop).toHaveBeenCalled();
  });

  it("rejects start when the socket closes before it opens", async () => {
    const recognizer = createDeepgramRecognizer(fakeMic());
    const pending = recognizer.start();
    await flush();
    lastSocket().close();
    await expect(pending).rejects.toThrow("Deepgram connection closed.");
    expect(recognizer.isListening()).toBe(false);
  });

  it("rejects start when the socket errors", async () => {
    const recognizer = createDeepgramRecognizer(fakeMic());
    const pending = recognizer.start();
    await flush();
    const socket = lastSocket();
    socket.emitError();
    await expect(pending).rejects.toThrow("Deepgram connection failed.");
    expect(socket.readyState).toBe(FakeSocket.CLOSED);
  });

  it("a stopped session's flush timer leaves the next session's socket open", async () => {
    vi.useFakeTimers();
    const recognizer = createDeepgramRecognizer(fakeMic());
    const first = await started(recognizer);
    const firstTranscript = recognizer.stop();

    const second = await started(recognizer);
    // The first stop's 2 s flush timer fires during the second session.
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(firstTranscript).resolves.toBeNull();
    expect(first.readyState).toBe(FakeSocket.CLOSED);
    expect(second.readyState).toBe(FakeSocket.OPEN);
    expect(recognizer.isListening()).toBe(true);

    second.result("hello", true);
    const secondTranscript = recognizer.stop();
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(secondTranscript).resolves.toBe("hello");
  });
});
