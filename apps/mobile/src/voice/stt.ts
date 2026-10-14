/**
 * Pluggable speech-to-text. Production wires the Deepgram streaming
 * recognizer for low latency; web falls back to Web Speech API; tests
 * use the mock recognizer to inject transcripts directly. The interface
 * is intentionally small so the rest of the app never depends on a
 * specific provider.
 */
export interface SpeechRecognizer {
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  isListening: () => boolean;
  /**
   * Resolves once the player has finished an utterance, or after maxMs.
   * Streaming recognizers implement it so capture doesn't stop before the
   * player speaks; recognizers without it are stopped right away.
   */
  waitForUtterance?: (maxMs: number) => Promise<void>;
}

/** Longest a single capture listens for before it stops on its own. */
export const UTTERANCE_MAX_MS = 10_000;

let active: SpeechRecognizer = createMockRecognizer();
let cancelActiveCapture: (() => void) | null = null;

export function setRecognizer(recognizer: SpeechRecognizer): void {
  active = recognizer;
}

export function getRecognizer(): SpeechRecognizer {
  return active;
}

/**
 * Convenience: start, wait for the player to finish speaking, and stop.
 * Returns the recognized transcript, or null when nothing was heard, the
 * capture was cancelled, or the recognizer failed (missing token, socket
 * error, mic permission). Routing the text is up to the caller; screens
 * pass exact command phrases to the command bus themselves.
 */
export async function captureUtterance(): Promise<string | null> {
  const recognizer = active;
  const capture = { cancelled: false };
  const cancelRequested = new Promise<void>((resolve) => {
    cancelActiveCapture = () => {
      capture.cancelled = true;
      resolve();
    };
  });
  const cancel = cancelActiveCapture;
  try {
    await recognizer.start();
    if (!capture.cancelled && recognizer.waitForUtterance) {
      await Promise.race([recognizer.waitForUtterance(UTTERANCE_MAX_MS), cancelRequested]);
    }
    const transcript = await recognizer.stop();
    return capture.cancelled ? null : transcript;
  } catch (err) {
    if (__DEV__) console.warn("Speech capture failed", err);
    await recognizer.stop().catch(() => null);
    return null;
  } finally {
    if (cancelActiveCapture === cancel) cancelActiveCapture = null;
  }
}

/** Ends the capture in progress, if any; its captureUtterance returns null. */
export function cancelUtterance(): void {
  cancelActiveCapture?.();
}

function createMockRecognizer(): SpeechRecognizer {
  let listening = false;
  let pendingTranscript: string | null = null;
  return {
    async start() {
      listening = true;
      pendingTranscript = null;
    },
    async stop() {
      listening = false;
      const t = pendingTranscript;
      pendingTranscript = null;
      return t;
    },
    isListening() {
      return listening;
    },
  };
}

/**
 * Test seam: drive the mock recognizer from a test by injecting a
 * transcript that the next stop() call will return.
 */
export function __injectMockTranscript(text: string): void {
  // Replace whatever recognizer is active with a transcript-returning mock.
  setRecognizer({
    async start() {
      /* no-op */
    },
    async stop() {
      return text;
    },
    isListening() {
      return false;
    },
  });
}
