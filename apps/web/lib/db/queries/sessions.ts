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

export async function persistTurn(
  sessionId: string,
  turnNumber: number,
  role: "user" | "assistant",
  content: string,
  actionType?: string | null,
  metadata: Record<string, unknown> = {}
) {
  return prisma.gameHistoryEntry.create({
    data: {
      sessionId,
      turnNumber,
      role,
      content,
      actionType: actionType ?? null,
      metadata: JSON.stringify(metadata),
    },
  });
}

export async function updateGameState(
  sessionId: string,
  patch: {
    currentLocationId?: string | null;
    timeOfDay?: string;
    weather?: string;
    globalFlags?: Record<string, unknown>;
    npcStates?: Record<string, unknown>;
    memorySummary?: string;
  }
) {
  return prisma.gameState.update({
    where: { sessionId },
    data: {
      currentLocationId: patch.currentLocationId,
      timeOfDay: patch.timeOfDay,
      weather: patch.weather,
      globalFlags: patch.globalFlags !== undefined ? JSON.stringify(patch.globalFlags) : undefined,
      npcStates: patch.npcStates !== undefined ? JSON.stringify(patch.npcStates) : undefined,
      memorySummary: patch.memorySummary,
      lastUpdatedAt: new Date(),
    },
  });
}

export async function incrementTurnCount(sessionId: string) {
  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { turnCount: { increment: 1 }, lastPlayedAt: new Date() },
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
