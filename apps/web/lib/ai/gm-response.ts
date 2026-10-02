import type { GMResponse } from "@/types/game";

// Parse the GM's JSON response, tolerating markdown code fences
export function parseGMResponse(raw: string): GMResponse {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as GMResponse;
    return {
      narration: parsed.narration ?? "",
      choices: Array.isArray(parsed.choices) ? parsed.choices : [],
      soundCue: parsed.soundCue ?? null,
      stateChanges: parsed.stateChanges ?? undefined,
      npcAction: parsed.npcAction ?? null,
    };
  } catch {
    // Truncated / malformed JSON — most commonly hit when the model runs into
    // MAX_TOKENS or the stream is cut. Dumping `raw` as narration leaked the
    // entire response (including nested objects like npcAction) into the
    // player-visible text, and the dialogue parser then matched garbage like
    // `[npcId]: "village_doctor"` as a phantom NPC speaker — wildly bouncing
    // narrator voices. Extract just the narration field via regex if we can,
    // and only fall through to raw if even that fails.
    const extracted = extractNarrationField(cleaned);
    return {
      narration: extracted ?? raw,
      choices: ["Continue", "Look around", "Do something else"],
      soundCue: null,
    };
  }
}

/**
 * Pulls the value of the top-level "narration" key out of a malformed/truncated
 * JSON string. Handles escaped quotes inside the value. Returns null if the
 * key isn't found or its value can't be located. Best-effort, no fancy parser.
 */
export function extractNarrationField(text: string): string | null {
  const keyMatch = text.match(/"narration"\s*:\s*"/);
  if (!keyMatch) return null;
  const start = keyMatch.index! + keyMatch[0].length;
  let i = start;
  let escaped = false;
  while (i < text.length) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === '"') {
      // Unescape standard JSON sequences inside the field — \" \\ \n \r \t.
      // Anything more exotic (\uXXXX) is left literal; rare in narration prose.
      return text
        .slice(start, i)
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t");
    }
    i += 1;
  }
  // Truncated mid-value: return what we have up to the cut so the player still
  // sees the prose Claude managed to emit, minus the trailing JSON tail.
  return text
    .slice(start)
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

/**
 * Stored assistant turns are the GM's raw JSON. For summarising, only the
 * prose matters — the choices and state-change blocks are noise that costs
 * tokens. Falls back to the raw text when it isn't GM JSON.
 */
export function narrationFromStoredTurn(content: string): string {
  return extractNarrationField(content) ?? content;
}
