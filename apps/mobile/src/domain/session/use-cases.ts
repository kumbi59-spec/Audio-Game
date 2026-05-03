import type { TranscriptEntry } from "@/session/store";

export function buildPlayerTranscript(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const NUMBER_WORD_TO_INDEX: Record<string, number> = {
  one: 0, two: 1, three: 2, four: 3, five: 4, six: 5, seven: 6, eight: 7, nine: 8,
  "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8,
};

export function parseChoiceCommand(text: string): number | null {
  const normalized = buildPlayerTranscript(text).toLowerCase();
  const matchedNumber = normalized.match(/^(?:choice\s*)?(one|two|three|four|five|six|seven|eight|nine|1|2|3|4|5|6|7|8|9)\b/i);
  if (!matchedNumber?.[1]) return null;
  return NUMBER_WORD_TO_INDEX[matchedNumber[1]] ?? null;
}

export function buildTranscriptPlainText(transcript: TranscriptEntry[]): string {
  return transcript.map((t) => `${t.role === "gm" ? "GM" : "You"}: ${t.text}`).join("\n\n");
}

export interface SessionState {
  pending: boolean;
  transcript: TranscriptEntry[];
}

export function optimisticPlayerEntry(state: SessionState, text: string): { next: SessionState; rollback: SessionState } {
  const clean = buildPlayerTranscript(text);
  return {
    rollback: state,
    next: {
      ...state,
      pending: true,
      transcript: [...state.transcript, { id: `${Date.now()}`, role: "player", text: clean, streaming: false }],
    },
  };
}

export function rollbackSession(_: SessionState, snapshot: SessionState): SessionState {
  return snapshot;
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts = 2, delayMs = 120): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}
