import type { VoiceGender } from "@/types/audio";
import { EmDashStripper } from "./style";

const NARRATION_KEY_RE = /"narration"\s*:\s*"/;
const SOUND_CUE_RE = /"soundCue"\s*:\s*(?:"([^"\\]*)"|null)/;
const SPEAKERS_RE = /"speakers"\s*:\s*(\[[^\]]*\])/;

const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

function isHighSurrogate(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return ch.length === 1 && code >= 0xd800 && code <= 0xdbff;
}

/**
 * Pulls the prose of the top-level `"narration"` string out of the GM's JSON
 * reply while it is still streaming, so the narrator can start speaking long
 * before the rest of the JSON (choices, state changes) has been written.
 *
 * Feed raw text deltas to push(); it returns the newly decoded prose. JSON
 * escapes split across deltas (`\` at the end of one chunk, `n` at the start
 * of the next, or a `\uXXXX` cut in half) are held until complete.
 */
export class NarrationStreamExtractor {
  private state: "seeking" | "inside" | "done" = "seeking";
  private seekBuffer = "";
  private escape: string | null = null;
  private heldHighSurrogate = "";

  /** True until the opening quote of the narration value has been seen. */
  get seeking(): boolean {
    return this.state === "seeking";
  }

  get done(): boolean {
    return this.state === "done";
  }

  push(chunk: string): string {
    if (this.state === "done" || !chunk) return "";
    let text = chunk;
    if (this.state === "seeking") {
      this.seekBuffer += chunk;
      const match = NARRATION_KEY_RE.exec(this.seekBuffer);
      if (!match) return "";
      text = this.seekBuffer.slice(match.index + match[0].length);
      this.seekBuffer = "";
      this.state = "inside";
    }
    return this.decode(text);
  }

  private decode(text: string): string {
    let out = this.heldHighSurrogate;
    this.heldHighSurrogate = "";
    for (const ch of text) {
      if (this.escape !== null) {
        this.escape += ch;
        if (this.escape.length === 1) {
          if (ch === "u") continue;
          out += SIMPLE_ESCAPES[ch] ?? ch;
          this.escape = null;
        } else if (this.escape.length === 5) {
          const code = Number.parseInt(this.escape.slice(1), 16);
          out += Number.isNaN(code) ? "" : String.fromCharCode(code);
          this.escape = null;
        }
        continue;
      }
      if (ch === "\\") {
        this.escape = "";
        continue;
      }
      if (ch === '"') {
        this.state = "done";
        break;
      }
      out += ch;
    }
    // Don't hand out half of a surrogate pair; it would be mangled when the
    // delta is serialised on its own.
    if (this.state !== "done" && out.length > 0 && isHighSurrogate(out[out.length - 1]!)) {
      this.heldHighSurrogate = out[out.length - 1]!;
      out = out.slice(0, -1);
    }
    return out;
  }
}

export interface Speaker {
  name: string;
  gender: VoiceGender;
}

function parseSpeakers(json: string): Speaker[] | null {
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return null;
    return raw.flatMap((s): Speaker[] => {
      if (!s || typeof s !== "object") return [];
      const { name, gender } = s as { name?: unknown; gender?: unknown };
      if (typeof name !== "string" || !name.trim()) return [];
      const g: VoiceGender = gender === "male" || gender === "female" ? gender : "neutral";
      return [{ name: name.trim(), gender: g }];
    });
  } catch {
    return null;
  }
}

export type NarrationStreamEvent =
  | { type: "narration_delta"; data: { text: string } }
  | { type: "sound_cue"; data: { cue: string } }
  | { type: "speakers"; data: { speakers: Speaker[] } };

/**
 * Watches one round of streamed GM text and turns it into events the client
 * can act on before the reply is complete: decoded narration prose, plus the
 * sound cue and speaker list the prompt asks the GM to write ahead of the
 * narration.
 */
export class NarrationStreamTap {
  private extractor = new NarrationStreamExtractor();
  // Same clean-up parseGMResponse applies to the final narration, so the
  // streamed prose stays a prefix of it.
  private stripper = new EmDashStripper();
  private head = "";
  private speakersSent = false;
  /** Cue already sent this turn, so the end-of-turn cue isn't played twice. */
  cueSent: string | null = null;
  private cueResolved = false;

  onText(text: string): NarrationStreamEvent[] {
    const events: NarrationStreamEvent[] = [];
    // soundCue and speakers are written before the narration; once the
    // narration has started there is nothing more to find early.
    if (this.extractor.seeking) {
      this.head += text;
      if (!this.cueResolved) {
        const cue = SOUND_CUE_RE.exec(this.head);
        if (cue) {
          this.cueResolved = true;
          if (cue[1]) {
            this.cueSent = cue[1];
            events.push({ type: "sound_cue", data: { cue: cue[1] } });
          }
        }
      }
      if (!this.speakersSent) {
        const match = SPEAKERS_RE.exec(this.head);
        const speakers = match ? parseSpeakers(match[1]!) : null;
        if (speakers) {
          this.speakersSent = true;
          if (speakers.length > 0) events.push({ type: "speakers", data: { speakers } });
        }
      }
    }
    let prose = this.stripper.push(this.extractor.push(text));
    if (this.extractor.done) prose += this.stripper.flush();
    if (prose) events.push({ type: "narration_delta", data: { text: prose } });
    return events;
  }

  /** Forget streamed text (a tool round or retry discarded it). */
  resetText(): void {
    this.extractor = new NarrationStreamExtractor();
    this.stripper = new EmDashStripper();
    this.head = "";
  }
}
