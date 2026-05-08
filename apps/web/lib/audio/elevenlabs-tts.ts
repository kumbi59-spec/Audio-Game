import type { TTSOptions, TTSVoice, TTSProvider } from "@/types/audio";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const TTS_PROXY = "/api/game/tts";
// Mirror of the server-side clamp: ElevenLabs rejects voice_settings.speed
// outside this range. Speeds beyond it are realised via playbackRate.
const ELEVENLABS_SPEED_MIN = 0.7;
const ELEVENLABS_SPEED_MAX = 1.2;

/**
 * Returns true when the runtime can attach a MediaSource to an HTMLAudioElement
 * and feed it audio/mpeg chunks. Lets us stream ElevenLabs output and start
 * playback before the full clip is buffered. Safari iOS notably returns false
 * here — its audio element only accepts MSE for HLS, not raw audio/mpeg.
 */
function supportsMseMpeg(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaSource !== "undefined" &&
    MediaSource.isTypeSupported("audio/mpeg")
  );
}

export class ElevenLabsTTS implements TTSProvider {
  private audio: HTMLAudioElement | null = null;
  private _speaking = false;
  private _paused = false;

  isSupported(): boolean {
    return typeof window !== "undefined" && typeof Audio !== "undefined";
  }

  getVoices(): TTSVoice[] {
    return [
      { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", lang: "en-US", provider: "elevenlabs" },
      { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", lang: "en-US", provider: "elevenlabs" },
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", lang: "en-US", provider: "elevenlabs" },
      { id: "ErXwobaYiN019PkySvjV", name: "Antoni", lang: "en-US", provider: "elevenlabs" },
      { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", lang: "en-US", provider: "elevenlabs" },
      { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", lang: "en-US", provider: "elevenlabs" },
    ];
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported()) return;
    this.stop();

    const requestedRate = options.rate ?? 1.0;
    const apiSpeed = Math.max(ELEVENLABS_SPEED_MIN, Math.min(ELEVENLABS_SPEED_MAX, requestedRate));
    // The server clamps to the same range; keeping the math here lets us
    // compute the exact playbackRate compensation the client should apply.
    const playbackCompensation = requestedRate / apiSpeed;

    const res = await fetch(TTS_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceId: options.voiceId ?? DEFAULT_VOICE_ID,
        speed: apiSpeed,
      }),
    });

    if (!res.ok) {
      this._speaking = false;
      const data = await res.json().catch(() => null) as { error?: string; message?: string } | null;
      const errorCode = data?.error ?? "";
      // Use a predictable sentinel so the provider router can fallback cleanly
      if (errorCode === "tts_cap_reached" || res.status === 429) {
        throw new Error("tts_cap_reached");
      }
      throw new Error(data?.message ?? (errorCode || `ElevenLabs error ${res.status}`));
    }

    if (!res.body) {
      this._speaking = false;
      throw new Error("ElevenLabs returned an empty body");
    }

    const audio = new Audio();
    audio.volume = options.volume ?? 1.0;
    audio.playbackRate = playbackCompensation;
    // When playbackRate ≠ 1, the browser otherwise resamples naively and the
    // voice sounds chipmunked (>1) or underwater (<1). preservesPitch keeps
    // the voice on-pitch while still changing tempo. Older Safari/Firefox
    // shipped vendor-prefixed names — set them too for back-compat.
    audio.preservesPitch = true;
    const audioWithVendorPrefixes = audio as HTMLAudioElement & {
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    audioWithVendorPrefixes.mozPreservesPitch = true;
    audioWithVendorPrefixes.webkitPreservesPitch = true;

    this.audio = audio;
    this._speaking = true;

    if (supportsMseMpeg()) {
      return this.streamViaMse(audio, res.body, options);
    }
    return this.playViaBlob(audio, res, options);
  }

  /**
   * Pipe a streaming Response body into a MediaSource so the audio element
   * can start playback before the full clip downloads. Used everywhere except
   * iOS Safari (see supportsMseMpeg).
   */
  private streamViaMse(
    audio: HTMLAudioElement,
    body: ReadableStream<Uint8Array>,
    options: TTSOptions,
  ): Promise<void> {
    const mediaSource = new MediaSource();
    const url = URL.createObjectURL(mediaSource);
    audio.src = url;

    return new Promise((resolve, reject) => {
      let revoked = false;
      const revoke = () => {
        if (revoked) return;
        revoked = true;
        URL.revokeObjectURL(url);
      };

      audio.onended = () => {
        this._speaking = false;
        this._paused = false;
        revoke();
        options.onEnd?.();
        resolve();
      };
      audio.onerror = () => {
        this._speaking = false;
        revoke();
        reject(new Error("Audio playback failed"));
      };

      mediaSource.addEventListener("sourceopen", async () => {
        let sb: SourceBuffer;
        try {
          sb = mediaSource.addSourceBuffer("audio/mpeg");
        } catch (err) {
          this._speaking = false;
          revoke();
          reject(err instanceof Error ? err : new Error("addSourceBuffer failed"));
          return;
        }

        const reader = body.getReader();
        const appendChunk = (chunk: Uint8Array) =>
          new Promise<void>((res, rej) => {
            const onUpdate = () => {
              sb.removeEventListener("updateend", onUpdate);
              sb.removeEventListener("error", onError);
              res();
            };
            const onError = () => {
              sb.removeEventListener("updateend", onUpdate);
              sb.removeEventListener("error", onError);
              rej(new Error("SourceBuffer append failed"));
            };
            sb.addEventListener("updateend", onUpdate, { once: true });
            sb.addEventListener("error", onError, { once: true });
            try {
              sb.appendBuffer(chunk);
            } catch (err) {
              rej(err instanceof Error ? err : new Error("appendBuffer threw"));
            }
          });

        try {
          let started = false;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) await appendChunk(value);
            // Kick off playback after the first chunk lands so the user hears
            // audio as quickly as possible. Subsequent chunks just extend the
            // SourceBuffer the audio element is already reading from.
            if (!started) {
              started = true;
              audio.play().catch((err: unknown) => {
                this._speaking = false;
                revoke();
                reject(err);
              });
            }
          }
          if (mediaSource.readyState === "open") mediaSource.endOfStream();
        } catch (err) {
          this._speaking = false;
          revoke();
          reject(err instanceof Error ? err : new Error("Streaming failed"));
        }
      });
    });
  }

  /**
   * Fallback for runtimes that can't attach a MediaSource to an audio
   * element for audio/mpeg (notably iOS Safari): buffer the whole response
   * into a Blob and play it as a normal blob URL.
   */
  private async playViaBlob(
    audio: HTMLAudioElement,
    res: Response,
    options: TTSOptions,
  ): Promise<void> {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audio.src = url;

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        this._speaking = false;
        this._paused = false;
        URL.revokeObjectURL(url);
        options.onEnd?.();
        resolve();
      };
      audio.onerror = () => {
        this._speaking = false;
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch((err: unknown) => {
        this._speaking = false;
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    this._speaking = false;
    this._paused = false;
  }

  pause(): void {
    this.audio?.pause();
    this._paused = true;
  }

  resume(): void {
    void this.audio?.play();
    this._paused = false;
  }

  isSpeaking(): boolean {
    return this._speaking;
  }

  isPaused(): boolean {
    return this._paused;
  }
}
