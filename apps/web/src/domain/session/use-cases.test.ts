import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";
import { describe, expect, it, vi } from "vitest";
import { advanceSession, reconcileOptimisticState, resumeSession, startSession, validateActionEligibility, type SessionBundle } from "./use-cases";

const bundle = {
  session: { id: "s1", turnCount: 2, isGenerating: false, choices: ["Look", "Run"], revision: 4 },
  character: ({ id: "c1", name: "Rook", class: "ranger", race: "human", level: 1, backstory: "", avatarPrompt: "", stats: { hp: 10, maxHp: 10, strength: 1, dexterity: 1, intelligence: 1, charisma: 1, level: 1, experience: 0 }, customStats: {}, inventory: [], quests: [] } as unknown as CharacterData),
  world: ({ id: "w1", name: "Wilds", description: "", locations: [] } as unknown as WorldData),
  dbSessionId: null,
} satisfies SessionBundle;

describe("session domain use-cases", () => {
  it("starts and resumes a session", () => {
    const started = startSession({ ...bundle, dbSessionId: undefined });
    expect(started.dbSessionId).toBeNull();
    const save = vi.fn();
    const resumed = resumeSession(started, { save });
    expect(save).toHaveBeenCalledWith(started.session);
    expect(resumed.session.id).toBe("s1");
  });

  it("validates eligibility branches", () => {
    expect(validateActionEligibility({ session: null, character: bundle.character, world: bundle.world, action: { type: "free_text", content: "go" } }).reason).toBe("missing_context");
    expect(validateActionEligibility({ session: { ...bundle.session, isGenerating: true }, character: bundle.character, world: bundle.world, action: { type: "free_text", content: "go" } }).reason).toBe("turn_in_flight");
    expect(validateActionEligibility({ session: bundle.session, character: bundle.character, world: bundle.world, action: { type: "choice", content: "x", choiceIndex: 4 } }).reason).toBe("invalid_choice");
    expect(validateActionEligibility({ session: bundle.session, character: bundle.character, world: bundle.world, action: { type: "choice", content: "Look", choiceIndex: 0 } }).allowed).toBe(true);
  });

  it("advances through gateway (success/failure)", async () => {
    const okGateway = { submit: vi.fn().mockResolvedValue(new Response(null, { status: 200 })) };
    await expect(advanceSession(okGateway, { ...bundle, action: { type: "free_text", content: "go" }, signal: new AbortController().signal })).resolves.toBeInstanceOf(Response);
    const badGateway = { submit: vi.fn().mockRejectedValue(new Error("network")) };
    await expect(advanceSession(badGateway, { ...bundle, action: { type: "free_text", content: "go" }, signal: new AbortController().signal })).rejects.toThrow("network");
  });

  it("reconciles accepted/conflict version-skew paths", () => {
    expect(reconcileOptimisticState({ optimistic: { hp: 9 }, server: { hp: 10 }, clientRevision: 4, serverRevision: 5 }).status).toBe("accepted");
    const conflict = reconcileOptimisticState({ optimistic: { hp: 9 }, server: { hp: 8 }, clientRevision: 6, serverRevision: 5 });
    expect(conflict.status).toBe("conflict");
  });
});
