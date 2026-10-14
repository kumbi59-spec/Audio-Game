import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";
import { CORE_STAT_KEYS, OFFICIAL_DEFAULT_STAT_RULES, resolveStatRules, type CoreStatKey } from "@/lib/character/stat-rules";

/** The span of values a world's stats are created in. */
export interface StatRange {
  min: number;
  max: number;
}

/** The range the roll formula is written for: 6 to 18, average 10 to 11. */
const BASE_RANGE: StatRange = {
  min: OFFICIAL_DEFAULT_STAT_RULES.perStatMin,
  max: OFFICIAL_DEFAULT_STAT_RULES.perStatMax,
};

const MIN_MODIFIER = -5;
const MAX_MODIFIER = 10;

/** The stat range a world creates characters in (its bible's caps, or the default). */
export function worldStatRange(world: Pick<WorldData, "isPrebuilt" | "rulesNotes" | "statRules">): StatRange {
  const rules = resolveStatRules({
    isPrebuilt: world.isPrebuilt,
    rulesNotes: world.rulesNotes,
    statRules: world.statRules,
  });
  // A bible that only gives a low cap ("stat cap: 5") leaves the minimum at the
  // default 6, which the rules then pull down to the cap. Its scale really
  // starts at 1.
  const min = rules.perStatMin < rules.perStatMax ? rules.perStatMin : Math.min(1, rules.perStatMax - 1);
  return { min, max: rules.perStatMax };
}

/**
 * The bonus a stat adds to a d20 roll. On the default 6 to 18 scale it's the
 * classic floor((stat - 10) / 2): 10 is +0, 14 is +2, 18 is +4. A world that
 * rates stats on its own scale (1 to 5, 1 to 10, 0 to 100) has its values
 * mapped onto that scale first, so a world's top stat is worth as much as an
 * 18 rather than reading as a penalty.
 */
export function statModifier(value: number, range: StatRange = BASE_RANGE): number {
  if (!Number.isFinite(value)) return 0;
  const sameScale = range.min === BASE_RANGE.min && range.max === BASE_RANGE.max;
  const scaled =
    sameScale || range.max <= range.min
      ? value
      : BASE_RANGE.min + ((value - range.min) * (BASE_RANGE.max - BASE_RANGE.min)) / (range.max - range.min);
  const modifier = Math.floor((scaled - 10) / 2);
  return Math.max(MIN_MODIFIER, Math.min(MAX_MODIFIER, modifier));
}

const CORE_ALIASES: Record<string, CoreStatKey> = {
  str: "strength",
  dex: "dexterity",
  int: "intelligence",
  cha: "charisma",
};

/** Bookkeeping numbers that never feed a roll. */
const NON_ROLL_STATS = new Set(["hp", "maxhp", "level", "experience", "xp"]);

/**
 * The stats a skill check can use: the four core stats, then the world's own
 * stats (not hit points, XP, level, or a pool that has a matching "...Max").
 */
export function rollableStats(character: Pick<CharacterData, "stats" | "customStats">): Array<{ name: string; value: number }> {
  const core = CORE_STAT_KEYS.map((k) => ({ name: k as string, value: character.stats[k] }));
  const custom = Object.entries(character.customStats ?? {})
    .filter(([name, value]) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return false;
      if (NON_ROLL_STATS.has(name.toLowerCase()) || /max$/i.test(name)) return false;
      return character.customStats?.[`${name}Max`] === undefined;
    })
    .map(([name, value]) => ({ name, value }));
  return [...core, ...custom];
}

/**
 * The character stat a skill check names, matched loosely ("DEX",
 * "Dexterity", "ninjutsu" for "Ninjutsu"). Null when the character has no
 * such stat.
 */
export function findRollStat(
  character: Pick<CharacterData, "stats" | "customStats">,
  requested: string,
): { name: string; value: number } | null {
  const key = requested.trim().toLowerCase();
  const core = CORE_ALIASES[key] ?? key;
  const stats = rollableStats(character);
  return stats.find((s) => s.name.toLowerCase() === core) ?? null;
}
