import type { HistoryMessage, InMemorySession } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";

const APPROX_CHARS_PER_TOKEN = 4;
const MAX_HISTORY_TOKENS = 40_000;
const MAX_HISTORY_CHARS = MAX_HISTORY_TOKENS * APPROX_CHARS_PER_TOKEN;

export function buildContextMessages(
  session: InMemorySession,
  character: CharacterData,
  world: WorldData
): HistoryMessage[] {
  const messages: HistoryMessage[] = [...session.history];

  // Anthropic requires the first message to have role "user"; drop any leading
  // assistant messages that may have been stored from the opening narration.
  while (messages.length > 0 && messages[0]?.role === "assistant") {
    messages.shift();
  }

  // Trim to fit within the token budget
  let totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  while (totalChars > MAX_HISTORY_CHARS && messages.length > 2) {
    const removed = messages.shift();
    if (removed) totalChars -= removed.content.length;
  }

  return messages;
}

export function buildCharacterStateBlock(character: CharacterData): string {
  const s = character.stats;
  const activeQuests = character.quests
    .filter((q) => q.status === "active")
    .map((q) => q.title)
    .join(", ") || "None";
  const items = character.inventory
    .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
    .join(", ") || "Nothing";

  return [
    `Name: ${character.name}`,
    character.pronouns ? `Pronouns: ${character.pronouns}` : "",
    typeof character.age === "number" ? `Age: ${character.age}` : "",
    character.shortDescription ? `Description: ${character.shortDescription}` : "",
    `Class: ${character.class}`,
    `HP: ${s.hp}/${s.maxHp} | Level: ${s.level} | XP: ${s.experience}`,
    `STR:${s.strength} DEX:${s.dexterity} INT:${s.intelligence} CHA:${s.charisma}`,
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
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ") || "none";

  return [
    `Current Location: ${location?.name ?? "Unknown"} — ${location?.shortDesc ?? ""}`,
    `Time of Day: ${session.timeOfDay}`,
    `Weather: ${session.weather}`,
    `World Flags: ${flagsStr}`,
  ].join("\n");
}

export function shouldSummarize(history: HistoryMessage[]): boolean {
  return history.length > 40;
}
