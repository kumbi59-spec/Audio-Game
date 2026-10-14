import { Platform } from "react-native";
import { Audio } from "expo-av";
import { apiBaseUrl } from "@/api/config";

/**
 * ElevenLabs narration playback. Sentences are POSTed to the server's
 * /tts/stream proxy (which holds the ElevenLabs key and adds edge
 * caching) and played through expo-av. Any failure (503 without a key,
 * 401/403 without a storyteller tier token, network) hands the unplayed
 * sentences to the caller's `onFallback`, which speaks them on-device.
 *
 * We keep a queue of sentences so that when a new chunk arrives we can
 * start buffering the next one while the current one is still playing,
 * smoothing the perceived latency of the streaming narration loop.
 */

interface EnqueuedClip {
  text: string;
  voiceId: string;
  voiceRole?: string;
  speed: number;
  sound?: Audio.Sound;
  uri?: string;
}

/** A sentence premium playback could not play, for on-device fallback. */
export interface UnplayedClip {
  text: string;
  voiceRole?: string;
}

export class ElevenLabsNarrator {
  private queue: EnqueuedClip[] = [];
  private playing = false;
  private voiceId: string;
  private rate = 1.0;
  // Bumped by stop() so a drain loop that is mid-fetch or mid-clip quits.
  private generation = 0;
  private current: { sound: Audio.Sound; finish: () => void } | null = null;
  private readonly onFallback: ((clips: UnplayedClip[]) => void) | undefined;

  constructor(
    voiceId = "21m00Tcm4TlvDq8ikWAM",
    onFallback?: (clips: UnplayedClip[]) => void,
  ) {
    this.voiceId = voiceId;
    this.onFallback = onFallback;
  }

  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }

  setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  speak(text: string, voiceRole?: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.queue.push({ text: trimmed, voiceId: this.voiceId, voiceRole, speed: this.rate });
    if (!this.playing) void this.drain();
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.queue = [];
    this.playing = false;
    const current = this.current;
    this.current = null;
    if (!current) return;
    current.finish();
    try {
      await current.sound.stopAsync();
    } catch {
      /* best effort */
    }
    await current.sound.unloadAsync().catch(() => undefined);
  }

  private async drain(): Promise<void> {
    const generation = this.generation;
    this.playing = true;
    try {
      while (generation === this.generation && this.queue.length > 0) {
        const clip = this.queue.shift();
        if (!clip) break;
        let uri: string | null = null;
        try {
          uri = await this.fetchClip(clip);
          if (generation !== this.generation) return;
          // ElevenLabs handles speed in its 0.7–1.2 window; the rest is realised
          // here via expo-av's rate control so the user's full 0.5–2.0 setting works.
          const apiSpeed = Math.max(0.7, Math.min(1.2, clip.speed));
          const playbackRate = clip.speed / apiSpeed;
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: false },
          );
          if (generation !== this.generation) {
            void sound.unloadAsync().catch(() => undefined);
            return;
          }
          await new Promise<void>((resolve, reject) => {
            this.current = { sound, finish: resolve };
            sound.setOnPlaybackStatusUpdate((status) => {
              if (!status.isLoaded) {
                if (status.error) reject(new Error(status.error));
                return;
              }
              if (status.didJustFinish) resolve();
            });
          });
          if (this.current?.sound === sound) this.current = null;
          void sound.unloadAsync().catch(() => undefined);
        } catch (err) {
          if (generation !== this.generation) return;
          if (__DEV__) console.warn("ElevenLabs clip failed", err);
          // Hand this sentence and the rest of the queue back so the caller
          // can speak them on-device instead of going silent.
          const unplayed = [clip, ...this.queue].map((c) => ({
            text: c.text,
            ...(c.voiceRole ? { voiceRole: c.voiceRole } : {}),
          }));
          this.queue = [];
          this.onFallback?.(unplayed);
          return;
        } finally {
          if (uri) releaseClipUri(uri);
        }
      }
    } finally {
      if (generation === this.generation) this.playing = false;
    }
  }

  private async fetchClip(clip: EnqueuedClip): Promise<string> {
    const voiceParam = clip.voiceRole
      ? `voiceRole=${encodeURIComponent(clip.voiceRole)}`
      : `voiceId=${encodeURIComponent(clip.voiceId)}`;
    const apiSpeed = Math.max(0.7, Math.min(1.2, clip.speed));
    const speedParam = apiSpeed !== 1.0 ? `&speed=${apiSpeed}` : "";
    const url = `${apiBaseUrl()}/tts/stream?text=${encodeURIComponent(clip.text)}&${voiceParam}${speedParam}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TTS proxy returned ${res.status}`);
    }
    const blob = await res.blob();
    // Only the browser can play a blob: URL; React Native's
    // URL.createObjectURL throws, so native gets a data URL.
    if (Platform.OS === "web") {
      return URL.createObjectURL(blob);
    }
    const buffer = await blobToBase64(blob);
    return `data:audio/mpeg;base64,${buffer}`;
  }
}

function releaseClipUri(uri: string): void {
  if (uri.startsWith("blob:")) URL.revokeObjectURL(uri);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  if (typeof btoa !== "undefined") return btoa(binary);
  // `globalThis.Buffer` exists on the RN native side.
  const B = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => { toString(enc: string): string } } }).Buffer;
  if (B) return B.from(binary, "binary").toString("base64");
  throw new Error("No base64 encoder available.");
}

/**
 * Server-capability probe. The narrator chooses ElevenLabs only when the
 * server's TTS routes answer; otherwise the on-device expo-speech path
 * owns narration. It reads the voice list rather than synthesizing, so a
 * launch never spends a paid clip. /tts/voices can't say whether a key or
 * tier token will be accepted, so the first refused clip still falls back.
 */
export async function elevenLabsAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBaseUrl()}/tts/voices`, { method: "GET" });
    void res.body?.cancel?.();
    return res.ok;
  } catch {
    return false;
  }
}
