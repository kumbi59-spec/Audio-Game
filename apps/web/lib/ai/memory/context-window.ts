import type { HistoryMessage, InMemorySession } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";
import { xpToReachLevel } from "@/lib/game/character-reducer";

const APPROX_CHARS_PER_TOKEN = 4;
const MAX_HISTORY_TOKENS = 40_000;
export const MAX_HISTORY_CHARS = MAX_HISTORY_TOKENS * APPROX_CHARS_PER_TOKEN;
/** History is dropped from the front this many messages at a time. */
const TRIM_BLOCK = 10;

/**
 * Keeps the most recent history that fits in `maxChars`, dropping the oldest
 * messages in blocks of TRIM_BLOCK rather than one at a time. The history is
 * the cached prefix of every GM request; dropping one message per turn would
 * change that prefix on every turn and miss the cache each time, while
 * dropping a block keeps it identical for several turns in a row. The client
 * applies the same function before posting, so both sides agree on the cut.
 */
export function trimHistoryForContext<T extends { content: string }>(
  history: T[],
  maxChars: number = MAX_HISTORY_CHARS,
): T[] {
  const lengths = history.map((m) => m.content.length);
  let total = lengths.reduce((sum, n) => sum + n, 0);
  let drop = 0;
  while (total > maxChars && history.length - drop > 2) {
    const next = Math.min(drop + TRIM_BLOCK, history.length - 2);
    for (let i = drop; i < next; i++) total -= lengths[i]!;
    drop = next;
  }
  return drop === 0 ? history : history.slice(drop);
}

/** Most history messages an unsaved game sends for summarising in one turn. */
export const MAX_PENDING_SUMMARY_MESSAGES = 40;

/**
 * For an unsaved game: the history about to drop out of the context window
 * (see trimHistoryForContext) that isn't in the memory summary yet, oldest
 * first and at most MAX_PENDING_SUMMARY_MESSAGES at a time — a long backlog
 * catches up over a few turns. Null when nothing is pending.
 */
export function pendingSummaryFor<T extends { content: string }>(
  history: T[],
  summarizedMessages: number | undefined,
  maxChars: number = MAX_HISTORY_CHARS,
): { fromMessage: number; messages: T[] } | null {
  const dropped = history.length - trimHistoryForContext(history, maxChars).length;
  const from = Math.min(summarizedMessages ?? 0, history.length);
  if (dropped <= from) return null;
  const to = Math.min(dropped, from + MAX_PENDING_SUMMARY_MESSAGES);
  return { fromMessage: from, messages: history.slice(from, to) };
}

export function buildContextMessages(
  session: InMemorySession,
  character: CharacterData,
  world: WorldData
): HistoryMessage[] {
  const messages = [...trimHistoryForContext(session.history)];

  // Anthropic requires the first message to have role "user"; drop any leading
  // assistant messages that may have been stored from the opening narration.
  while (messages.length > 0 && messages[0]?.role === "assistant") {
    messages.shift();
  }

  return messages;
}

export function buildCharacterStateBlock(character: CharacterData): string {
  const s = character.stats;
  const activeQuests = character.quests
    .filter((q) => q.status === "active")
    .map((q) => {
      const openObjs = q.objectives.filter((o) => !o.completed).map((o) => o.text);
      return `${q.title}${openObjs.length ? ` (${openObjs.join("; ")})` : ""}`;
    })
    .join(" | ") || "None";
  const items = character.inventory
    .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}${i.description ? ` (${i.description})` : ""}`)
    .join(", ") || "Nothing";

  const customStatLines = character.customStats && Object.keys(character.customStats).length > 0
    ? Object.entries(character.customStats)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
        .join(" | ")
    : "";

  return [
    `Name: ${character.name}`,
    character.pronouns ? `Pronouns: ${character.pronouns}` : "",
    typeof character.age === "number" ? `Age: ${character.age}` : "",
    character.shortDescription ? `Appearance: ${character.shortDescription}` : "",
    `Class: ${character.roleTitle ?? character.class}`,
    `HP: ${s.hp}/${s.maxHp} | Level: ${s.level} | XP: ${s.experience} (level ${s.level + 1} at ${xpToReachLevel(s.level + 1)} XP, ${Math.max(0, xpToReachLevel(s.level + 1) - s.experience)} to go)`,
    s.hp <= 0 ? "Condition: DOWN (0 HP)" : "",
    `STR:${s.strength} DEX:${s.dexterity} INT:${s.intelligence} CHA:${s.charisma}`,
    customStatLines || "",
    `Inventory: ${items}`,
    `Active Quests: ${activeQuests}`,
    character.backstory ? `Backstory: ${character.backstory}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWorldStateBlock(session: InMemorySession, world: WorldData): string {
  const location = world.locations.find(
    (l) => l.id === session.currentLocationId
  );
  const flagsStr = Object.entries(session.globalFlags)
    .filter(([k]) => !k.startsWith("_") && k !== "passiveBonuses" && k !== "last_skill_check")
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ") || "none";

  const relStr =
    session.relationships?.length > 0
      ? session.relationships
          .map((r) => {
            const label =
              r.standing >= 50
                ? "Ally"
                : r.standing >= 10
                ? "Friendly"
                : r.standing >= -9
                ? "Neutral"
                : r.standing >= -49
                ? "Hostile"
                : "Enemy";
            return `${r.name} (${r.standing >= 0 ? "+" : ""}${r.standing} ${label}${r.notes ? `, "${r.notes}"` : ""})`;
          })
          .join("; ")
      : "none";

  const codexStr =
    session.codex?.length > 0
      ? session.codex.map((c) => c.title).join(", ")
      : "none";

  return [
    `Current Location: ${location?.name ?? "Unknown"} — ${location?.shortDesc ?? ""}`,
    `Time of Day: ${session.timeOfDay}`,
    `Weather: ${session.weather}`,
    `World Flags: ${flagsStr}`,
    `NPC Relationships: ${relStr}`,
    `Discovered Lore: ${codexStr}`,
  ].join("\n");
}

export function shouldSummarize(history: HistoryMessage[]): boolean {
  return history.length > 40;
}
