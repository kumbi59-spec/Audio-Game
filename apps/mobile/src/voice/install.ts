import { apiBaseUrl } from "@/api/config";
import { createDeepgramRecognizer } from "./deepgram";
import { createPlatformMicCapture } from "./micCapture";
import { setRecognizer } from "./stt";

/**
 * At app startup, ask the server whether Deepgram is configured and install
 * the real recognizer if it's up. The mic capture adapter is now real on
 * every supported platform (web via AudioWorklet, iOS + Android via
 * @siteed/expo-audio-stream). Without server credentials we keep the
 * mock recognizer so existing tests and typed-input flows keep working.
 */
export async function installSpeechRecognizer(): Promise<void> {
  // Static form so babel-preset-expo inlines it at build time.
  const deepgramFlag = process.env.EXPO_PUBLIC_ENABLE_DEEPGRAM;
  if (deepgramFlag === "false") return;
  try {
    // The status probe mints nothing, so it doesn't spend the per-IP mint
    // budget before the first utterance. createDeepgramRecognizer mints a
    // fresh token on each start().
    const res = await fetch(`${apiBaseUrl()}/stt/status`);
    if (!res.ok) return;
    const status = (await res.json()) as { available?: boolean };
    if (status.available !== true) return;
    setRecognizer(createDeepgramRecognizer(createPlatformMicCapture()));
  } catch {
    /* fall back to the mock recognizer */
  }
}
