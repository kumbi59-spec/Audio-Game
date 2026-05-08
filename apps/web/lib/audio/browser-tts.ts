import type { TTSOptions, TTSVoice, TTSProvider } from "@/types/audio";

// Chrome's speechSynthesis.cancel() is asynchronous; calling speak() in the
// same tick drops the new utterance ~10% of the time. Wait one tick first.
const CANCEL_GRACE_MS = 50;

// Chrome stops speaking after ~15s of continuous output (long-utterance bug).
// Pinging pause/resume below the threshold keeps the engine alive.
const KEEPALIVE_INTERVAL_MS = 10_000;

export class BrowserTTS implements TTSProvider {
  private utterance: SpeechSynthesisUtterance | null = null;
  private _speaking = false;
  private _paused = false;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices(): TTSVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices().map((v) => ({
      id: v.voiceURI,
      name: v.name,
      lang: v.lang,
      provider: "browser" as const,
    }));
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported()) return;
    this.stop();
    // Give Chrome's async cancel() a tick to settle before queueing the next
    // utterance, otherwise the speak() call is occasionally dropped.
    await new Promise((r) => setTimeout(r, CANCEL_GRACE_MS));

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      if (options.voiceId) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.voiceURI === options.voiceId);
        if (voice) utterance.voice = voice;
      }

      if (options.onBoundary) {
        utterance.onboundary = (e) =>
          options.onBoundary!(e.charIndex, e.charLength ?? 1);
      }

      const cleanup = () => {
        this._speaking = false;
        this._paused = false;
        if (this.keepaliveTimer !== null) {
          clearInterval(this.keepaliveTimer);
          this.keepaliveTimer = null;
        }
      };

      utterance.onend = () => {
        cleanup();
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = () => {
        cleanup();
        resolve();
      };

      this.utterance = utterance;
      this._speaking = true;
      this._paused = false;

      window.speechSynthesis.speak(utterance);

      // Long-utterance keepalive — pause/resume below Chrome's 15s cutoff
      // keeps the synthesis engine running. Cheap enough to leave on for
      // every utterance.
      this.keepaliveTimer = setInterval(() => {
        if (!this._speaking || this._paused) return;
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } catch {
          // Some embedded browsers throw on pause/resume — ignore.
        }
      }, KEEPALIVE_INTERVAL_MS);
    });
  }

  stop(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
    this._speaking = false;
    this._paused = false;
    this.utterance = null;
    if (this.keepaliveTimer !== null) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  pause(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.pause();
    this._paused = true;
  }

  resume(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.resume();
    this._paused = false;
  }

  isSpeaking(): boolean {
    return this._speaking;
  }

  isPaused(): boolean {
    return this._paused;
  }
}
