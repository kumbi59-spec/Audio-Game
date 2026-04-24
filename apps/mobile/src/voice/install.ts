import { apiBaseUrl } from "@/api/config";
import { createDeepgramRecognizer } from "./deepgram";
import { createPlatformMicCapture } from "./micCapture";
import { setRecognizer } from "./stt";

declare const process: { env: Record<string, string | undefined> };

/**
 * At app startup, probe the server for Deepgram availability and install
 * the real recognizer if it's up. The mic capture adapter is now real on
 * every supported platform (web via AudioWorklet, iOS + Android via
 * @siteed/expo-audio-stream). Without server credentials we keep the
 * mock recognizer so existing tests and typed-input flows keep working.
 */
export async function installSpeechRecognizer(): Promise<void> {
  if (process.env["EXPO_PUBLIC_ENABLE_DEEPGRAM"] === "false") return;
  try {
    const res = await fetch(`${apiBaseUrl()}/stt/token`, { method: "POST" });
    if (res.status === 503) return;
    if (!res.ok) return;
    // Token is minted; we discard this one — createDeepgramRecognizer mints
    // a fresh one each start() so we don't leak long-lived tokens across
    // sessions.
    void res.body?.cancel?.();
    setRecognizer(createDeepgramRecognizer(createPlatformMicCapture()));
  } catch {
    /* fall back to the mock recognizer */
  }
}
