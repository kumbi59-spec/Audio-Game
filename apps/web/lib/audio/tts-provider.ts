import type { TTSProvider as ITTSProvider, TTSOptions, TTSVoice, TTSProviderType } from "@/types/audio";
import { BrowserTTS } from "./browser-tts";
import { ElevenLabsTTS } from "./elevenlabs-tts";
import { useAudioStore } from "@/store/audio-store";

const instances: Partial<Record<TTSProviderType, ITTSProvider>> = {};

function instanceFor(type: TTSProviderType): ITTSProvider {
  if (!instances[type]) {
    instances[type] = type === "elevenlabs" ? new ElevenLabsTTS() : new BrowserTTS();
  }
  return instances[type]!;
}

/**
 * Returns the provider currently selected in the audio store. Override
 * by passing `forceProvider` (used by the settings page preview button
 * so users can audition a voice without first switching their default).
 */
export function getTTSProvider(forceProvider?: TTSProviderType): ITTSProvider {
  const type = forceProvider ?? useAudioStore.getState().ttsProvider;
  return instanceFor(type);
}

export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  const state = useAudioStore.getState();
  const provider = instanceFor(state.ttsProvider);
  return provider.speak(text, {
    rate: options.rate ?? state.ttsSpeed,
    pitch: options.pitch ?? state.ttsPitch,
    volume: options.volume ?? state.volume,
    voiceId: options.voiceId ?? state.ttsVoiceId,
    ...(options.onEnd ? { onEnd: options.onEnd } : {}),
    ...(options.onBoundary ? { onBoundary: options.onBoundary } : {}),
  });
}

export function stopSpeech(): void {
  // Stop all providers — switching mid-narration shouldn't leak audio.
  for (const inst of Object.values(instances)) inst?.stop();
}

export function pauseSpeech(): void {
  getTTSProvider().pause();
}

export function resumeSpeech(): void {
  getTTSProvider().resume();
}

export function getVoices(provider?: TTSProviderType): TTSVoice[] {
  return instanceFor(provider ?? useAudioStore.getState().ttsProvider).getVoices();
}

export function isSpeaking(): boolean {
  return getTTSProvider().isSpeaking();
}

export function isPaused(): boolean {
  return getTTSProvider().isPaused();
}
