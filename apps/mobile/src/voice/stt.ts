import { dispatchTranscript } from "./commandBus";

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
}

let active: SpeechRecognizer = createMockRecognizer();

export function setRecognizer(recognizer: SpeechRecognizer): void {
  active = recognizer;
}

export function getRecognizer(): SpeechRecognizer {
  return active;
}

/**
 * Convenience: start, await stop, and route the transcript through the
 * command bus. Returns the recognized transcript (or null if cancelled).
 */
export async function captureUtterance(): Promise<string | null> {
  await active.start();
  const transcript = await active.stop();
  if (transcript) {
    await dispatchTranscript(transcript);
  }
  return transcript;
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
