import { describe, expect, it, vi } from "vitest";
import {
  speakNarrationMultiVoice,
  npcKeyFromName,
  npcResolvablePrefix,
  npcVoicesResolvable,
  parseNarrationSegments,
  splitForTts,
  pickVoiceForNpc,
  resolveNpcVoiceAssignment,
  type NpcVoiceAssignment,
} from "./narration-speaker";
import { ELEVENLABS_PRESET_VOICES } from "./voices-catalog";

const FEMALE_VOICES = ELEVENLABS_PRESET_VOICES.filter((v) => v.gender === "female").map((v) => v.id);
const MALE_VOICES = ELEVENLABS_PRESET_VOICES.filter((v) => v.gender === "male").map((v) => v.id);

describe("parseNarrationSegments", () => {
  it("keeps contractions inside a double-quoted line", () => {
    const segs = parseNarrationSegments(
      'The guard steps forward. [Captain Voss]: "Don\'t move. I won\'t ask twice." You freeze.',
      "Ash",
    );
    expect(segs).toEqual([
      { text: "The guard steps forward.", speaker: "narrator" },
      { text: "Don't move. I won't ask twice.", speaker: "npc", npcName: "Captain Voss" },
      { text: "You freeze.", speaker: "narrator" },
    ]);
  });

  it("accepts curly double quotes", () => {
    const segs = parseNarrationSegments("[Mara]: \u201CThat\u2019s my boat.\u201D", "Ash");
    expect(segs).toEqual([{ text: "That\u2019s my boat.", speaker: "npc", npcName: "Mara" }]);
  });

  it("only closes a single-quoted line on a quote that isn't part of a word", () => {
    const segs = parseNarrationSegments("[Mara]: 'You can't stay here.' She turns away.", "Ash");
    expect(segs).toEqual([
      { text: "You can't stay here.", speaker: "npc", npcName: "Mara" },
      { text: "She turns away.", speaker: "narrator" },
    ]);
  });

  it("marks the player character's own lines", () => {
    const segs = parseNarrationSegments('[Ash]: "I\'m not going back."', "ash");
    expect(segs).toEqual([{ text: "I'm not going back.", speaker: "character", npcName: undefined }]);
  });
});

describe("npcKeyFromName", () => {
  it("lowercases and trims", () => {
    expect(npcKeyFromName("  CAPTAIN Voss  ")).toBe("captain voss");
  });

  it("strips leading articles so 'The Village Doctor' and 'village doctor' share a key", () => {
    expect(npcKeyFromName("The Village Doctor")).toBe("village doctor");
    expect(npcKeyFromName("village doctor")).toBe("village doctor");
    expect(npcKeyFromName("A Witch")).toBe("witch");
    expect(npcKeyFromName("An Innkeeper")).toBe("innkeeper");
  });

  it("collapses internal whitespace", () => {
    expect(npcKeyFromName("Captain    Voss")).toBe("captain voss");
  });
});

describe("pickVoiceForNpc", () => {
  it("picks a female voice for a female NPC", () => {
    const picked = pickVoiceForNpc("female", new Map(), []);
    expect(FEMALE_VOICES).toContain(picked);
  });

  it("picks a male voice for a male NPC", () => {
    const picked = pickVoiceForNpc("male", new Map(), []);
    expect(MALE_VOICES).toContain(picked);
  });

  it("biases toward least-used voices so 4 female NPCs get distinct voices", () => {
    const assignments = new Map<string, NpcVoiceAssignment>();
    const picks = new Set<string>();
    // There are exactly 4 female preset voices — assigning 4 distinct
    // female NPCs should use each one once before any voice repeats.
    for (let i = 0; i < FEMALE_VOICES.length; i++) {
      const voiceId = pickVoiceForNpc("female", assignments, []);
      picks.add(voiceId);
      assignments.set(`npc${i}`, { voiceId, gender: "female" });
    }
    expect(picks.size).toBe(FEMALE_VOICES.length);
  });

  it("excludes narrator and player voices so NPCs sound distinct", () => {
    const narratorId = ELEVENLABS_PRESET_VOICES[0]!.id;
    const playerId = ELEVENLABS_PRESET_VOICES[1]!.id;
    // Even with no existing assignments, the picker must avoid the
    // narrator/player voices when other catalog voices remain.
    for (let i = 0; i < 5; i++) {
      const picked = pickVoiceForNpc("neutral", new Map(), [], [narratorId, playerId]);
      expect(picked).not.toBe(narratorId);
      expect(picked).not.toBe(playerId);
    }
  });

  it("respects the user's allowed voice pool when non-empty", () => {
    const allowed = [MALE_VOICES[0]!, MALE_VOICES[1]!];
    const picked = pickVoiceForNpc("male", new Map(), allowed);
    expect(allowed).toContain(picked);
  });

  it("falls back to the full pool if gender filter empties the set", () => {
    // Pool with only male voices, requesting female → no gender match. Should
    // fall back to the allowed pool rather than throw or return undefined.
    const malePool = MALE_VOICES.slice(0, 2);
    const picked = pickVoiceForNpc("female", new Map(), malePool);
    expect(malePool).toContain(picked);
  });
});

describe("resolveNpcVoiceAssignment", () => {
  it("returns the same voice for the same NPC across calls", () => {
    const assignments = new Map<string, NpcVoiceAssignment>();
    const first = resolveNpcVoiceAssignment("Maria", "female", assignments, [], []);
    const second = resolveNpcVoiceAssignment("Maria", "female", assignments, [], []);
    expect(second.voiceId).toBe(first.voiceId);
    expect(second.isNew).toBe(false);
  });

  it("normalizes the lookup key so 'The Witch' and 'witch' share a voice", () => {
    const assignments = new Map<string, NpcVoiceAssignment>();
    const first = resolveNpcVoiceAssignment("The Witch", "female", assignments, [], []);
    const second = resolveNpcVoiceAssignment("witch", "female", assignments, [], []);
    expect(second.voiceId).toBe(first.voiceId);
    expect(second.isNew).toBe(false);
  });

  it("flags brand-new assignments as isNew=true so the caller can persist", () => {
    const assignments = new Map<string, NpcVoiceAssignment>();
    const first = resolveNpcVoiceAssignment("Bob", "male", assignments, [], []);
    expect(first.isNew).toBe(true);
    const second = resolveNpcVoiceAssignment("Bob", "male", assignments, [], []);
    expect(second.isNew).toBe(false);
  });

  it("uses the gender from the FIRST call for voice picking", () => {
    // The picker should commit to a gender on first encounter and stick.
    // If the GM later mis-emits gender, the existing assignment wins.
    const assignments = new Map<string, NpcVoiceAssignment>();
    const first = resolveNpcVoiceAssignment("Maria", "female", assignments, [], []);
    expect(FEMALE_VOICES).toContain(first.voiceId);
    const second = resolveNpcVoiceAssignment("Maria", "male", assignments, [], []);
    expect(second.voiceId).toBe(first.voiceId);
  });
});

describe("npcVoicesResolvable", () => {
  it("is true only when every speaking NPC has a voice or a gender hint", () => {
    const assignments = new Map<string, NpcVoiceAssignment>([["captain voss", { voiceId: "v1", gender: "male" }]]);
    const hints = new Map([["imp", "neutral" as const]]);
    expect(npcVoicesResolvable('[Captain Voss]: "Halt." [Imp]: "Hee."', "Mara", assignments, hints)).toBe(true);
    expect(npcVoicesResolvable('[The Stranger]: "Hello."', "Mara", assignments, hints)).toBe(false);
    expect(npcVoicesResolvable('Prose only. [Mara]: "Me."', "Mara", new Map(), new Map())).toBe(true);
  });
});

describe("speakNarrationMultiVoice", () => {
  it("fetches the next voice's audio while the current one plays", async () => {
    const order: string[] = [];
    const speakFn = vi.fn(async (text: string) => { order.push(`speak:${text}`); });
    const prefetchFn = vi.fn((text: string) => { order.push(`prefetch:${text}`); });

    await speakNarrationMultiVoice(
      'The guard steps forward. [Captain Voss]: "Halt." You stop.',
      "Mara",
      new Map(),
      () => "male",
      () => undefined,
      new AbortController().signal,
      speakFn,
      prefetchFn,
    );

    expect(order).toEqual([
      'prefetch:Halt.',
      "speak:The guard steps forward.",
      "prefetch:You stop.",
      "speak:Halt.",
      "speak:You stop.",
    ]);
  });
});

describe("npcResolvablePrefix", () => {
  it("stops at the first line by an NPC with no voice or gender yet", () => {
    const text = 'Rain. [Mara]: "Over here." [Voss]: "Halt." End.';
    const hints = new Map([["mara", "female" as const]]);
    expect(npcResolvablePrefix(text, "Ash", new Map(), hints)).toBe(text.indexOf("[Voss]"));
    expect(npcResolvablePrefix(text, "Ash", new Map(), new Map([...hints, ["voss", "male" as const]]))).toBe(text.length);
  });

  it("never waits on the player character's own lines", () => {
    const text = '[Ash]: "Go."';
    expect(npcResolvablePrefix(text, "Ash", new Map(), new Map())).toBe(text.length);
  });
});

describe("splitForTts", () => {
  it("leaves short text alone", () => {
    expect(splitForTts("One line.")).toEqual(["One line."]);
  });

  it("splits long text at sentence ends under the limit", () => {
    const sentence = "The tide turns slowly. ";
    const chunks = splitForTts(sentence.repeat(20), 100);
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
    expect(chunks.every((c) => c.endsWith("."))).toBe(true);
    expect(chunks.join(" ")).toBe(sentence.repeat(20).trim());
  });
});

