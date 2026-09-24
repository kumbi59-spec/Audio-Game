import { describe, expect, it, vi } from "vitest";
import {
  createOptimisticTurn,
  extractNarrationFromChoiceEvent,
  finalizeTurn,
  normalizeChoiceList,
  retryWithBackoff,
  rollbackTurn,
  sanitizeAction,
  selectChoice,
  withNpcActionDialogue,
  shouldPlaySoundCue,
} from "./use-cases";

describe("game domain use-cases", () => {
  it("normalizes choice labels", () => {
    expect(selectChoice("  Open   the door \n")).toBe("Open the door");
  });

  it("optimistically appends action and supports rollback", () => {
    const base = { isGenerating: false, narrationLog: [], history: [], choices: [] };
    const action = { type: "free_text" as const, content: " inspect altar " };
    const optimistic = createOptimisticTurn(base, action, new Date("2026-01-01T00:00:00Z"));
    expect(optimistic.next.isGenerating).toBe(true);
    expect(optimistic.next.narrationLog.at(-1)?.text).toBe(" inspect altar ");

    const rolled = rollbackTurn(optimistic.next, optimistic.rollback);
    expect(rolled).toEqual(base);
  });

  it("finalizes with normalized choices and history", () => {
    const state = { isGenerating: true, narrationLog: [], history: [], choices: [] };
    const next = finalizeTurn(state, { type: "choice", content: "Run", choiceIndex: 0 }, "You flee.", [" Run ", "Run", "Hide"]);
    expect(next.isGenerating).toBe(false);
    expect(next.choices).toEqual(["Run", "Hide"]);
    expect(next.history).toHaveLength(2);
  });

  it("retries once and then succeeds", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce("ok");

    const pending = retryWithBackoff(fn, 2, 50);
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("rejects invalid edge-case actions", () => {
    expect(sanitizeAction({ type: "free_text", content: "   " })).toBeNull();
    expect(sanitizeAction({ type: "choice", content: "A", choiceIndex: -1 })).toBeNull();
    expect(sanitizeAction({ type: "choice", content: "  A ", choiceIndex: 0 })?.content).toBe("A");
  });

  it("keeps de-dupe behavior", () => {
    expect(normalizeChoiceList(["Talk", "Attack", "Talk", "Run", "Attack"])).toEqual(["Talk", "Attack", "Run"]);
  });

  it("extracts narration and normalizes choices from choices_ready events", () => {
    const result = extractNarrationFromChoiceEvent({
      narration: "You step into the courtyard.",
      choices: [" Run ", "Run", "Hide", " Hide "],
    });
    expect(result.narration).toBe("You step into the courtyard.");
    expect(result.choices).toEqual(["Run", "Hide"]);
  });

  it("guards sound cues by enabled flag, event type, and cue presence", () => {
    expect(shouldPlaySoundCue(true, "sound_cue", "discovery")).toBe(true);
    expect(shouldPlaySoundCue(false, "sound_cue", "discovery")).toBe(false);
    expect(shouldPlaySoundCue(true, "state_change", "discovery")).toBe(false);
    expect(shouldPlaySoundCue(true, "sound_cue", null)).toBe(false);
  });

  describe("withNpcActionDialogue", () => {
    const relationships = [
      { npcId: "village_doctor", name: "Doctor Hale", standing: 0, lastSeenTurn: 1 },
    ];

    it("returns the narration unchanged when there's no npcAction", () => {
      const result = withNpcActionDialogue("Plain prose.", null, relationships);
      expect(result).toBe("Plain prose.");
    });

    it("returns the narration unchanged when npcAction has no dialogue", () => {
      const result = withNpcActionDialogue("Plain prose.", { npcId: "x", action: "watches" }, relationships);
      expect(result).toBe("Plain prose.");
    });

    it("appends a tagged dialogue line when the prose doesn't already contain it", () => {
      const result = withNpcActionDialogue(
        "The doctor sighs at the doorway.",
        { npcId: "village_doctor", action: "offers cellar", dialogue: "There's a root cellar." },
        relationships,
      );
      // The "voices not switching" bug: GM puts dialogue only in npcAction
      // and we used to lose it. The fix is to tag it inline so the multi-
      // voice player can route it to the NPC's voice.
      expect(result).toBe('The doctor sighs at the doorway. [Doctor Hale]: "There\'s a root cellar."');
    });

    it("tags an inline quoted dialogue in place rather than appending", () => {
      const result = withNpcActionDialogue(
        'The doctor leans in. "There\'s a root cellar." She looks away.',
        { npcId: "village_doctor", action: "offers cellar", dialogue: "There's a root cellar." },
        relationships,
      );
      expect(result).toBe('The doctor leans in. [Doctor Hale]: "There\'s a root cellar." She looks away.');
    });

    it("leaves the prose alone when a [Name]: tag is already present", () => {
      // Trust the GM when it tagged correctly — don't double-tag.
      const tagged = '[Doctor Hale]: "There\'s a root cellar." The doctor steps back.';
      const result = withNpcActionDialogue(
        tagged,
        { npcId: "village_doctor", action: "offers cellar", dialogue: "There's a root cellar." },
        relationships,
      );
      expect(result).toBe(tagged);
    });

    it("falls back to a prettified npcId when no matching relationship is known", () => {
      const result = withNpcActionDialogue(
        "Someone speaks from the shadow.",
        { npcId: "shadow_figure", action: "whispers", dialogue: "Wait." },
        [],
      );
      expect(result).toBe('Someone speaks from the shadow. [Shadow Figure]: "Wait."');
    });

    it("adds a sentence boundary when the prose doesn't end with terminal punctuation", () => {
      const result = withNpcActionDialogue(
        "The doctor pauses mid-thought",
        { npcId: "village_doctor", action: "speaks", dialogue: "Wait." },
        relationships,
      );
      expect(result).toBe('The doctor pauses mid-thought. [Doctor Hale]: "Wait."');
    });
  });
});
