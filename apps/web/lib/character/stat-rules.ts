import { CLASS_DESCRIPTIONS, type CharacterClass, type CharacterStats } from "@/types/character";

/**
 * Rules governing how many stat points a player can spend during character
 * creation. Applied uniformly across "core" stats (strength, dexterity,
 * intelligence, charisma) and any custom stats a world declares.
 */
export interface StatRules {
  /** Lowest value any single editable stat can be set to. */
  perStatMin: number;
  /** Highest value any single editable stat can be set to. */
  perStatMax: number;
  /**
   * Total points distributable across all editable stats. `null` means the
   * pool is unlimited and only `perStatMax` constrains the build.
   */
  totalPointPool: number | null;
}

export const CORE_STAT_KEYS = ["strength", "dexterity", "intelligence", "charisma"] as const;
export type CoreStatKey = (typeof CORE_STAT_KEYS)[number];

/**
 * Default stat rules for official (prebuilt) worlds. Picked so a player
 * cannot reach the engine's hard maximum (30) on every stat.
 */
export const OFFICIAL_DEFAULT_STAT_RULES: StatRules = {
  perStatMin: 6,
  perStatMax: 18,
  totalPointPool: 48,
};

/**
 * Total starting points for a class — used as the per-class budget. A player
 * can redistribute among the four core stats but cannot inflate the total.
 */
export function classPointPool(cls: CharacterClass): number {
  const s = CLASS_DESCRIPTIONS[cls].startingStats;
  return s.strength + s.dexterity + s.intelligence + s.charisma;
}

export function sumCoreStats(stats: Pick<CharacterStats, CoreStatKey>): number {
  return stats.strength + stats.dexterity + stats.intelligence + stats.charisma;
}

export function sumCustomStats(stats: Record<string, number>): number {
  return Object.values(stats).reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
}

/**
 * Extract structured stat rules from a community world's free-text rules
 * notes. Returns a partial — only fields explicitly named in the bible are
 * filled in, so the caller can layer it over the official defaults.
 *
 * Recognised forms (case-insensitive):
 *   - "stat cap: 5", "max stat 5", "maximum stat 5", "stat max: 5"
 *   - "min stat 1", "stat min: 1", "minimum stat 1"
 *   - "stat point pool 30", "stat points: 30", "point pool: 30",
 *     "total stat points: 30"
 */
export function parseStatRulesFromNotes(rulesNotes: string | undefined | null): Partial<StatRules> | null {
  if (!rulesNotes) return null;
  const out: Partial<StatRules> = {};

  const capMatch = rulesNotes.match(
    /(?:stat\s+cap|cap\s+per\s+stat|max(?:imum)?\s+stat|stat\s+max(?:imum)?)\s*[:\-]?\s*(\d{1,3})/i,
  );
  if (capMatch?.[1]) out.perStatMax = clamp(Number(capMatch[1]), 1, 100);

  const minMatch = rulesNotes.match(
    /(?:stat\s+min(?:imum)?|min(?:imum)?\s+stat)\s*[:\-]?\s*(\d{1,3})/i,
  );
  if (minMatch?.[1]) out.perStatMin = clamp(Number(minMatch[1]), 0, 100);

  const poolMatch = rulesNotes.match(
    /(?:stat\s+point\s+pool|stat\s+points(?:\s+to\s+(?:spend|distribute|allocate))?|point\s+pool|total\s+stat\s+points)\s*[:\-]?\s*(\d{1,4})/i,
  );
  if (poolMatch?.[1]) out.totalPointPool = clamp(Number(poolMatch[1]), 1, 1000);

  return Object.keys(out).length > 0 ? out : null;
}

interface ResolveInput {
  /** True for official/prebuilt worlds. */
  isPrebuilt?: boolean;
  /** Free-text rules from the game bible (community worlds). */
  rulesNotes?: string | null;
  /** Structured override from the bible — wins over `rulesNotes` parsing. */
  statRules?: Partial<StatRules> | null;
  /**
   * The class the player has chosen, if any. Used to size the official-world
   * point pool to the class's starting budget so picking a "lighter" class
   * doesn't unlock a flat 48-point pool.
   */
  characterClass?: CharacterClass | null;
  /** True when the world declares its own classes (custom or seeded). */
  worldDefinesClasses?: boolean;
}

/**
 * Resolve the StatRules a character creation screen should enforce.
 *
 *  - Official (prebuilt) worlds use OFFICIAL_DEFAULT_STAT_RULES, with the
 *    pool sized to the chosen class's starting total when applicable.
 *  - Community worlds layer their bible-declared rules over the official
 *    defaults. Anything missing falls back to the official rule.
 */
export function resolveStatRules(input: ResolveInput): StatRules {
  const officialPool =
    input.characterClass && !input.worldDefinesClasses
      ? Math.max(OFFICIAL_DEFAULT_STAT_RULES.totalPointPool!, classPointPool(input.characterClass))
      : input.characterClass
        ? classPointPool(input.characterClass)
        : OFFICIAL_DEFAULT_STAT_RULES.totalPointPool;

  const officialBaseline: StatRules = {
    ...OFFICIAL_DEFAULT_STAT_RULES,
    totalPointPool: officialPool,
  };

  if (input.isPrebuilt) return officialBaseline;

  const fromNotes = parseStatRulesFromNotes(input.rulesNotes);
  const merged: StatRules = {
    ...officialBaseline,
    ...(fromNotes ?? {}),
    ...(input.statRules ?? {}),
  };

  if (merged.perStatMin > merged.perStatMax) {
    merged.perStatMin = merged.perStatMax;
  }
  return merged;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}
