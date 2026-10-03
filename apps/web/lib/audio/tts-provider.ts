import type { TTSProvider as ITTSProvider, TTSOptions, TTSVoice, TTSProviderType } from "@/types/audio";
import { BrowserTTS } from "./browser-tts";
import { ElevenLabsTTS, TtsRequestError } from "./elevenlabs-tts";
import { useAudioStore } from "@/store/audio-store";

const instances: Partial<Record<TTSProviderType, ITTSProvider>> = {};

// Narrations in progress. Each has its own token, so a narration that ends
// late (a clip that finished after stopSpeech()) can't end the one that
// replaced it.
const _sessions = new Set<symbol>();

/**
 * Mark the start of a multi-segment narration. Keeps isSpeaking() true
 * across the per-voice HTTP gaps so consumers (ambient ducking, choice
 * focus) don't see a false "narration ended" pulse between segments.
 * Returns the function that ends it; calling that twice is harmless.
 */
export function openNarrationSession(): () => void {
  const token = Symbol("narration");
  _sessions.add(token);
  return () => {
    _sessions.delete(token);
  };
}

type TtsNoticeListener = (message: string) => void;
const _noticeListeners = new Set<TtsNoticeListener>();

/**
 * Subscribe to messages the player should hear about the narrator itself,
 * such as premium narration falling back to the browser voice. Returns the
 * unsubscribe function.
 */
export function onTtsNotice(listener: TtsNoticeListener): () => void {
  _noticeListeners.add(listener);
  return () => {
    _noticeListeners.delete(listener);
  };
}

function notice(message: string): void {
  for (const listener of _noticeListeners) listener(message);
}

// The "premium voice isn't answering" notice is said once per page, not per sentence.
let _toldAboutFallback = false;

/**
 * Apply the same perceptual (squared) curve to the master volume that
 * sound-cues.ts uses, so narration loudness scales evenly with ambient
 * and cues across the slider's range. Anchored at 0 and 1.
 */
export function curvedVolume(linear: number): number {
  if (linear <= 0) return 0;
  if (linear >= 1) return 1;
  return linear * linear;
}

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

function resolveOptions(options: TTSOptions): TTSOptions {
  const state = useAudioStore.getState();
  return {
    rate: options.rate ?? state.ttsSpeed,
    pitch: options.pitch ?? state.ttsPitch,
    volume: options.volume ?? curvedVolume(state.volume),
    voiceId: options.voiceId ?? state.ttsVoiceId,
    ...(options.onEnd ? { onEnd: options.onEnd } : {}),
    ...(options.onBoundary ? { onBoundary: options.onBoundary } : {}),
  };
}

/**
 * Starts fetching audio for text that will be passed to speak() next with
 * the same options, so it plays without a network wait. A no-op for the
 * browser engine.
 */
export function prefetchSpeech(text: string, options: TTSOptions = {}): void {
  instanceFor(useAudioStore.getState().ttsProvider).prefetch?.(text, resolveOptions(options));
}

export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  const state = useAudioStore.getState();
  const resolvedOpts = resolveOptions(options);

  try {
    return await instanceFor(state.ttsProvider).speak(text, resolvedOpts);
  } catch (err) {
    if (state.ttsProvider !== "elevenlabs") throw err;
    const browserOpts = { ...resolvedOpts, voiceId: undefined };
    if (err instanceof TtsRequestError && (err.code === "tts_cap_reached" || err.code === "tts_plan_required")) {
      // Out of premium characters this month, or the plan lapsed: switch to
      // the browser voice for good, say why, and carry on with this line.
      useAudioStore.getState().setTTSProvider("browser");
      notice(
        err.code === "tts_cap_reached"
          ? "You've used this month's premium narration, so I'm switching to the browser voice."
          : "Premium narration needs a paid plan, so I'm switching to the browser voice.",
      );
      return instanceFor("browser").speak(text, browserOpts);
    }
    // Anything else (offline, a server hiccup, a clip that won't play):
    // read this line in the browser voice rather than skip it.
    if (!_toldAboutFallback) {
      _toldAboutFallback = true;
      notice("Premium narration isn't answering, so I'm using the browser voice for now.");
    }
    return instanceFor("browser").speak(text, browserOpts);
  }
}

/**
 * Like speak() but never auto-switches the provider on error. Use this for
 * settings-page previews so a failed ElevenLabs call doesn't permanently
 * change the user's provider selection.
 */
export async function speakPreview(text: string, options: TTSOptions = {}): Promise<void> {
  return instanceFor(useAudioStore.getState().ttsProvider).speak(text, resolveOptions(options));
}

// Bumped by every stopSpeech(). A narration made of several speak() calls
// (streamed sentences, voice groups) checks it between calls so a manual stop
// ends the whole narration, not just the sentence playing at the time.
let _stopCount = 0;

export function speechStopCount(): number {
  return _stopCount;
}

export function stopSpeech(): void {
  _stopCount++;
  // Stop all providers — switching mid-narration shouldn't leak audio.
  for (const inst of Object.values(instances)) {
    inst?.stop();
    inst?.clearPrefetched?.();
  }
  // Manual stop also tears down any in-flight narration session so its
  // speaking-state guard doesn't outlive the audio it was protecting.
  _sessions.clear();
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
  // Multi-voice narration makes one provider call per voice change with a
  // network gap in between. The provider's _speaking goes false in that gap
  // even though the narration as a whole is still going — without the session
  // guard, ambient ducking and choice focus bounce on every voice change.
  return _sessions.size > 0 || getTTSProvider().isSpeaking();
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
