import Anthropic from "@anthropic-ai/sdk";
import { narrationFromStoredTurn } from "../gm-response";

const client = new Anthropic();

const SUMMARY_MODEL =
  process.env["CLAUDE_SUMMARY_MODEL"] ?? "claude-haiku-4-5-20251001";

/**
 * A summary that doesn't come back in this long is given up on, with no
 * retry: nothing is marked summarised, so a later turn tries again. Without
 * it the SDK default (minutes, with retries) holds the request open.
 */
export const SUMMARY_TIMEOUT_MS = 20_000;

export interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
  turnNumber: number;
}

export async function summarizeHistory(
  entries: HistoryEntry[],
  existingSummary: string,
  worldName: string
): Promise<string> {
  if (entries.length === 0) return existingSummary;

  const historyText = entries
    .map((e) =>
      e.role === "user"
        ? `[PLAYER] ${e.content}`
        // Assistant turns are stored as the GM's raw JSON; only the prose
        // carries story facts worth summarising.
        : `[GM] ${narrationFromStoredTurn(e.content)}`
    )
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
  }, { timeout: SUMMARY_TIMEOUT_MS, maxRetries: 0 });

  const text = response.content[0];
  if (text.type !== "text") return existingSummary;
  return text.text.trim();
}

/**
 * Summarise once at least this many turns sit beyond the summarised-through
 * marker. Recent turns stay out of the summary because the client still sends
 * them verbatim as history.
 */
export const SUMMARIZE_AFTER_TURNS = 20;
/** Turns folded into the summary per run. */
export const TURNS_PER_SUMMARY = 10;
