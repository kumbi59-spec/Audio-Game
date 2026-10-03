import type { TTSOptions, TTSVoice, TTSProvider } from "@/types/audio";
import { ELEVENLABS_PRESET_VOICES, DEFAULT_ELEVENLABS_VOICE_ID } from "./voices-catalog";
import { narrationAudioElement } from "./unlock";

const DEFAULT_VOICE_ID = DEFAULT_ELEVENLABS_VOICE_ID;
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

/**
 * Fetch wrapper that retries once on transient failures (network errors,
 * 502/503/504). Doesn't retry on 4xx client errors or the cap-reached
 * sentinel — those are deterministic and need different handling upstream.
 */
async function fetchWithRetry(input: RequestInfo, init: RequestInit): Promise<Response> {
  const attempt = async (): Promise<Response> => {
    return fetch(input, init);
  };
  try {
    const res = await attempt();
    if (res.status >= 502 && res.status <= 504) {
      await new Promise((r) => setTimeout(r, 250));
      return attempt();
    }
    return res;
  } catch (err) {
    // Network-level failure (DNS, offline, aborted by browser, etc.)
    await new Promise((r) => setTimeout(r, 250));
    try {
      return await attempt();
    } catch {
      throw err;
    }
  }
}

/** At most this many clips are fetched ahead of playback. */
const MAX_PREFETCHED = 3;

interface TtsRequest {
  body: string;
  playbackCompensation: number;
}

function buildRequest(text: string, options: TTSOptions): TtsRequest {
  const requestedRate = options.rate ?? 1.0;
  const apiSpeed = Math.max(ELEVENLABS_SPEED_MIN, Math.min(ELEVENLABS_SPEED_MAX, requestedRate));
  return {
    // "" is the picker's "Default" voice; `||` so it doesn't reach the server.
    body: JSON.stringify({ text, voiceId: options.voiceId || DEFAULT_VOICE_ID, speed: apiSpeed }),
    // The server clamps to the same range; keeping the math here lets us
    // compute the exact playbackRate compensation the client should apply.
    playbackCompensation: requestedRate / apiSpeed,
  };
}

function requestAudio(body: string, signal?: AbortSignal): Promise<Response> {
  return fetchWithRetry(TTS_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal,
  });
}

/**
 * The server's reason for a failed clip, as an error the provider router
 * (tts-provider.ts) can act on: "tts_cap_reached" and "tts_plan_required"
 * switch the player to the browser voice for good, anything else for one
 * segment.
 */
export class TtsRequestError extends Error {
  constructor(
    readonly code: "tts_cap_reached" | "tts_plan_required" | "tts_failed",
    message: string,
  ) {
    super(code);
    this.detail = message;
  }
  readonly detail: string;
}

export class ElevenLabsTTS implements TTSProvider {
  private audio: HTMLAudioElement | null = null;
  private _speaking = false;
  private _paused = false;
  // Bumped by stop(). A speak() whose request was still in flight when it was
  // stopped must not start playing once the response arrives.
  private generation = 0;
  // Request body → response, for clips fetched ahead of playback.
  private prefetched = new Map<string, { response: Promise<Response>; abort: AbortController }>();
  // Ends the clip that's playing (or about to), resolving its speak() call.
  private settle: (() => void) | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  prefetch(text: string, options: TTSOptions = {}): void {
    if (!this.isSupported() || !text.trim()) return;
    const { body } = buildRequest(text, options);
    if (this.prefetched.has(body)) return;
    while (this.prefetched.size >= MAX_PREFETCHED) {
      const oldest = this.prefetched.keys().next().value as string;
      this.discard(oldest);
    }
    const abort = new AbortController();
    const response = requestAudio(body, abort.signal);
    // Nobody may ever await it; don't let a failure surface as unhandled.
    response.catch(() => undefined);
    this.prefetched.set(body, { response, abort });
  }

  clearPrefetched(): void {
    for (const key of [...this.prefetched.keys()]) this.discard(key);
  }

  private discard(key: string): void {
    const pending = this.prefetched.get(key);
    this.prefetched.delete(key);
    if (!pending) return;
    // Abort the request if it's still going (the server stops the upstream
    // synthesis too), and release the unread stream if it already arrived.
    pending.abort.abort();
    pending.response.then((res) => res.body?.cancel()).catch(() => undefined);
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && typeof Audio !== "undefined";
  }

  getVoices(): TTSVoice[] {
    return ELEVENLABS_PRESET_VOICES;
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported()) return;
    // A pause between two sentences holds: the next clip loads but waits
    // for resume() instead of playing.
    this.halt();
    const gen = this.generation;

    const { body, playbackCompensation } = buildRequest(text, options);
    const prefetched = this.prefetched.get(body);
    this.prefetched.delete(body);
    let res: Response;
    try {
      res = await (prefetched?.response ?? requestAudio(body));
    } catch (err) {
      if (gen !== this.generation) return;
      throw new TtsRequestError("tts_failed", err instanceof Error ? err.message : "Network error");
    }

    if (gen !== this.generation) {
      // Stopped (or superseded) while the request was in flight.
      res.body?.cancel().catch(() => undefined);
      return;
    }

    if (!res.ok) {
      this._speaking = false;
      const data = await res.json().catch(() => null) as { error?: string; message?: string } | null;
      const errorCode = data?.error ?? "";
      const message = data?.message ?? (errorCode || `ElevenLabs error ${res.status}`);
      // Predictable codes so the provider router can fall back cleanly.
      if (errorCode === "tts_cap_reached" || res.status === 429) {
        throw new TtsRequestError("tts_cap_reached", message);
      }
      if (res.status === 403) throw new TtsRequestError("tts_plan_required", message);
      throw new TtsRequestError("tts_failed", message);
    }

    if (!res.body) {
      this._speaking = false;
      throw new Error("ElevenLabs returned an empty body");
    }

    // One shared element: iOS Safari unlocks elements individually, and this
    // one was unlocked by the first tap (AudioUnlocker).
    const audio = narrationAudioElement();
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
      return this.streamViaMse(audio, res.body, options, gen);
    }
    return this.playViaBlob(audio, res, options, gen);
  }

  /** Starts playback unless the player paused in the meantime (resume() starts it then). */
  private start(audio: HTMLAudioElement, fail: (err: unknown) => void): void {
    if (this._paused) return;
    audio.play().catch(fail);
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
    gen: number,
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
      this.settle = () => {
        revoke();
        resolve();
      };

      audio.onended = () => {
        this._speaking = false;
        this._paused = false;
        this.settle = null;
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

        if (gen !== this.generation) {
          body.cancel().catch(() => undefined);
          return;
        }
        const reader = body.getReader();
        this.reader = reader;
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
            if (gen !== this.generation) return;
            if (!started) {
              started = true;
              this.start(audio, (err: unknown) => {
                this._speaking = false;
                revoke();
                reject(err);
              });
            }
          }
          if (mediaSource.readyState === "open") mediaSource.endOfStream();
        } catch (err) {
          // stop() cancels the reader; that isn't a failure.
          if (gen !== this.generation) return;
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
    gen: number,
  ): Promise<void> {
    const blob = await res.blob();
    // Stopped while the clip downloaded: playing it now would talk over
    // whatever came next, with nothing left that could stop it.
    if (gen !== this.generation) return;
    const url = URL.createObjectURL(blob);
    audio.src = url;

    return new Promise((resolve, reject) => {
      this.settle = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onended = () => {
        this._speaking = false;
        this._paused = false;
        this.settle = null;
        URL.revokeObjectURL(url);
        options.onEnd?.();
        resolve();
      };
      audio.onerror = () => {
        this._speaking = false;
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback failed"));
      };
      this.start(audio, (err: unknown) => {
        this._speaking = false;
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
  }

  /**
   * Ends the current clip and resolves its speak() call, as if it had
   * finished. Keeps the paused state, so a pause between sentences holds.
   */
  private halt(): void {
    this.generation++;
    const audio = this.audio;
    this.audio = null;
    if (audio) {
      // Detach first: clearing the source fires "error", which isn't one.
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    this.reader?.cancel().catch(() => undefined);
    this.reader = null;
    const settle = this.settle;
    this.settle = null;
    settle?.();
    this._speaking = false;
  }

  stop(): void {
    this.halt();
    this._paused = false;
  }

  pause(): void {
    this.audio?.pause();
    this._paused = true;
  }

  resume(): void {
    this._paused = false;
    this.audio?.play().catch(() => undefined);
  }

  isSpeaking(): boolean {
    return this._speaking;
  }

  isPaused(): boolean {
    return this._paused;
  }
}
