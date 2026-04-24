import type { GameBible } from "@audio-rpg/shared";

/**
 * Provider-agnostic embedder. The API layer wires this to a concrete
 * provider (Voyage AI by default — Anthropic's recommended embedding
 * partner, native 1024-dim that matches the schema). Tests pass in a
 * deterministic fake.
 */
export interface Embedder {
  readonly dimensions: number;
  /** Batch-embed input strings, returning vectors in the same order. */
  embed(texts: readonly string[]): Promise<number[][]>;
}

/** Output of the chunker; ready to embed and persist. */
export interface BibleChunkDraft {
  text: string;
  categories: string[];
  metadata: Record<string, unknown>;
}

const TARGET_CHARS = 3200; // ~800 tokens @ 4 chars/token
const OVERLAP_CHARS = 400;

/**
 * Turn a structured Game Bible into chunks ready for embedding. Sections
 * are categorized so the retriever can bias relevance (e.g. pull rules
 * when the player asks about combat, lore when they examine a codex
 * entry). Every named entity also becomes its own chunk so proper-name
 * queries retrieve reliably.
 */
export function chunkBible(bible: GameBible): BibleChunkDraft[] {
  const chunks: BibleChunkDraft[] = [];
  const title = bible.title.trim();

  if (bible.pitch) {
    chunks.push({
      text: `${title} — ${bible.pitch}`,
      categories: ["summary"],
      metadata: {},
    });
  }
  if (bible.setting) {
    chunks.push({
      text: `Setting of ${title}: ${bible.setting}`,
      categories: ["setting"],
      metadata: {},
    });
  }
  if (bible.starting_scenario) {
    chunks.push({
      text: `Opening scene of ${title}: ${bible.starting_scenario}`,
      categories: ["scenario", "opening"],
      metadata: {},
    });
  }

  // Rules get split by subsection so targeted retrieval works.
  const rules = bible.rules;
  for (const key of [
    "combat",
    "magic",
    "skill_checks",
    "progression",
    "death_and_failure",
  ] as const) {
    const val = rules[key];
    if (val) {
      chunks.push({
        text: `Rule (${key.replace(/_/g, " ")}): ${val}`,
        categories: ["rules", key],
        metadata: {},
      });
    }
  }
  if (rules.hard_constraints.length) {
    chunks.push({
      text: [
        `Hard constraints for ${title}:`,
        ...rules.hard_constraints.map((c) => `- ${c}`),
      ].join("\n"),
      categories: ["rules", "constraints"],
      metadata: {},
    });
  }

  if (bible.tone.voice || bible.tone.pacing) {
    chunks.push({
      text: [
        `Tone for ${title}.`,
        bible.tone.voice ? `Voice: ${bible.tone.voice}.` : "",
        bible.tone.pacing ? `Pacing: ${bible.tone.pacing}.` : "",
        bible.tone.forbidden_topics.length
          ? `Forbidden: ${bible.tone.forbidden_topics.join(", ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      categories: ["tone"],
      metadata: {},
    });
  }

  for (const e of bible.entities) {
    chunks.push({
      text: `[${e.kind}] ${e.name}: ${e.description}`,
      categories: [`entity:${e.kind}`, e.kind],
      metadata: { entityId: e.id, entityName: e.name },
    });
  }

  if (bible.timeline.length) {
    const text = [
      `Timeline of ${title}:`,
      ...bible.timeline.map((t) => `- ${t.when}: ${t.what}`),
    ].join("\n");
    chunks.push(...splitLongText(text, ["timeline"], {}));
  }

  if (bible.win_states.length || bible.fail_states.length) {
    chunks.push({
      text: [
        bible.win_states.length
          ? `Win states: ${bible.win_states.join("; ")}.`
          : "",
        bible.fail_states.length
          ? `Fail states: ${bible.fail_states.join("; ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      categories: ["win_fail"],
      metadata: {},
    });
  }

  return chunks.filter((c) => c.text.trim().length > 0);
}

/**
 * Same chunker strategy, but for arbitrary raw text (e.g. the original
 * uploaded document). Splits on paragraph boundaries, keeping each chunk
 * under TARGET_CHARS with a small overlap for continuity.
 */
export function chunkText(
  raw: string,
  categories: string[] = ["raw"],
): BibleChunkDraft[] {
  return splitLongText(raw, categories, {});
}

function splitLongText(
  text: string,
  categories: string[],
  metadata: Record<string, unknown>,
): BibleChunkDraft[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= TARGET_CHARS) {
    return [{ text: trimmed, categories, metadata }];
  }

  const paragraphs = trimmed.split(/\n{2,}/);
  const out: BibleChunkDraft[] = [];
  let current = "";

  const push = () => {
    if (current.trim()) {
      out.push({ text: current.trim(), categories, metadata });
    }
  };

  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length <= TARGET_CHARS) {
      current = candidate;
      continue;
    }
    push();
    // Start a new chunk with a small tail of the previous one for context.
    const tail = current.slice(-OVERLAP_CHARS);
    current = tail ? `${tail}\n\n${p}` : p;
    while (current.length > TARGET_CHARS) {
      const cut = current.lastIndexOf(" ", TARGET_CHARS) || TARGET_CHARS;
      out.push({ text: current.slice(0, cut).trim(), categories, metadata });
      current = current.slice(Math.max(0, cut - OVERLAP_CHARS));
    }
  }
  push();
  return out;
}
