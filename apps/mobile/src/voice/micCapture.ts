import type { MicCapture } from "./deepgram";

/**
 * Platform mic capture adapter. The app's end-to-end STT path expects
 * linear16 PCM at 16 kHz. We ship a stub that throws a clear, actionable
 * error so we never silently record. Real implementations slot in per
 * platform:
 *
 *   - native: expo-av Recording with a PCM preset (Phase 3 polish)
 *   - web:    getUserMedia + AudioWorklet → 16 kHz PCM via resampling
 *
 * Until those are in place, the STT hook falls back to the mock recognizer,
 * so the Active Campaign screen still exercises the choice-pick and
 * freeform-action paths via typed input.
 */
export function createPlatformMicCapture(): MicCapture {
  return {
    async start() {
      throw new Error(
        "Platform mic capture not yet wired. Set EXPO_PUBLIC_ENABLE_DEEPGRAM=false or implement createPlatformMicCapture for this platform.",
      );
    },
    async stop() {
      /* no-op */
    },
  };
}
