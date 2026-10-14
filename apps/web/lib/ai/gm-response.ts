import type { GMResponse } from "@/types/game";
import { stripEmDashes } from "./style";

/** Choices offered when the GM's reply couldn't be read. */
export const UNREADABLE_REPLY_CHOICES = [
  "Keep going",
  "Take a slow look around",
  "Something else: tell me what you do",
];

/**
 * Out-of-character notes the GM sometimes slips into the narration, like
 * "(GM aside: the sheet still lists you in the lab.)". The prompt forbids
 * them; this catches the ones that get through so they never reach the story
 * log, the save or the next turn's history.
 */
const OOC_NOTE_RE =
  /\s*\((?:\s*)(?:GM\b|Game\s*Master\b|OOC\b|Out[\s-]of[\s-]character\b|Table\s*talk\b|Note to (?:the )?player\b)[^()]*\)/gi;
const OOC_LINE_RE =
  /^[ \t]*(?:GM (?:aside|note)|Game Master(?:'s)? note|OOC|Out[\s-]of[\s-]character)\s*:.*$/gim;

/**
 * Drops parenthetical out-of-character notes from a stored GM reply (its raw
 * JSON), so an old note in the history doesn't teach the GM to write more.
 */
export function stripOutOfCharacterParentheticals(raw: string): string {
  return raw.replace(OOC_NOTE_RE, "");
}

export function stripOutOfCharacterNotes(text: string): string {
  const stripped = text.replace(OOC_NOTE_RE, "").replace(OOC_LINE_RE, "");
  if (stripped === text) return text;
  return stripped
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tryParseObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Keys a reply sometimes uses for its choices instead of "choices". */
const CHOICE_KEYS = ["choices", "options", "actions", "suggestedActions", "nextActions"] as const;

/**
 * Choice labels from whatever shape the GM wrote them in: plain strings, or
 * objects like {"label": "..."} or {"text": "..."}.
 */
function choiceLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((c) => {
      if (typeof c === "string") return c;
      if (c && typeof c === "object") {
        const o = c as Record<string, unknown>;
        const label = o.label ?? o.text ?? o.choice ?? o.action ?? o.title;
        return typeof label === "string" ? label : "";
      }
      return "";
    })
    .map((c) => c.trim())
    .filter((c) => c !== "")
    .map(stripEmDashes);
}

function toResponse(parsed: Record<string, unknown>): GMResponse {
  const choiceKey = CHOICE_KEYS.find((k) => choiceLabels(parsed[k]).length > 0);
  return {
    narration: stripOutOfCharacterNotes(stripEmDashes(typeof parsed.narration === "string" ? parsed.narration : "")),
    choices: choiceKey ? choiceLabels(parsed[choiceKey]) : [],
    soundCue: typeof parsed.soundCue === "string" ? parsed.soundCue : null,
    stateChanges:
      parsed.stateChanges && typeof parsed.stateChanges === "object"
        ? (parsed.stateChanges as GMResponse["stateChanges"])
        : undefined,
    npcAction:
      parsed.npcAction && typeof parsed.npcAction === "object" ? (parsed.npcAction as GMResponse["npcAction"]) : null,
  };
}

/**
 * Escapes raw newlines and tabs inside JSON strings. The GM often writes its
 * paragraph breaks as real line breaks, which JSON.parse rejects.
 */
function escapeControlCharsInStrings(text: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      else if (ch === "\n") { out += "\\n"; continue; }
      else if (ch === "\r") { out += "\\r"; continue; }
      else if (ch === "\t") { out += "\\t"; continue; }
    } else if (ch === '"') {
      inString = true;
    }
    out += ch;
  }
  return out;
}

export interface ParsedGMReply {
  reply: GMResponse;
  /** The whole reply was valid JSON (after light repair). */
  wellFormed: boolean;
  /** The reply carried no usable choices of its own. */
  missingChoices: boolean;
}

/**
 * Parses the GM's JSON reply, tolerating code fences, prose around the JSON,
 * raw line breaks inside strings and a reply cut off part way through.
 */
export function parseGMReply(raw: string): ParsedGMReply {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  const body = first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
  const parsed = tryParseObject(body) ?? tryParseObject(escapeControlCharsInStrings(body));
  if (parsed) {
    const reply = toResponse(parsed);
    return { reply, wellFormed: true, missingChoices: reply.choices.length === 0 };
  }

  // Truncated / malformed JSON — most commonly hit when the model runs into
  // MAX_TOKENS or the stream is cut. Dumping `raw` as narration leaked the
  // entire response (including nested objects like npcAction) into the
  // player-visible text, and the dialogue parser then matched garbage like
  // `[npcId]: "village_doctor"` as a phantom NPC speaker — wildly bouncing
  // narrator voices. Recover each field that came through whole instead:
  // the narration, the scene's own choices and its state changes. Losing the
  // state changes left the sheet behind the story (still "in the lab" after
  // leaving it), and the GM then rewound the story to match the sheet.
  const repaired = escapeControlCharsInStrings(cleaned);
  const extracted = extractNarrationField(cleaned);
  const recoveredChoices = CHOICE_KEYS.map((k) => extractChoicesField(repaired, k)).find((c) => c.length > 0) ?? [];
  const reply = toResponse({
    narration: extracted ?? raw,
    choices: recoveredChoices,
    soundCue: extractJsonValue(repaired, "soundCue"),
    stateChanges: extractJsonValue(repaired, "stateChanges") ?? undefined,
    npcAction: extractJsonValue(repaired, "npcAction") ?? null,
  });
  return { reply, wellFormed: false, missingChoices: reply.choices.length === 0 };
}

/**
 * The GM's reply for display and history. A reply with no usable choices
 * gets the in-voice fallback choices, so the player is never left with none.
 */
export function parseGMResponse(raw: string): GMResponse {
  const { reply, missingChoices } = parseGMReply(raw);
  return missingChoices ? { ...reply, choices: [...UNREADABLE_REPLY_CHOICES] } : reply;
}

/**
 * A reply as clean JSON, in the key order the GM is asked to write, for the
 * saved history. A malformed or truncated reply left in the history is read
 * back by the GM on every later turn, and it copies the broken shape.
 */
export function canonicalReplyText(reply: GMResponse, speakers: unknown = []): string {
  return JSON.stringify({
    soundCue: reply.soundCue ?? null,
    speakers: Array.isArray(speakers) ? speakers : [],
    narration: reply.narration,
    choices: reply.choices,
    ...(reply.stateChanges ? { stateChanges: reply.stateChanges } : {}),
    npcAction: reply.npcAction ?? null,
  });
}

/**
 * A stored GM reply ready to send back as history: unchanged when it was
 * well-formed JSON, otherwise rewritten as clean JSON (see canonicalReplyText).
 */
export function historyReplyText(raw: string): string {
  // Plain text (an older save's format) has nothing to repair.
  if (!raw.includes('"narration"')) return raw;
  const { reply, wellFormed, missingChoices } = parseGMReply(raw);
  if (wellFormed) return raw;
  return canonicalReplyText(
    missingChoices ? { ...reply, choices: [...UNREADABLE_REPLY_CHOICES] } : reply,
    replySpeakers(raw),
  );
}

/** The "speakers" list of a raw reply, or [] when it can't be read. */
export function replySpeakers(raw: string): unknown[] {
  const speakers = extractJsonValue(escapeControlCharsInStrings(raw), "speakers");
  return Array.isArray(speakers) ? speakers : [];
}

/**
 * The parsed value of `"key": <value>` in a malformed JSON string, when that
 * value itself is complete. Null when the key is missing or its value was cut.
 */
function extractJsonValue(text: string, key: string): unknown {
  const match = new RegExp(`"${key}"\\s*:\\s*`).exec(text);
  if (!match) return null;
  const start = match.index + match[0].length;
  const end = valueEnd(text, start);
  if (end === null) return null;
  try {
    return JSON.parse(text.slice(start, end));
  } catch {
    return null;
  }
}

/**
 * Index just past the JSON value starting at `start` (an object, array,
 * string or bare literal), or null when it runs off the end of the text.
 */
function valueEnd(text: string, start: number): number | null {
  const open = text[start];
  if (open === '"') {
    for (let i = start + 1; i < text.length; i++) {
      if (text[i] === "\\") i++;
      else if (text[i] === '"') return i + 1;
    }
    return null;
  }
  if (open !== "{" && open !== "[") {
    const literal = /^[^,}\]\s]+/.exec(text.slice(start));
    return literal && start + literal[0].length < text.length ? start + literal[0].length : null;
  }
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      const end = valueEnd(text, i);
      if (end === null) return null;
      i = end - 1;
    } else if (ch === "{" || ch === "[") {
      depth++;
    } else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return null;
}

/** The complete choice strings in a possibly truncated `"choices": [...]`. */
function extractChoicesField(text: string, key: string = "choices"): string[] {
  const whole = extractJsonValue(text, key);
  if (Array.isArray(whole)) return choiceLabels(whole);
  const match = new RegExp(`"${key}"\\s*:\\s*\\[`).exec(text);
  if (!match) return [];
  const choices: string[] = [];
  let i = match.index + match[0].length;
  while (i < text.length) {
    while (i < text.length && /[\s,]/.test(text[i]!)) i++;
    if (text[i] !== '"') break;
    const end = valueEnd(text, i);
    if (end === null) break;
    try {
      choices.push(JSON.parse(text.slice(i, end)) as string);
    } catch {
      break;
    }
    i = end;
  }
  return choices;
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
