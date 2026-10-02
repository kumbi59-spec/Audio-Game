/**
 * Narration clean-up the GM prompt asks for but the model occasionally
 * forgets: em dashes (and spaced en dashes used as em dashes). A dash that
 * cuts a line off ("Wait—") becomes "...", any other one becomes a comma.
 */

// A dash run that is followed by closing punctuation, a line break or the end.
const TRAILING_DASH_RE = /[ \t]*—[ \t]*(?=["”'.,!?;:)\]\n]|$)/g;
const DASH_RE = /[ \t]*—[ \t]*|[ \t]+–[ \t]+/g;

export function stripEmDashes(text: string): string {
  if (!text.includes("—") && !text.includes("–")) return text;
  return text.replace(TRAILING_DASH_RE, "...").replace(DASH_RE, ", ");
}

// Spaces, tabs and dashes at the end of a chunk could be the start of a dash
// run whose replacement depends on what comes next, so they're held back.
const HOLD_RE = /[ \t—–]+$/;

/**
 * stripEmDashes for text that arrives in pieces. Each push returns what can
 * be released so far; joined together, the output equals stripEmDashes() of
 * the whole text, however it was split.
 */
export class EmDashStripper {
  private held = "";

  push(chunk: string): string {
    const text = this.held + chunk;
    const hold = HOLD_RE.exec(text);
    const cut = hold ? hold.index : text.length;
    this.held = text.slice(cut);
    return stripEmDashes(text.slice(0, cut));
  }

  /** The text is complete: release whatever was held back. */
  flush(): string {
    const rest = stripEmDashes(this.held);
    this.held = "";
    return rest;
  }
}
