import { Platform } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import type { MicCapture } from "./deepgram";

/**
 * Platform-specific mic capture. Deepgram expects `linear16` PCM at
 * 16 kHz; everything below produces exactly that so the recognizer
 * stays platform-agnostic.
 *
 *  - Web (Chrome, Firefox, Safari): AudioWorklet pulls Float32 samples
 *    straight out of the audio graph, converts to Int16 LE, and posts
 *    each render quantum to the main thread. No native deps.
 *  - iOS: `expo-av` Recording configured for LinearPCM at 16 kHz,
 *    16-bit, mono. We poll the recording file every 250 ms, skip the
 *    44-byte WAV header on the first read, and forward the new bytes.
 *    Latency is ~250 ms, acceptable for the MVP utterance-based flow
 *    (the user tapes out a full sentence before we stop).
 *  - Android: native streaming PCM from expo-av isn't reliable — the
 *    encoder options don't expose raw 16-bit output. Android mic
 *    capture will throw with a clear message pointing at the
 *    @siteed/expo-audio-stream native module which is the accepted
 *    solution. Until that's integrated, Android falls back to the
 *    mock recognizer so the rest of the app keeps working.
 */
export function createPlatformMicCapture(): MicCapture {
  if (Platform.OS === "web") return createWebMicCapture();
  if (Platform.OS === "ios") return createIosMicCapture();
  return createUnsupportedMicCapture(Platform.OS);
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
      // Modern browsers honor sampleRate on AudioContext; this means the
      // AudioWorklet's render quantum is already at 16 kHz. If the request
      // is refused we'd fall through to the worklet doing a linear
      // downsample — not worth the complexity for MVP; fail fast instead.
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
// iOS: expo-av LinearPCM + file polling
// ---------------------------------------------------------------------------

function createIosMicCapture(): MicCapture {
  let recording: Audio.Recording | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastRead = WAV_HEADER_BYTES;

  return {
    async start(onChunk) {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) throw new Error("Microphone permission denied.");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        isMeteringEnabled: false,
        android: {
          // Android is not supported on this path — see createUnsupportedMicCapture.
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/wav",
          bitsPerSecond: 256000,
        },
      });
      await recording.startAsync();
      lastRead = WAV_HEADER_BYTES;

      timer = setInterval(() => {
        void pumpBytes(recording, () => lastRead, (n) => {
          lastRead = n;
        }, onChunk);
      }, 250);
    },
    async stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      const rec = recording;
      recording = null;
      if (!rec) return;
      try {
        await rec.stopAndUnloadAsync();
      } catch {
        /* ignore; final bytes captured in the last pump tick */
      }
      // Flush anything the recorder wrote between the last tick and stop.
      await pumpBytes(rec, () => lastRead, (n) => {
        lastRead = n;
      }, () => {
        /* no-op: deepgram was told to close already */
      });
    },
  };
}

const WAV_HEADER_BYTES = 44;

async function pumpBytes(
  recording: Audio.Recording | null,
  getLastRead: () => number,
  setLastRead: (n: number) => void,
  emit: (chunk: ArrayBuffer) => void,
): Promise<void> {
  if (!recording) return;
  const uri = recording.getURI();
  if (!uri) return;
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (!info.exists) return;
  const currentSize =
    "size" in info && typeof info.size === "number" ? info.size : 0;
  const from = getLastRead();
  if (currentSize <= from) return;
  const length = currentSize - from;
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
    position: from,
    length,
  });
  setLastRead(currentSize);
  const bytes = base64ToArrayBuffer(b64);
  if (bytes.byteLength > 0) emit(bytes);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary =
    typeof atob === "function"
      ? atob(b64)
      : (
          globalThis as unknown as {
            Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } };
          }
        ).Buffer?.from(b64, "base64").toString("binary") ?? "";
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

// ---------------------------------------------------------------------------
// Unsupported platform fallback
// ---------------------------------------------------------------------------

function createUnsupportedMicCapture(osName: string): MicCapture {
  return {
    async start() {
      throw new Error(
        `Streaming mic capture is not yet wired for ${osName}. ` +
          "Add @siteed/expo-audio-stream (or an equivalent native module) " +
          "and implement createPlatformMicCapture for this platform.",
      );
    },
    async stop() {
      /* no-op */
    },
  };
}
