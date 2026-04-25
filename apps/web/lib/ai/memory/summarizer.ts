import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SUMMARY_MODEL =
  process.env["CLAUDE_SUMMARY_MODEL"] ?? "claude-haiku-4-5-20251001";

export interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
  turnNumber: number;
}

/**
 * Compresses a batch of old history entries into a compact summary paragraph.
 * The summary is prepended to the context window so the GM retains world-state
 * knowledge even after raw history has been trimmed.
 */
export async function summarizeHistory(
  entries: HistoryEntry[],
  existingSummary: string,
  worldName: string
): Promise<string> {
  if (entries.length === 0) return existingSummary;

  const historyText = entries
    .map((e) => `[${e.role === "user" ? "PLAYER" : "GM"}] ${e.content}`)
    .join("\n\n");

  const systemPrompt = `You are a concise story summarizer for an audio RPG called EchoQuest, set in ${worldName}.

Your job: compress the provided game history into a compact, factual summary paragraph (100-200 words).

The summary must preserve:
- Key decisions the player made and their outcomes
- NPCs met, their dispositions, and any promises made
- Locations visited
- Items acquired or lost
- Quests started or completed
- World flags changed (gates opened/locked, people killed or saved, etc.)
- Any narrative turning points

Write in past tense, third-person ("the player discovered…").
Do not include flavour prose — only game-relevant facts.
${existingSummary ? `\nPrevious summary to extend:\n${existingSummary}` : ""}`;

  const response = await client.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Summarize the following game history:\n\n${historyText}`,
      },
    ],
  });

  const text = response.content[0];
  if (text.type !== "text") return existingSummary;
  return text.text.trim();
}

export const SUMMARIZE_THRESHOLD = 40;
export const ENTRIES_TO_COMPRESS = 20;
