import { beforeEach, describe, expect, it, vi } from "vitest";
import { sunkenBellStartingState, type ChoiceOption } from "@audio-rpg/shared";

vi.mock("@/audio/narrator", () => ({
  configureNarrator: vi.fn(),
  resetNpcVoiceMap: vi.fn(),
  updateNpcVoiceMap: vi.fn(),
}));
vi.mock("@/audio/cues", () => ({ setCuePreferences: vi.fn() }));

import { resetNpcVoiceMap } from "@/audio/narrator";
import { usePrefs } from "@/prefs/store";
import { useSession } from "./store";

const CHOICES: ChoiceOption[] = [
  { id: "c1", label: "Open the door" },
  { id: "c2", label: "Walk away" },
];

function join(turnNumber = 3): void {
  useSession.getState().joined({
    campaignId: "camp-1",
    authToken: "token-1",
    title: "The Sunken Bell",
    state: { ...sunkenBellStartingState("Wren"), turn_number: turnNumber },
  });
}

describe("session store", () => {
  beforeEach(() => {
    useSession.getState().reset();
    vi.mocked(resetNpcVoiceMap).mockClear();
  });

  it("applies state_delta at the turn's own number, as the server does", () => {
    join(3);
    useSession.getState().handleEvent({
      type: "state_delta",
      turnId: "t4",
      mutations: [
        { op: "achievement.unlock", key: "bell", title: "Bell ringer", description: "Rang it." },
        { op: "codex.unlock", key: "bell_lore", title: "The bell", body: "Old." },
      ],
    });
    const state = useSession.getState().state!;
    expect(state.achievements.find((a) => a.key === "bell")?.unlocked_turn).toBe(4);
    expect(state.codex.find((c) => c.key === "bell_lore")?.unlocked_turn).toBe(4);
    // turn_complete, not the delta, advances the counter.
    expect(state.turn_number).toBe(3);
    useSession.getState().handleEvent({ type: "turn_complete", turnId: "t4", turnNumber: 4 });
    expect(useSession.getState().state?.turn_number).toBe(4);
  });

  it("keeps input locked after the narration's done chunk until turn_complete", () => {
    join();
    useSession.getState().appendPlayer("Open the door");
    const s = () => useSession.getState();
    s().handleEvent({ type: "narration_chunk", turnId: "t4", text: "The door creaks.", done: false });
    s().handleEvent({ type: "narration_chunk", turnId: "t4", text: "", done: true });
    expect(s().awaitingGm).toBe(true);
    s().handleEvent({ type: "turn_complete", turnId: "t4", turnNumber: 4 });
    expect(s().awaitingGm).toBe(false);
  });

  it("restores the choices an input cleared when the server rejects it", () => {
    join();
    const s = () => useSession.getState();
    s().handleEvent({ type: "choice_list", turnId: "t3", choices: CHOICES, acceptsFreeform: true });
    s().appendPlayer("Open the door");
    expect(s().choices).toEqual([]);
    s().handleEvent({
      type: "error",
      code: "turn_in_progress",
      message: "Another player's turn is in progress. Please wait.",
      recoverable: true,
    });
    expect(s().choices).toEqual(CHOICES);
    expect(s().awaitingGm).toBe(false);
    expect(s().lastError).toMatch(/in progress/);

    // The next narration clears the error.
    s().appendPlayer("Open the door");
    s().handleEvent({ type: "narration_chunk", turnId: "t4", text: "It opens.", done: false });
    expect(s().lastError).toBeNull();
  });

  it("does not bring back old choices over a fallback list sent before the error", () => {
    join();
    const s = () => useSession.getState();
    s().handleEvent({ type: "choice_list", turnId: "t3", choices: CHOICES, acceptsFreeform: true });
    s().appendPlayer("Open the door");
    const fallback: ChoiceOption[] = [{ id: "fallback_0", label: "Look around" }];
    s().handleEvent({ type: "choice_list", turnId: "t4", choices: fallback, acceptsFreeform: true });
    s().handleEvent({
      type: "error",
      code: "turn_failed",
      message: "The GM couldn't respond. Your input was saved.",
      recoverable: true,
    });
    expect(s().choices).toEqual(fallback);
  });

  it("clears NPC voices and saves the session token on join, and clears voices on reset", () => {
    join();
    expect(resetNpcVoiceMap).toHaveBeenCalledTimes(1);
    expect(usePrefs.getState().sessionTokens["camp-1"]).toBe("token-1");
    useSession.getState().reset();
    expect(resetNpcVoiceMap).toHaveBeenCalledTimes(2);
  });

  it("releases input when the socket drops", () => {
    join();
    useSession.getState().setConnected(true);
    useSession.getState().appendPlayer("Open the door");
    useSession.getState().setConnected(false);
    expect(useSession.getState().awaitingGm).toBe(false);
  });
});
