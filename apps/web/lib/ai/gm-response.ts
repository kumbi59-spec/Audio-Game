import type { GMResponse } from "@/types/game";
import { stripEmDashes } from "./style";

/** Choices offered when the GM's reply couldn't be read. */
export const UNREADABLE_REPLY_CHOICES = [
  "Keep going",
  "Take a slow look around",
  "Something else: tell me what you do",
];

// Parse the GM's JSON response, tolerating markdown code fences
export function parseGMResponse(raw: string): GMResponse {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as GMResponse;
    return {
      narration: stripEmDashes(parsed.narration ?? ""),
      choices: Array.isArray(parsed.choices)
        ? parsed.choices.filter((c): c is string => typeof c === "string").map(stripEmDashes)
        : [],
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
      narration: stripEmDashes(extracted ?? raw),
      choices: [...UNREADABLE_REPLY_CHOICES],
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
      return decodeJsonString(text.slice(start, i));
    }
    i += 1;
  }
  // Truncated mid-value: return what we have up to the cut so the player still
  // sees the prose Claude managed to emit, minus the trailing JSON tail. An
  // escape cut in half (an odd run of backslashes, maybe with part of \uXXXX)
  // is dropped first.
  const tail = text.slice(start);
  const cutEscape = /(\\+)(u[0-9a-fA-F]{0,3})?$/.exec(tail);
  const complete =
    cutEscape && cutEscape[1]!.length % 2 === 1 ? tail.slice(0, cutEscape.index + cutEscape[1]!.length - 1) : tail;
  return decodeJsonString(complete);
}

/** Decodes the body of a JSON string literal, escapes and all. */
function decodeJsonString(body: string): string {
  try {
    return JSON.parse(`"${body}"`) as string;
  } catch {
    // A raw control character or a broken escape: decode the common ones by
    // hand, in one pass so "\\\"" can't be misread.
    return body.replace(/\\(["\\/bfnrt]|u[0-9a-fA-F]{4})/g, (_, esc: string) => {
      if (esc.startsWith("u")) return String.fromCharCode(Number.parseInt(esc.slice(1), 16));
      return ({ b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" } as Record<string, string>)[esc] ?? esc;
    });
  }
}

/**
 * Stored assistant turns are the GM's raw JSON. For summarising, only the
 * prose matters; the choices and state-change blocks are noise that costs
 * tokens. Falls back to the raw text when it isn't GM JSON.
 */
export function narrationFromStoredTurn(content: string): string {
  return extractNarrationField(content) ?? content;
}
