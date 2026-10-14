import type { CriticalFact } from "@audio-rpg/gm-engine";
import type { CriticalFactRecord } from "./types.js";

/**
 * Critical-fact dedupe, trimming and selection shared by both stores, so
 * the memory and Postgres backends keep the same continuity anchors.
 */

/**
 * Facts that record the current value of a key. A newer one replaces the
 * older (a cured condition, a resolved oath), so these dedupe on kind plus
 * key instead of on the full text.
 */
const SUPERSEDING_FACT = /^(FLAG_SET|CONDITION_STATE|OATH_OR_DEBT)(?:_CREATED|_RESOLVED)?\|([^|]+)/;

/** The roll result the orchestrator stores as a flag; not a continuity anchor. */
const SKILL_CHECK_FACT_PREFIX = "FLAG_SET|last_skill_check|";

function supersedingKey(fact: CriticalFactRecord): string | null {
  const match = SUPERSEDING_FACT.exec(fact.text);
  if (!match) return null;
  return `${fact.kind}|${match[1]}|${match[2]!.trim().toLowerCase()}`;
}

function semanticKey(fact: CriticalFactRecord): string {
  const normalizedText = fact.text.trim().toLowerCase().replace(/\s+/g, " ");
  const entityRefs = Array.from(new Set(fact.entityRefs.map((ref) => ref.trim().toLowerCase()).filter(Boolean))).sort();
  return `${fact.kind}|${normalizedText}|${entityRefs.join(",")}`;
}

export function normalizeAndTrimCriticalFacts(facts: CriticalFactRecord[], maxFacts: number): CriticalFactRecord[] {
  const deduped = new Map<string, CriticalFactRecord>();
  for (const fact of facts) {
    if (!fact.text?.trim()) continue;
    const normalized: CriticalFactRecord = {
      turnNumber: Math.max(0, Number.isFinite(fact.turnNumber) ? fact.turnNumber : 0),
      text: fact.text.trim(),
      kind: fact.kind,
      importance: Number.isFinite(fact.importance) ? fact.importance : 0,
      entityRefs: Array.from(new Set((fact.entityRefs ?? []).map((r) => r.trim()).filter(Boolean))),
      sourceMutation: typeof fact.sourceMutation === "string" && fact.sourceMutation.trim() ? fact.sourceMutation : "unknown",
    };
    const superseding = supersedingKey(normalized);
    const key = superseding ?? semanticKey(normalized);
    const existing = deduped.get(key);
    // Facts arrive oldest first, so on a tied turn the later one is newer.
    const replaces = !existing
      ? true
      : superseding
        ? normalized.turnNumber >= existing.turnNumber
        : normalized.importance > existing.importance ||
          (normalized.importance === existing.importance && normalized.turnNumber >= existing.turnNumber);
    if (replaces) deduped.set(key, normalized);
  }
  return Array.from(deduped.values())
    .sort((a, b) => {
      if (a.importance !== b.importance) return b.importance - a.importance;
      return b.turnNumber - a.turnNumber;
    })
    .slice(0, maxFacts)
    .sort((a, b) => a.turnNumber - b.turnNumber);
}

/**
 * The n facts for the prompt: the most important (newest first on a tie),
 * returned in story order.
 */
export function selectCriticalFacts(facts: readonly CriticalFactRecord[], n: number): CriticalFact[] {
  return facts
    .filter((fact) => !fact.text.startsWith(SKILL_CHECK_FACT_PREFIX))
    .sort((a, b) => {
      if (a.importance !== b.importance) return b.importance - a.importance;
      return b.turnNumber - a.turnNumber;
    })
    .slice(0, Math.max(0, n))
    .sort((a, b) => a.turnNumber - b.turnNumber)
    .map(({ turnNumber, text, importance }) => ({ turnNumber, text, importance }));
}
