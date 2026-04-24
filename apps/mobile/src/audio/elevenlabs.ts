import { Audio } from "expo-av";
import { apiBaseUrl } from "@/api/config";

/**
 * ElevenLabs narration playback. Sentences are POSTed to the server's
 * /tts/stream proxy (which holds the ElevenLabs key and adds edge
 * caching) and played through expo-av. If the server returns 503 we
 * fall back to expo-speech via the caller.
 *
 * We keep a queue of sentences so that when a new chunk arrives we can
 * start buffering the next one while the current one is still playing,
 * smoothing the perceived latency of the streaming narration loop.
 */

interface EnqueuedClip {
  text: string;
  voiceId: string;
  sound?: Audio.Sound;
  uri?: string;
}

export class ElevenLabsNarrator {
  private queue: EnqueuedClip[] = [];
  private playing = false;
  private voiceId: string;

  constructor(voiceId = "21m00Tcm4TlvDq8ikWAM") {
    this.voiceId = voiceId;
  }

  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }

  speak(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.queue.push({ text: trimmed, voiceId: this.voiceId });
    if (!this.playing) void this.drain();
  }

  async stop(): Promise<void> {
    this.queue = [];
    this.playing = false;
    // expo-av does not let us cancel in-flight decode, but unloading the
    // current sound stops playback immediately.
    try {
      await Audio.setIsEnabledAsync(false);
      await Audio.setIsEnabledAsync(true);
    } catch {
      /* best effort */
    }
  }

  private async drain(): Promise<void> {
    this.playing = true;
    while (this.queue.length > 0) {
      const clip = this.queue.shift();
      if (!clip) break;
      try {
        const uri = await this.fetchClip(clip);
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
        );
        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;
            if (status.didJustFinish) {
              void sound.unloadAsync();
              resolve();
            }
          });
        });
      } catch (err) {
        if (__DEV__) console.warn("ElevenLabs clip failed", err);
        // Surface the failure by dropping the rest of the queue — the
        // caller's `onFallback` reroutes to expo-speech.
        this.queue = [];
        throw err;
      }
    }
    this.playing = false;
  }

  private async fetchClip(clip: EnqueuedClip): Promise<string> {
    const url = `${apiBaseUrl()}/tts/stream?text=${encodeURIComponent(clip.text)}&voiceId=${encodeURIComponent(clip.voiceId)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TTS proxy returned ${res.status}`);
    }
    const blob = await res.blob();
    // React Native's URL.createObjectURL is not supported; use a data URL.
    if (typeof URL !== "undefined" && "createObjectURL" in URL) {
      return URL.createObjectURL(blob);
    }
    const buffer = await blobToBase64(blob);
    return `data:audio/mpeg;base64,${buffer}`;
  }
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
 * Server-capability probe. The narrator chooses ElevenLabs only when
 * the server reports credentials are available; otherwise the on-device
 * expo-speech path owns narration.
 */
export async function elevenLabsAvailable(): Promise<boolean> {
  try {
    const res = await fetch(
      `${apiBaseUrl()}/tts/stream?text=${encodeURIComponent("probe")}`,
      { method: "GET" },
    );
    if (res.status === 503) return false;
    // Close the body so we don't leak the probe audio.
    void res.body?.cancel?.();
    return res.ok;
  } catch {
    return false;
  }
}
