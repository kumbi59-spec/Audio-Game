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

export function createDeepgramRecognizer(mic: MicCapture): SpeechRecognizer {
  let ws: WebSocket | null = null;
  let listening = false;
  let finalTranscript = "";
  let waitForFinal: ((t: string | null) => void) | null = null;

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
      ws = new WebSocket(url.toString(), ["token", token.token]);
      finalTranscript = "";

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(typeof evt.data === "string" ? evt.data : "{}") as {
            type?: string;
            is_final?: boolean;
            channel?: { alternatives?: { transcript?: string }[] };
          };
          const text = msg.channel?.alternatives?.[0]?.transcript ?? "";
          if (msg.is_final && text) {
            finalTranscript = `${finalTranscript} ${text}`.trim();
          }
        } catch {
          /* ignore parse errors */
        }
      };
      ws.onclose = () => {
        if (waitForFinal) {
          waitForFinal(finalTranscript || null);
          waitForFinal = null;
        }
      };

      await new Promise<void>((resolve, reject) => {
        if (!ws) return reject(new Error("ws null"));
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("Deepgram connection failed."));
      });

      listening = true;
      await mic.start((pcm) => {
        if (ws?.readyState === WebSocket.OPEN) ws.send(pcm);
      });
    },

    async stop() {
      if (!listening) return null;
      listening = false;
      await mic.stop();
      // Send close-stream frame so Deepgram flushes its final transcript.
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "CloseStream" }));
      }
      return new Promise<string | null>((resolve) => {
        waitForFinal = resolve;
        setTimeout(() => {
          if (waitForFinal) {
            waitForFinal(finalTranscript || null);
            waitForFinal = null;
          }
          try {
            ws?.close();
          } catch {
            /* ignore */
          }
        }, 2000);
      });
    },

    isListening() {
      return listening;
    },
  };
}
