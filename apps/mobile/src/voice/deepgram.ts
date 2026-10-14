import { apiBaseUrl } from "@/api/config";
import type { SpeechRecognizer } from "./stt";

/**
 * Deepgram streaming recognizer. Opens a WebSocket directly to Deepgram
 * using a short-lived token minted by the server (POST /stt/token) — the
 * mobile client never sees the master Deepgram key.
 *
 * Mic capture is intentionally pluggable: a production build on native
 * wires expo-av's Recording to feed PCM frames to `sendAudio`, while web
 * uses getUserMedia + MediaRecorder. The recognizer here owns only the
 * protocol and the transcript assembly so each platform can drop in its
 * own audio source.
 */
export interface MicCapture {
  start: (onChunk: (pcm: ArrayBuffer) => void) => Promise<void>;
  stop: () => Promise<void>;
}

interface DeepgramToken {
  token: string;
  expiresAt: string;
  model: string;
}

async function fetchDeepgramToken(): Promise<DeepgramToken | null> {
  const res = await fetch(`${apiBaseUrl()}/stt/token`, { method: "POST" });
  if (res.status === 503) return null; // server told us to fall back
  if (!res.ok) throw new Error(`STT token failed: ${res.status}`);
  return (await res.json()) as DeepgramToken;
}

/** One start()..stop() cycle; handlers only ever touch their own session. */
interface ListenSession {
  ws: WebSocket;
  finalTranscript: string;
  waitForFinal: ((t: string | null) => void) | null;
  utteranceDone: (() => void) | null;
  speechEnded: boolean;
}

export function createDeepgramRecognizer(mic: MicCapture): SpeechRecognizer {
  let current: ListenSession | null = null;
  let listening = false;

  function endUtterance(session: ListenSession): void {
    session.speechEnded = true;
    const done = session.utteranceDone;
    session.utteranceDone = null;
    done?.();
  }

  function closeSocket(session: ListenSession): void {
    try {
      session.ws.close();
    } catch {
      /* ignore */
    }
  }

  return {
    async start() {
      const token = await fetchDeepgramToken();
      if (!token) throw new Error("Deepgram unavailable on the server.");

      const url = new URL("wss://api.deepgram.com/v1/listen");
      url.searchParams.set("model", token.model);
      url.searchParams.set("encoding", "linear16");
      url.searchParams.set("sample_rate", "16000");
      url.searchParams.set("interim_results", "false");
      url.searchParams.set("smart_format", "true");
      url.searchParams.set("endpointing", "500");

      // React Native's WebSocket supports protocols as a second arg.
      const ws = new WebSocket(url.toString(), ["token", token.token]);
      const session: ListenSession = {
        ws,
        finalTranscript: "",
        waitForFinal: null,
        utteranceDone: null,
        speechEnded: false,
      };
      current = session;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(typeof evt.data === "string" ? evt.data : "{}") as {
            type?: string;
            is_final?: boolean;
            speech_final?: boolean;
            channel?: { alternatives?: { transcript?: string }[] };
          };
          const text = msg.channel?.alternatives?.[0]?.transcript ?? "";
          if (msg.is_final && text) {
            session.finalTranscript = `${session.finalTranscript} ${text}`.trim();
          }
          // speech_final marks the endpoint (a pause after speech). Leading
          // silence can endpoint too, so only end once something was heard.
          if (msg.speech_final && session.finalTranscript) endUtterance(session);
        } catch {
          /* ignore parse errors */
        }
      };
      let rejectOpen: ((err: Error) => void) | null = null;
      ws.onclose = () => {
        // A socket that closes before opening would otherwise hang start().
        rejectOpen?.(new Error("Deepgram connection closed."));
        endUtterance(session);
        if (session.waitForFinal) {
          session.waitForFinal(session.finalTranscript || null);
          session.waitForFinal = null;
        }
      };

      try {
        await new Promise<void>((resolve, reject) => {
          rejectOpen = reject;
          ws.onopen = () => resolve();
          ws.onerror = () => reject(new Error("Deepgram connection failed."));
        });

        listening = true;
        await mic.start((pcm) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(pcm);
        });
      } catch (err) {
        // Token, socket or mic failure: release everything this start took.
        listening = false;
        if (current === session) current = null;
        await mic.stop().catch(() => undefined);
        closeSocket(session);
        throw err;
      }
    },

    waitForUtterance(maxMs) {
      const session = current;
      if (!session || !listening || session.speechEnded) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timer = setTimeout(() => endUtterance(session), maxMs);
        session.utteranceDone = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    },

    async stop() {
      const session = current;
      if (!listening || !session) return null;
      listening = false;
      current = null;
      endUtterance(session);
      await mic.stop();
      if (session.ws.readyState === WebSocket.CLOSED) {
        return session.finalTranscript || null;
      }
      // Send close-stream frame so Deepgram flushes its final transcript.
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(JSON.stringify({ type: "CloseStream" }));
      }
      return new Promise<string | null>((resolve) => {
        session.waitForFinal = resolve;
        setTimeout(() => {
          if (session.waitForFinal) {
            session.waitForFinal(session.finalTranscript || null);
            session.waitForFinal = null;
          }
          closeSocket(session);
        }, 2000);
      });
    },

    isListening() {
      return listening;
    },
  };
}
