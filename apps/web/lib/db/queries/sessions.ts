import { prisma } from "@/lib/db";
import type { CharacterData } from "@/types/character";
import { characterProgressData } from "./characters";

export async function createDbSession(
  worldId: string,
  userId: string,
  characterId: string,
  startingLocationId: string | null = null
) {
  return prisma.gameSession.create({
    data: {
      worldId,
      userId,
      characterId,
      gameState: {
        create: {
          currentLocationId: startingLocationId,
          globalFlags: "{}",
          npcStates: "{}",
          memorySummary: "",
        },
      },
    },
    include: { gameState: true },
  });
}

export async function getSessionWithHistory(sessionId: string, recentTurns = 40) {
  const [session, history] = await Promise.all([
    prisma.gameSession.findUnique({
      where: { id: sessionId },
      // The world is loaded through resolvePlayableWorld by the caller.
      include: {
        gameState: true,
        character: { include: { inventory: true, quests: true } },
      },
    }),
    prisma.gameHistoryEntry.findMany({
      where: { sessionId },
      // Within a turn, "assistant" sorts before "user"; reversed below, the
      // player's action comes first.
      orderBy: [{ turnNumber: "desc" }, { role: "asc" }],
      take: recentTurns,
    }),
  ]);
  return { session, history: history.reverse() };
}

export async function listUserSessions(userId: string) {
  return prisma.gameSession.findMany({
    where: { userId, status: "active" },
    include: {
      world: { select: { id: true, name: true, genre: true } },
      gameState: { select: { currentLocationId: true } },
    },
    orderBy: { lastPlayedAt: "desc" },
    take: 10,
  });
}

/**
 * Loads a session only if it belongs to `userId`. Game routes must resolve the
 * session through this before invoking the model or writing any turn data.
 */
export async function getOwnedSession(sessionId: string, userId: string) {
  return prisma.gameSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      gameState: true,
      character: { select: { id: true, snapshot: true } },
    },
  });
}

export async function persistTurn(
  sessionId: string,
  ownerId: string,
  turnNumber: number,
  role: "user" | "assistant",
  content: string,
  actionType?: string | null,
  metadata: Record<string, unknown> = {}
) {
  return prisma.$transaction(async (tx) => {
    const owned = await tx.gameSession.count({ where: { id: sessionId, userId: ownerId } });
    if (owned === 0) throw new Error("Session not found for owner");
    return tx.gameHistoryEntry.create({
      data: {
        sessionId,
        turnNumber,
        role,
        content,
        actionType: actionType ?? null,
        metadata: JSON.stringify(metadata),
      },
    });
  });
}

export interface GameStatePatch {
  currentLocationId?: string | null;
  timeOfDay?: string;
  weather?: string;
  globalFlags?: Record<string, unknown>;
  npcStates?: Record<string, unknown>;
  memorySummary?: string;
  achievements?: unknown[];
  relationships?: unknown[];
  codex?: unknown[];
}

/** The GameState columns a patch writes (achievements etc. live in npcStates). */
function gameStateData(patch: GameStatePatch) {
  let npcStatesPatch: string | undefined;
  if (patch.npcStates !== undefined || patch.achievements !== undefined || patch.relationships !== undefined || patch.codex !== undefined) {
    const base: Record<string, unknown> = { ...(patch.npcStates ?? {}) };
    if (patch.achievements !== undefined) base._achievements = patch.achievements;
    if (patch.relationships !== undefined) base._relationships = patch.relationships;
    if (patch.codex !== undefined) base._codex = patch.codex;
    npcStatesPatch = JSON.stringify(base);
  }
  return {
    currentLocationId: patch.currentLocationId,
    timeOfDay: patch.timeOfDay,
    weather: patch.weather,
    globalFlags: patch.globalFlags !== undefined ? JSON.stringify(patch.globalFlags) : undefined,
    npcStates: npcStatesPatch,
    memorySummary: patch.memorySummary,
    lastUpdatedAt: new Date(),
  };
}

export async function updateGameState(sessionId: string, ownerId: string, patch: GameStatePatch) {
  return prisma.gameState.updateMany({
    where: { sessionId, session: { userId: ownerId } },
    data: gameStateData(patch),
  });
}

/** Another request already saved a turn on this session since this one read it. */
export class TurnConflictError extends Error {
  constructor() {
    super("turn_conflict");
    this.name = "TurnConflictError";
  }
}

export interface TurnCommit {
  /** The session's turn count when this turn read it; the turn is saved as the next one. */
  expectedTurnCount: number;
  characterId: string;
  /** The character after this turn. */
  character: CharacterData;
  /** What this turn changes, as it stood before, so the turn can be undone. */
  undoSnapshot: UndoSnapshot | null;
  playerAction: { content: string; actionType: string };
  /** The GM's reply as stored history; null when there was none. */
  gmReply: string | null;
  gameState: GameStatePatch | null;
}

/**
 * Saves one turn as a whole, or not at all: the turn count, undo snapshot,
 * character progress, both history entries and the game state are written in
 * one transaction. The turn is only saved when the session still has the turn
 * count this request read (compare-and-set), so two turns played on one save
 * at once can't both apply to the same starting state; the second gets a
 * TurnConflictError. Returns the new turn number.
 */
export async function commitTurn(sessionId: string, ownerId: string, commit: TurnCommit): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.gameSession.updateMany({
      where: { id: sessionId, userId: ownerId, turnCount: commit.expectedTurnCount },
      data: { turnCount: commit.expectedTurnCount + 1, lastPlayedAt: new Date() },
    });
    if (claimed.count === 0) {
      const owned = await tx.gameSession.count({ where: { id: sessionId, userId: ownerId } });
      if (owned === 0) throw new Error("Session not found for owner");
      throw new TurnConflictError();
    }
    const turnNumber = commit.expectedTurnCount + 1;

    await tx.character.updateMany({
      where: { id: commit.characterId, userId: ownerId },
      data: characterProgressData(commit.character),
    });
    await tx.gameHistoryEntry.create({
      data: {
        sessionId,
        turnNumber,
        role: "user",
        content: commit.playerAction.content,
        actionType: commit.playerAction.actionType,
        metadata: "{}",
      },
    });
    if (commit.gmReply) {
      await tx.gameHistoryEntry.create({
        data: { sessionId, turnNumber, role: "assistant", content: commit.gmReply, actionType: null, metadata: "{}" },
      });
    }
    if (commit.gameState || commit.undoSnapshot) {
      await tx.gameState.updateMany({
        where: { sessionId },
        data: {
          ...(commit.gameState ? gameStateData(commit.gameState) : {}),
          ...(commit.undoSnapshot ? { undoSnapshot: JSON.stringify(commit.undoSnapshot) } : {}),
        },
      });
    }
    return turnNumber;
  });
}

/**
 * Atomically claims the next turn number for an owned session. Returns null
 * when the session does not exist or is not owned by `ownerId`.
 */
export async function incrementTurnCount(sessionId: string, ownerId: string): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.gameSession.updateMany({
      where: { id: sessionId, userId: ownerId },
      data: { turnCount: { increment: 1 }, lastPlayedAt: new Date() },
    });
    if (updated.count === 0) return null;
    const row = await tx.gameSession.findUnique({ where: { id: sessionId }, select: { turnCount: true } });
    return row?.turnCount ?? null;
  });
}

/**
 * History rows for turns in (fromExclusive, toInclusive], oldest first, with
 * the player's action before the GM's reply within each turn.
 */
export async function getHistoryEntriesInTurnRange(
  sessionId: string,
  fromExclusive: number,
  toInclusive: number,
) {
  return prisma.gameHistoryEntry.findMany({
    where: { sessionId, turnNumber: { gt: fromExclusive, lte: toInclusive } },
    // "user" sorts after "assistant", so desc puts the action first.
    orderBy: [{ turnNumber: "asc" }, { role: "desc" }],
  });
}

/**
 * Stores a new memory summary and advances the summarised-through marker,
 * but only if no other request advanced it first (compare-and-set on
 * `expectedThrough`). Returns whether this call applied.
 */
export async function markSummarized(
  sessionId: string,
  ownerId: string,
  expectedThrough: number,
  newThrough: number,
  memorySummary: string,
): Promise<boolean> {
  const result = await prisma.gameState.updateMany({
    where: { sessionId, summarizedThroughTurn: expectedThrough, session: { userId: ownerId } },
    data: { memorySummary, summarizedThroughTurn: newThrough, lastUpdatedAt: new Date() },
  });
  return result.count > 0;
}

/** What a session looked like before its last turn, for undo. */
export interface UndoSnapshot {
  turnCount: number;
  gameState: {
    currentLocationId: string | null;
    timeOfDay: string;
    weather: string;
    globalFlags: string;
    npcStates: string;
    memorySummary: string;
    summarizedThroughTurn: number;
  };
  /** Null when the character had no stored progress before the turn. */
  character: CharacterData | null;
}

export async function setUndoSnapshot(sessionId: string, ownerId: string, snapshot: UndoSnapshot) {
  return prisma.gameState.updateMany({
    where: { sessionId, session: { userId: ownerId } },
    data: { undoSnapshot: JSON.stringify(snapshot) },
  });
}

function parseUndoSnapshot(raw: string | null | undefined): UndoSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UndoSnapshot;
    return typeof parsed?.turnCount === "number" && parsed.gameState && typeof parsed.gameState === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export type UndoResult =
  | { ok: true; character: CharacterData | null }
  | { ok: false; reason: "not_found" | "nothing_to_undo" };

/**
 * Rolls an owned session back to before its last turn: removes that turn's
 * history, and restores the turn count, game state and character progress.
 * Single-step — the snapshot is cleared once used.
 */
export async function undoLastTurn(sessionId: string, ownerId: string): Promise<UndoResult> {
  return prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.findFirst({
      where: { id: sessionId, userId: ownerId },
      include: { gameState: true },
    });
    if (!session) return { ok: false, reason: "not_found" } as const;
    const snapshot = parseUndoSnapshot(session.gameState?.undoSnapshot);
    if (!snapshot) return { ok: false, reason: "nothing_to_undo" } as const;

    await tx.gameHistoryEntry.deleteMany({ where: { sessionId, turnNumber: { gt: snapshot.turnCount } } });
    await tx.gameSession.update({ where: { id: sessionId }, data: { turnCount: snapshot.turnCount } });
    await tx.gameState.update({
      where: { sessionId },
      data: { ...snapshot.gameState, undoSnapshot: null, lastUpdatedAt: new Date() },
    });
    if (snapshot.character) {
      await tx.character.updateMany({
        where: { id: session.characterId, userId: ownerId },
        data: characterProgressData(snapshot.character),
      });
    }
    return { ok: true, character: snapshot.character } as const;
  });
}
