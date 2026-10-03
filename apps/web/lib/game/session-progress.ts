import type { AchievementUnlock, CodexEntry, NpcRelationship } from "@/types/game";
import type { VoiceGender } from "@/types/audio";

/**
 * How a GM turn's achievements, NPC relationships and codex entries are
 * merged into the session. Pure functions, shared by the browser store and
 * the action route (the stored copy), so a resumed save looks exactly like
 * the game the player left. Same pattern as character-reducer.ts.
 */

export interface SessionProgress {
  achievements: AchievementUnlock[];
  relationships: NpcRelationship[];
  codex: CodexEntry[];
}

export interface RelationshipChange {
  npcId: string;
  name: string;
  standing: number;
  notes?: string;
  gender?: VoiceGender;
}

export const MIN_STANDING = -100;
export const MAX_STANDING = 100;

function clampStanding(n: number): number {
  return Math.max(MIN_STANDING, Math.min(MAX_STANDING, Math.round(n)));
}

function isGender(g: unknown): g is VoiceGender {
  return g === "male" || g === "female" || g === "neutral";
}

/** Adds an achievement unless one with the same key is already unlocked. */
export function mergeAchievement(
  achievements: AchievementUnlock[],
  unlock: Omit<AchievementUnlock, "unlockedAt"> & { unlockedAt?: number },
  turn: number,
): AchievementUnlock[] {
  if (achievements.some((a) => a.key === unlock.key)) return achievements;
  return [...achievements, { ...unlock, unlockedAt: unlock.unlockedAt ?? turn }];
}

/**
 * Updates (or adds) an NPC's standing, clamped to -100..100. Notes and
 * gender the GM leaves out this turn keep their earlier values.
 */
export function mergeRelationship(
  relationships: NpcRelationship[],
  change: RelationshipChange,
  turn: number,
): NpcRelationship[] {
  const standing = clampStanding(change.standing);
  const gender = isGender(change.gender) ? change.gender : undefined;
  const idx = relationships.findIndex((r) => r.npcId === change.npcId);
  if (idx < 0) {
    return [
      ...relationships,
      {
        npcId: change.npcId,
        name: change.name,
        standing,
        ...(change.notes ? { notes: change.notes } : {}),
        ...(gender ? { gender } : {}),
        lastSeenTurn: turn,
      },
    ];
  }
  return relationships.map((r, i) =>
    i === idx
      ? {
          ...r,
          name: change.name || r.name,
          standing,
          notes: change.notes ?? r.notes,
          gender: gender ?? r.gender,
          lastSeenTurn: turn,
        }
      : r,
  );
}

/** Adds a codex entry unless its key is already known. */
export function mergeCodexEntry(
  codex: CodexEntry[],
  entry: Omit<CodexEntry, "unlockedAt"> & { unlockedAt?: number },
  turn: number,
): CodexEntry[] {
  if (codex.some((c) => c.key === entry.key)) return codex;
  return [...codex, { ...entry, unlockedAt: entry.unlockedAt ?? turn }];
}

function isAchievement(v: unknown): v is Omit<AchievementUnlock, "unlockedAt"> {
  const a = v as Partial<AchievementUnlock> | null;
  return !!a && typeof a.key === "string" && !!a.key && typeof a.title === "string";
}

function isRelationshipChange(v: unknown): v is RelationshipChange {
  const r = v as Partial<RelationshipChange> | null;
  return (
    !!r &&
    typeof r.npcId === "string" &&
    !!r.npcId &&
    typeof r.name === "string" &&
    typeof r.standing === "number" &&
    Number.isFinite(r.standing)
  );
}

function isCodexEntry(v: unknown): v is Omit<CodexEntry, "unlockedAt"> {
  const c = v as Partial<CodexEntry> | null;
  return !!c && typeof c.key === "string" && !!c.key && typeof c.title === "string" && typeof c.body === "string";
}

/**
 * Applies one turn's achievementUnlocks, npcRelationshipChanges and
 * codexEntries. stateChanges is GM output, so anything malformed is skipped.
 */
export function applySessionProgress(
  progress: SessionProgress,
  changes: Record<string, unknown>,
  turn: number,
): SessionProgress {
  let { achievements, relationships, codex } = progress;
  if (Array.isArray(changes.achievementUnlocks)) {
    for (const a of changes.achievementUnlocks) {
      if (isAchievement(a)) achievements = mergeAchievement(achievements, a, turn);
    }
  }
  if (Array.isArray(changes.npcRelationshipChanges)) {
    for (const r of changes.npcRelationshipChanges) {
      if (isRelationshipChange(r)) relationships = mergeRelationship(relationships, r, turn);
    }
  }
  if (Array.isArray(changes.codexEntries)) {
    for (const c of changes.codexEntries) {
      if (isCodexEntry(c)) codex = mergeCodexEntry(codex, c, turn);
    }
  }
  return { achievements, relationships, codex };
}
