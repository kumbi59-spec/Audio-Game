import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  gameSession: { updateMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
  character: { updateMany: vi.fn(), deleteMany: vi.fn() },
  gameHistoryEntry: { create: vi.fn(), deleteMany: vi.fn() },
  gameState: { updateMany: vi.fn(), deleteMany: vi.fn() },
  inventoryItem: { deleteMany: vi.fn() },
  quest: { deleteMany: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) },
}));

import { TurnConflictError, commitTurn, deleteOwnedSession, type TurnCommit } from "./sessions";

const commit: TurnCommit = {
  expectedTurnCount: 4,
  characterId: "char",
  character: { id: "char", name: "Mara" } as TurnCommit["character"],
  undoSnapshot: null,
  playerAction: { content: "open the door", actionType: "free_text" },
  gmReply: '{"narration":"It creaks."}',
  gameState: { weather: "storm" },
};

describe("commitTurn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves the turn as the next one when the turn count still matches", async () => {
    tx.gameSession.updateMany.mockResolvedValue({ count: 1 });
    expect(await commitTurn("sess", "owner", commit)).toBe(5);
    expect(tx.gameSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "sess", userId: "owner", turnCount: 4 },
    }));
    expect(tx.gameHistoryEntry.create).toHaveBeenCalledTimes(2);
    expect(tx.gameState.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ weather: "storm" }),
    }));
  });

  it("refuses a turn when another one was saved first, writing nothing else", async () => {
    tx.gameSession.updateMany.mockResolvedValue({ count: 0 });
    tx.gameSession.count.mockResolvedValue(1);
    await expect(commitTurn("sess", "owner", commit)).rejects.toBeInstanceOf(TurnConflictError);
    expect(tx.character.updateMany).not.toHaveBeenCalled();
    expect(tx.gameHistoryEntry.create).not.toHaveBeenCalled();
  });

  it("tells a missing or someone else's session apart from a conflict", async () => {
    tx.gameSession.updateMany.mockResolvedValue({ count: 0 });
    tx.gameSession.count.mockResolvedValue(0);
    await expect(commitTurn("sess", "owner", commit)).rejects.toThrow("Session not found for owner");
  });
});

describe("deleteOwnedSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the save's history, state and session, and its now-unused character", async () => {
    tx.gameSession.findFirst.mockResolvedValue({ characterId: "char" });
    tx.gameSession.count.mockResolvedValue(0);

    expect(await deleteOwnedSession("sess", "user")).toBe(true);
    expect(tx.gameSession.findFirst).toHaveBeenCalledWith({ where: { id: "sess", userId: "user" }, select: { characterId: true } });
    expect(tx.gameHistoryEntry.deleteMany).toHaveBeenCalledWith({ where: { sessionId: "sess" } });
    expect(tx.gameState.deleteMany).toHaveBeenCalledWith({ where: { sessionId: "sess" } });
    expect(tx.gameSession.delete).toHaveBeenCalledWith({ where: { id: "sess" } });
    expect(tx.inventoryItem.deleteMany).toHaveBeenCalledWith({ where: { characterId: "char" } });
    expect(tx.quest.deleteMany).toHaveBeenCalledWith({ where: { characterId: "char" } });
    expect(tx.character.deleteMany).toHaveBeenCalledWith({ where: { id: "char", userId: "user" } });
  });

  it("keeps a character another save still uses", async () => {
    tx.gameSession.findFirst.mockResolvedValue({ characterId: "char" });
    tx.gameSession.count.mockResolvedValue(1);

    expect(await deleteOwnedSession("sess", "user")).toBe(true);
    expect(tx.gameSession.delete).toHaveBeenCalled();
    expect(tx.character.deleteMany).not.toHaveBeenCalled();
    expect(tx.inventoryItem.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes nothing when the save isn't the player's", async () => {
    tx.gameSession.findFirst.mockResolvedValue(null);

    expect(await deleteOwnedSession("sess", "someone-else")).toBe(false);
    expect(tx.gameHistoryEntry.deleteMany).not.toHaveBeenCalled();
    expect(tx.gameState.deleteMany).not.toHaveBeenCalled();
    expect(tx.gameSession.delete).not.toHaveBeenCalled();
  });
});
