import type { GameBible } from "@audio-rpg/shared";
import { GameBible as GameBibleSchema } from "@audio-rpg/shared";

/**
 * Game Bible ingestion. Takes raw text from an upload (paste, .txt, .md,
 * extracted PDF/DOCX) and turns it into a structured GameBible the GM can
 * trust. The MVP runs a single Sonnet pass with strict JSON output; the
 * plan calls for an extract → classify → structure → embed pipeline that
 * we'll split into stages in a follow-up once the volume justifies it.
 *
 * This module is provider-agnostic: it builds the prompt and validates the
 * output. The caller passes a `runModel` function so the API layer owns
 * the Anthropic SDK wiring.
 */

export interface IngestArgs {
  rawText: string;
  /** Optional title hint from the upload form. The model may override it. */
  titleHint?: string;
  runModel: (args: { system: string; user: string }) => Promise<string>;
}

export interface IngestResult {
  bible: GameBible;
  warnings: string[];
}

const MAX_INPUT_CHARS = 60_000;

export async function ingestBibleFromText(args: IngestArgs): Promise<IngestResult> {
  const trimmed = args.rawText.trim();
  if (!trimmed) {
    throw new Error("Cannot ingest an empty document.");
  }

  const text = trimmed.length > MAX_INPUT_CHARS
    ? trimmed.slice(0, MAX_INPUT_CHARS)
    : trimmed;
  const truncated = text.length < trimmed.length;

  const system = INGEST_SYSTEM_PROMPT;
  const user = buildIngestUserPrompt(text, args.titleHint);

  const raw = await args.runModel({ system, user });
  const json = extractJson(raw);
  const result = GameBibleSchema.safeParse(json);
  if (!result.success) {
    throw new Error(
      `Ingested bible failed validation: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  const warnings: string[] = [];
  if (truncated) {
    warnings.push(
      `Input exceeded ${MAX_INPUT_CHARS} characters and was truncated. Long uploads should be split into chapters.`,
    );
  }
  if (!result.data.starting_scenario) {
    warnings.push("No starting scenario was found. The GM will improvise the opening.");
  }
  if (result.data.entities.length === 0) {
    warnings.push("No named entities (NPCs, locations, factions) were extracted.");
  }
  return { bible: result.data, warnings };
}

const INGEST_SYSTEM_PROMPT = [
  "You parse user-supplied RPG worldbuilding text into a structured Game Bible.",
  "",
  "## Output contract",
  "Return EXACTLY one JSON object matching the GameBible schema. No prose outside JSON.",
  "Required top-level keys:",
  "  - title: string",
  "  - style_mode: one of cinematic, rules_light, crunchy, mystery, horror, political, adventure",
  "  - tone: { content_rating: family|teen|mature, forbidden_topics: string[] }",
  "  - rules: { hard_constraints: string[], optionally combat, magic, skill_checks, progression, death_and_failure }",
  "  - entities: array of { id, kind: npc|faction|location|item|rule|creature, name, description, attributes }",
  "  - timeline: array of { when, what }",
  "  - character_creation: { origins[], classes[], stats[], starting_items[] }",
  "  - win_states[], fail_states[]",
  "  - optional: pitch, genre, setting, starting_scenario",
  "",
  "## Extraction rules",
  "- Choose `style_mode` from the genre/tone signals in the text. Default 'cinematic' if unclear.",
  "- `hard_constraints` capture rules that MUST be respected (e.g. 'no firearms', 'magic always costs blood'). Be conservative — only include items the text plainly states.",
  "- For each named NPC, location, faction, item, or creature, emit one entity with a stable id like 'npc.kael' or 'loc.harbor'.",
  "- Do not invent content. If the text is silent on a field, omit it.",
  "- Set content_rating to 'mature' if the text describes graphic violence, sex, or substance use; 'family' if explicitly child-friendly; otherwise 'teen'.",
  "- If a clear opening scene/prologue is described, fill `starting_scenario`.",
].join("\n");

function buildIngestUserPrompt(text: string, titleHint?: string): string {
  const lines: string[] = [];
  if (titleHint) lines.push(`Title hint from the user: "${titleHint}".`);
  lines.push("Source document follows between the markers.");
  lines.push("---BEGIN DOCUMENT---");
  lines.push(text);
  lines.push("---END DOCUMENT---");
  lines.push("Return the GameBible JSON now.");
  return lines.join("\n");
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fence?.[1]) return JSON.parse(fence[1]);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("No JSON object found in ingest model response");
}
