import type { TTSOptions, TTSVoice, TTSProvider } from "@/types/audio";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const TTS_PROXY = "/api/game/tts";

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

    try {
      const res = await fetch(TTS_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: options.voiceId ?? DEFAULT_VOICE_ID,
          speed: options.rate ?? 1.0,
        }),
      });

      if (!res.ok) throw new Error(`TTS proxy error ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const audio = new Audio(url);
        audio.volume = options.volume ?? 1.0;
        if (options.rate) audio.playbackRate = options.rate;

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
          resolve();
        };

        this.audio = audio;
        this._speaking = true;
        void audio.play();
      });
    } catch {
      this._speaking = false;
    }
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
