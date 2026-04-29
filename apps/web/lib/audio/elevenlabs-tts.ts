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

    const res = await fetch(TTS_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceId: options.voiceId ?? DEFAULT_VOICE_ID,
        speed: options.rate ?? 1.0,
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

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
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
        reject(new Error("Audio playback failed"));
      };

      this.audio = audio;
      this._speaking = true;
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
