import type { TTSProvider as ITTSProvider, TTSOptions, TTSVoice } from "@/types/audio";
import { BrowserTTS } from "./browser-tts";

let _provider: ITTSProvider | null = null;

export function getTTSProvider(): ITTSProvider {
  if (!_provider) {
    _provider = new BrowserTTS();
  }
  return _provider;
}

export async function speak(text: string, options?: TTSOptions): Promise<void> {
  return getTTSProvider().speak(text, options);
}

export function stopSpeech(): void {
  getTTSProvider().stop();
}

export function pauseSpeech(): void {
  getTTSProvider().pause();
}

export function resumeSpeech(): void {
  getTTSProvider().resume();
}

export function getVoices(): TTSVoice[] {
  return getTTSProvider().getVoices();
}

export function isSpeaking(): boolean {
  return getTTSProvider().isSpeaking();
}

export function isPaused(): boolean {
  return getTTSProvider().isPaused();
}
