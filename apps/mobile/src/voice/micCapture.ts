import { Platform } from "react-native";
import type { MicCapture } from "./deepgram";
import type {
  AudioEventPayload,
  EventSubscription,
  ExpoAudioStreamNative,
  RecordingConfig,
} from "./audioStream";

/**
 * Platform-specific mic capture. Deepgram expects `linear16` PCM at
 * 16 kHz; everything below produces exactly that so the recognizer
 * stays platform-agnostic.
 *
 *  - Web (Chrome, Firefox, Safari): AudioWorklet pulls Float32 samples
 *    straight out of the audio graph, converts to Int16 LE, and posts
 *    each render quantum to the main thread. No native deps.
 *  - iOS + Android: @siteed/expo-audio-stream's native module emits
 *    PCM chunks every 100 ms via addAudioEventListener. We decode the
 *    base64 payload and forward the raw bytes to the recognizer —
 *    same code path on both platforms, no file-polling hack.
 */
export function createPlatformMicCapture(): MicCapture {
  if (Platform.OS === "web") return createWebMicCapture();
  return createNativeMicCapture();
}

// ---------------------------------------------------------------------------
// Web: AudioWorklet → 16 kHz Int16 little-endian
// ---------------------------------------------------------------------------

function createWebMicCapture(): MicCapture {
  let audioCtx: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let node: AudioWorkletNode | null = null;
  let stream: MediaStream | null = null;
  let workletUrl: string | null = null;

  return {
    async start(onChunk) {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose a microphone.");
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      audioCtx = new AudioContext({ sampleRate: 16000 });
      workletUrl = makePcmWorkletUrl();
      await audioCtx.audioWorklet.addModule(workletUrl);
      source = audioCtx.createMediaStreamSource(stream);
      node = new AudioWorkletNode(audioCtx, "pcm-streamer");
      node.port.onmessage = (e: MessageEvent) => {
        if (e.data instanceof ArrayBuffer) onChunk(e.data);
      };
      source.connect(node);
      // Intentionally not connected to destination — we don't want to
      // hear ourselves.
    },
    async stop() {
      try {
        node?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        source?.disconnect();
      } catch {
        /* ignore */
      }
      stream?.getTracks().forEach((t) => t.stop());
      await audioCtx?.close().catch(() => undefined);
      if (workletUrl) URL.revokeObjectURL(workletUrl);
      audioCtx = null;
      source = null;
      node = null;
      stream = null;
      workletUrl = null;
    },
  };
}

function makePcmWorkletUrl(): string {
  const code = `
    class PcmStreamer extends AudioWorkletProcessor {
      process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;
        const ch = input[0]; // Float32Array, mono, render quantum (usually 128)
        const buf = new ArrayBuffer(ch.length * 2);
        const view = new DataView(buf);
        for (let i = 0; i < ch.length; i++) {
          const s = Math.max(-1, Math.min(1, ch[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true /* little-endian */);
        }
        this.port.postMessage(buf, [buf]);
        return true;
      }
    }
    registerProcessor('pcm-streamer', PcmStreamer);
  `;
  const blob = new Blob([code], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

// ---------------------------------------------------------------------------
// iOS + Android: @siteed/expo-audio-stream
// ---------------------------------------------------------------------------

function createNativeMicCapture(): MicCapture {
  let subscription: EventSubscription | null = null;
  let active = false;
  type NativeAudioModule = {
    ExpoAudioStreamModule: ExpoAudioStreamNative;
    addAudioEventListener: (
      listener: (event: AudioEventPayload) => Promise<void>,
    ) => EventSubscription;
  };
  let nativeAudio: NativeAudioModule | null = null;
  const loadNativeAudio = (): NativeAudioModule => {
    if (nativeAudio) return nativeAudio;
    // Keep the native module out of the initial web bundle eval path.
    nativeAudio = require("./audioStream") as NativeAudioModule;
    return nativeAudio;
  };

  return {
    async start(onChunk) {
      const audio = loadNativeAudio();
      const permission =
        await audio.ExpoAudioStreamModule.requestPermissionsAsync();
      if (!permission?.granted) {
        throw new Error("Microphone permission denied.");
      }

      subscription = audio.addAudioEventListener(async (evt) => {
        if (!active) return;
        const bytes = extractPcmBytes(evt);
        if (bytes && bytes.byteLength > 0) onChunk(bytes);
      });

      const config: RecordingConfig = {
        sampleRate: 16000,
        channels: 1,
        encoding: "pcm_16bit",
        interval: 100, // ms between audioData events — low latency for Deepgram
        enableProcessing: false,
        keepAwake: true,
        showNotification: false,
        ios: {
          audioSession: {
            category: "PlayAndRecord",
            mode: "SpokenAudio",
            categoryOptions: [
              "AllowBluetooth",
              "DefaultToSpeaker",
              "MixWithOthers",
            ],
          },
        },
      };

      active = true;
      await audio.ExpoAudioStreamModule.startRecording(config);
    },
    async stop() {
      active = false;
      try {
        await nativeAudio?.ExpoAudioStreamModule.stopRecording();
      } catch {
        /* best effort — the recognizer already closed the WS */
      }
      subscription?.remove();
      subscription = null;
    },
  };
}

/**
 * The native module emits either a base64-encoded payload (iOS/Android) or
 * a Float32Array buffer (rare — usually the web fallback path); convert to
 * an Int16 LE ArrayBuffer that Deepgram can consume.
 */
function extractPcmBytes(evt: AudioEventPayload): ArrayBuffer | null {
  if (typeof evt.encoded === "string" && evt.encoded.length > 0) {
    return base64ToArrayBuffer(evt.encoded);
  }
  const buffer = evt.buffer;
  if (buffer && buffer instanceof Float32Array) {
    const out = new ArrayBuffer(buffer.length * 2);
    const view = new DataView(out);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i] ?? 0));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return out;
  }
  return null;
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary =
    typeof atob === "function"
      ? atob(b64)
      : (
          globalThis as unknown as {
            Buffer?: {
              from: (s: string, enc: string) => { toString: (enc: string) => string };
            };
          }
        ).Buffer?.from(b64, "base64").toString("binary") ?? "";
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}
