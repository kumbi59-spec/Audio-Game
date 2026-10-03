import type { CharacterData, CharacterStats } from "@/types/character";
import type { ItemMutation, QuestMutation } from "@/types/game";

/**
 * How a GM turn's stateChanges change the character: HP, stats (with
 * auto-levelling), inventory and quests. Pure functions, shared by the
 * browser store (instant feedback) and the action route (the stored,
 * authoritative copy), so both sides apply exactly the same rules.
 */

const KNOWN_STATS = ["hp", "maxHp", "strength", "dexterity", "intelligence", "charisma", "level", "experience"] as const;
type KnownStat = (typeof KNOWN_STATS)[number];

let idCounter = 0;
function defaultId(prefix: string): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function finite(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function applyHpDelta(character: CharacterData, delta: number): CharacterData {
  if (!finite(delta)) return character;
  const hp = Math.max(0, Math.min(character.stats.maxHp, character.stats.hp + delta));
  return { ...character, stats: { ...character.stats, hp } };
}

/**
 * Total experience a character needs to reach `level`: (level - 1)² × 100,
 * so level 2 at 100 XP, level 3 at 400, level 4 at 900. The one XP curve
 * the reducer, the GM's character state and the character sheet all use,
 * mirroring packages/gm-engine/src/reducer.ts.
 */
export function xpToReachLevel(level: number): number {
  const steps = Math.max(0, Math.floor(level) - 1);
  return steps * steps * 100;
}

/**
 * Applies a stat delta. Experience gains auto-level on the xpToReachLevel
 * curve:
 *   per level: +5 maxHp, +5 hp (capped at new maxHp)
 *   odd levels: +1 STR, +1 DEX; even levels: +1 INT, +1 CHA
 * The loop lets a large XP grant cross several levels in one turn. Level
 * itself only changes that way: a "level" delta from the GM is ignored, or a
 * level-up it also asked for would be applied twice. Unknown stat names go to
 * customStats (mp, stamina, sanity…).
 */
export function applyStatDelta(character: CharacterData, statName: string, delta: number): CharacterData {
  if (!finite(delta) || statName === "level") return character;
  if ((KNOWN_STATS as readonly string[]).includes(statName)) {
    const key = statName as KnownStat;
    const current = character.stats[key] ?? 0;
    const stats: CharacterStats = { ...character.stats, [key]: Math.max(0, current + delta) };

    if (key === "experience") {
      while (true) {
        const lvl = stats.level ?? 1;
        if ((stats.experience ?? 0) < xpToReachLevel(lvl + 1)) break;
        const next = lvl + 1;
        stats.level = next;
        stats.maxHp = (stats.maxHp ?? 10) + 5;
        stats.hp = Math.min((stats.hp ?? 0) + 5, stats.maxHp);
        if (next % 2 !== 0) {
          stats.strength = (stats.strength ?? 10) + 1;
          stats.dexterity = (stats.dexterity ?? 10) + 1;
        } else {
          stats.intelligence = (stats.intelligence ?? 10) + 1;
          stats.charisma = (stats.charisma ?? 10) + 1;
        }
      }
    }
    return { ...character, stats };
  }
  const current = character.customStats?.[statName] ?? 0;
  return {
    ...character,
    customStats: { ...character.customStats, [statName]: Math.max(0, current + delta) },
  };
}

export function applyInventoryMutation(
  character: CharacterData,
  mutation: ItemMutation,
  makeId: (prefix: string) => string = defaultId,
): CharacterData {
  const inv = character.inventory;
  const quantity = finite(mutation.quantity) && mutation.quantity > 0 ? Math.floor(mutation.quantity) : 1;
  const name = mutation.name.toLowerCase();
  if (mutation.op === "add") {
    const idx = inv.findIndex((i) => i.name.toLowerCase() === name);
    if (idx >= 0) {
      return {
        ...character,
        inventory: inv.map((item, i) => (i === idx ? { ...item, quantity: item.quantity + quantity } : item)),
      };
    }
    return {
      ...character,
      inventory: [
        ...inv,
        {
          id: makeId("item"),
          name: mutation.name,
          quantity,
          description: mutation.description ?? "",
          category: mutation.category ?? "misc",
          properties: {},
        },
      ],
    };
  }
  return {
    ...character,
    inventory: inv
      .map((item) =>
        item.name.toLowerCase() === name ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item,
      )
      .filter((item) => item.quantity > 0),
  };
}

/** Objective texts match ignoring case, spacing and a trailing full stop. */
function sameText(a: string, b: unknown): boolean {
  if (typeof b !== "string") return false;
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return norm(a) === norm(b);
}

export function applyQuestMutation(
  character: CharacterData,
  mutation: QuestMutation,
  makeId: (prefix: string) => string = defaultId,
): CharacterData {
  const quests = character.quests;
  const title = mutation.title.toLowerCase();
  if (mutation.op === "start") {
    if (quests.some((q) => q.title.toLowerCase() === title)) return character;
    const questId = makeId("quest");
    return {
      ...character,
      quests: [
        ...quests,
        {
          id: questId,
          title: mutation.title,
          description: mutation.description ?? "",
          status: "active",
          objectives: (Array.isArray(mutation.objectives) ? mutation.objectives : [])
            .filter((text): text is string => typeof text === "string")
            .map((text, i) => ({ id: `${questId}-obj-${i}`, text, completed: false })),
          reward: null,
        },
      ],
    };
  }
  if (mutation.op === "update") {
    return {
      ...character,
      quests: quests.map((q) =>
        q.title.toLowerCase() !== title
          ? q
          : {
              ...q,
              objectives: q.objectives.map((o) =>
                sameText(o.text, mutation.objective) ? { ...o, completed: mutation.done ?? true } : o,
              ),
            },
      ),
    };
  }
  const status = mutation.op === "complete" ? "completed" : "failed";
  return {
    ...character,
    quests: quests.map((q) => (q.title.toLowerCase() === title ? { ...q, status } : q)),
  };
}

export function isItemMutation(m: unknown): m is ItemMutation {
  const v = m as Partial<ItemMutation> | null;
  return !!v && (v.op === "add" || v.op === "remove") && typeof v.name === "string" && v.name.trim().length > 0;
}

export function isQuestMutation(m: unknown): m is QuestMutation {
  const v = m as Partial<QuestMutation> | null;
  return (
    !!v &&
    (v.op === "start" || v.op === "update" || v.op === "complete" || v.op === "fail") &&
    typeof v.title === "string" &&
    v.title.trim().length > 0
  );
}

/**
 * Applies one turn's stateChanges to the character, in the order the client
 * applies them as the events arrive: HP, stat deltas, inventory, quests.
 * stateChanges is GM output, so anything malformed is skipped.
 */
export function applyCharacterChanges(
  character: CharacterData,
  changes: Record<string, unknown>,
  makeId: (prefix: string) => string = defaultId,
): CharacterData {
  let next = character;
  if (finite(changes.hp)) next = applyHpDelta(next, changes.hp);
  if (changes.statDeltas && typeof changes.statDeltas === "object") {
    for (const [stat, delta] of Object.entries(changes.statDeltas as Record<string, unknown>)) {
      if (finite(delta)) next = applyStatDelta(next, stat, delta);
    }
  }
  if (Array.isArray(changes.inventoryChanges)) {
    for (const m of changes.inventoryChanges) if (isItemMutation(m)) next = applyInventoryMutation(next, m, makeId);
  }
  if (Array.isArray(changes.questChanges)) {
    for (const m of changes.questChanges) if (isQuestMutation(m)) next = applyQuestMutation(next, m, makeId);
  }
  return next;
}
