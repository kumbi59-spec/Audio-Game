import type { TranscriptEntry } from "@/session/store";

export function buildPlayerTranscript(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const NUMBER_WORD_TO_INDEX: Record<string, number> = {
  one: 0,
  two: 1,
  three: 2,
  four: 3,
  five: 4,
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  "5": 4,
};

export function parseChoiceCommand(text: string): number | null {
  const normalized = buildPlayerTranscript(text).toLowerCase();
  const matchedNumber = normalized.match(/^(?:choice\s*)?(one|two|three|four|five|1|2|3|4|5)\b/i);
  if (!matchedNumber?.[1]) return null;
  return NUMBER_WORD_TO_INDEX[matchedNumber[1]] ?? null;
}

export function buildTranscriptPlainText(transcript: TranscriptEntry[]): string {
  return transcript.map((t) => `${t.role === "gm" ? "GM" : "You"}: ${t.text}`).join("\n\n");
}
