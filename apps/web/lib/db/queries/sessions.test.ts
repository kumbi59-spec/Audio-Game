import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  gameSession: { updateMany: vi.fn(), count: vi.fn() },
  character: { updateMany: vi.fn() },
  gameHistoryEntry: { create: vi.fn() },
  gameState: { updateMany: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) },
}));

import { TurnConflictError, commitTurn, type TurnCommit } from "./sessions";

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
