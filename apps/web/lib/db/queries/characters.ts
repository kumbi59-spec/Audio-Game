import { prisma } from "@/lib/db";
import type { CharacterClass, CharacterData, QuestData } from "@/types/character";

const CLASSES: readonly CharacterClass[] = ["warrior", "rogue", "mage", "ranger", "bard"];

function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function looksLikeCharacter(value: unknown): value is Omit<CharacterData, "id"> {
  const v = value as Partial<CharacterData> | null;
  return (
    !!v &&
    typeof v === "object" &&
    typeof v.name === "string" &&
    !!v.stats &&
    typeof v.stats === "object" &&
    typeof v.stats.hp === "number" &&
    Array.isArray(v.inventory) &&
    Array.isArray(v.quests)
  );
}

export interface CharacterRow {
  id: string;
  name: string;
  class: string;
  backstory: string;
  stats: string;
  snapshot: string | null;
  inventory?: Array<{ id: string; name: string; description: string; category: string; quantity: number; properties: string }>;
  quests?: Array<{ id: string; title: string; description: string; status: string; objectives: string; reward: string | null }>;
}

/** The stored character's progress, or null when it has never been saved. */
export function characterSnapshotFromRow(row: Pick<CharacterRow, "id" | "snapshot">): CharacterData | null {
  const parsed = parseJson(row.snapshot);
  return looksLikeCharacter(parsed) ? { ...parsed, id: row.id } : null;
}

/**
 * The stored character: its snapshot when there is one, otherwise rebuilt
 * from the columns written when it was created (characters saved before
 * snapshots existed).
 */
export function characterFromRow(row: CharacterRow): CharacterData {
  const snapshot = characterSnapshotFromRow(row);
  if (snapshot) return snapshot;
  const stats = parseJson(row.stats) as CharacterData["stats"] | null;
  return {
    id: row.id,
    name: row.name,
    class: (CLASSES as readonly string[]).includes(row.class) ? (row.class as CharacterClass) : "warrior",
    backstory: row.backstory,
    stats: {
      hp: 10, maxHp: 10, strength: 10, dexterity: 10, intelligence: 10, charisma: 10, level: 1, experience: 0,
      ...(stats ?? {}),
    },
    inventory: (row.inventory ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: (["weapon", "armor", "consumable", "key", "misc"].includes(item.category)
        ? item.category
        : "misc") as CharacterData["inventory"][number]["category"],
      quantity: item.quantity,
      properties: (parseJson(item.properties) as Record<string, unknown> | null) ?? {},
    })),
    quests: (row.quests ?? []).map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      status: (["active", "completed", "failed", "abandoned"].includes(q.status) ? q.status : "active") as QuestData["status"],
      objectives: Array.isArray(parseJson(q.objectives)) ? (parseJson(q.objectives) as QuestData["objectives"]) : [],
      reward: q.reward,
    })),
  };
}

function snapshotJson(character: CharacterData): string {
  // The row id is the character's id; don't store a second copy that could
  // drift from it.
  const { id: _id, ...rest } = character;
  return JSON.stringify(rest);
}

/**
 * Creates the character row for a new session. Every session gets its own
 * row with a server-generated id, so progress in one campaign never leaks
 * into another and a client can't point a session at someone else's
 * character.
 */
export async function createSessionCharacter(userId: string, character: CharacterData) {
  return prisma.character.create({
    data: {
      userId,
      name: character.name,
      class: character.class,
      backstory: character.backstory,
      stats: JSON.stringify(character.stats),
      snapshot: snapshotJson(character),
    },
  });
}

/** Column values that store `character` as the row's current progress. */
export function characterProgressData(character: CharacterData) {
  return { stats: JSON.stringify(character.stats), snapshot: snapshotJson(character) };
}

/** Stores the character's current progress. Owner-scoped; returns whether it applied. */
export async function saveCharacterSnapshot(
  characterId: string,
  ownerId: string,
  character: CharacterData,
): Promise<boolean> {
  const result = await prisma.character.updateMany({
    where: { id: characterId, userId: ownerId },
    data: characterProgressData(character),
  });
  return result.count > 0;
}
