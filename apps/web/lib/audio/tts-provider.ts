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
  const resolvedOpts: TTSOptions = {
    rate: options.rate ?? state.ttsSpeed,
    pitch: options.pitch ?? state.ttsPitch,
    volume: options.volume ?? state.volume,
    voiceId: options.voiceId ?? state.ttsVoiceId,
    ...(options.onEnd ? { onEnd: options.onEnd } : {}),
    ...(options.onBoundary ? { onBoundary: options.onBoundary } : {}),
  };

  try {
    return await instanceFor(state.ttsProvider).speak(text, resolvedOpts);
  } catch (err) {
    // Monthly ElevenLabs cap hit — switch to browser TTS permanently and re-speak
    if (err instanceof Error && err.message === "tts_cap_reached") {
      useAudioStore.getState().setTTSProvider("browser");
      return instanceFor("browser").speak(text, { ...resolvedOpts, voiceId: undefined });
    }
    throw err;
  }
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

/**
 * True when TTS is the active audio narration channel — i.e. the user has
 * not muted volume to zero. When false, screen reader live regions should
 * carry messages instead so blind users still hear them.
 */
export function isTTSAudible(): boolean {
  return useAudioStore.getState().volume > 0;
}
