import type { TTSOptions, TTSVoice, TTSProvider } from "@/types/audio";

export class BrowserTTS implements TTSProvider {
  private utterance: SpeechSynthesisUtterance | null = null;
  private _speaking = false;
  private _paused = false;

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

      utterance.onend = () => {
        this._speaking = false;
        this._paused = false;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = () => {
        this._speaking = false;
        this._paused = false;
        resolve();
      };

      this.utterance = utterance;
      this._speaking = true;
      this._paused = false;

      // Chrome bug: cancel first to ensure fresh state
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
    this._speaking = false;
    this._paused = false;
    this.utterance = null;
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
