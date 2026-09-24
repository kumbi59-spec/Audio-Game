import { prisma } from "@/lib/db";

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
      include: {
        gameState: true,
        world: { include: { locations: true, npcs: true } },
        character: { include: { inventory: true, quests: true } },
      },
    }),
    prisma.gameHistoryEntry.findMany({
      where: { sessionId },
      orderBy: { turnNumber: "desc" },
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
    include: { gameState: true },
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

export async function updateGameState(
  sessionId: string,
  ownerId: string,
  patch: {
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
) {
  let npcStatesPatch: string | undefined;
  if (patch.npcStates !== undefined || patch.achievements !== undefined || patch.relationships !== undefined || patch.codex !== undefined) {
    const base: Record<string, unknown> = patch.npcStates ?? {};
    if (patch.achievements !== undefined) base._achievements = patch.achievements;
    if (patch.relationships !== undefined) base._relationships = patch.relationships;
    if (patch.codex !== undefined) base._codex = patch.codex;
    npcStatesPatch = JSON.stringify(base);
  }

  return prisma.gameState.updateMany({
    where: { sessionId, session: { userId: ownerId } },
    data: {
      currentLocationId: patch.currentLocationId,
      timeOfDay: patch.timeOfDay,
      weather: patch.weather,
      globalFlags: patch.globalFlags !== undefined ? JSON.stringify(patch.globalFlags) : undefined,
      npcStates: npcStatesPatch,
      memorySummary: patch.memorySummary,
      lastUpdatedAt: new Date(),
    },
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

export async function countHistoryEntries(sessionId: string) {
  return prisma.gameHistoryEntry.count({ where: { sessionId } });
}

export async function getOldestHistoryEntries(sessionId: string, take: number) {
  return prisma.gameHistoryEntry.findMany({
    where: { sessionId },
    orderBy: { turnNumber: "asc" },
    take,
  });
}
