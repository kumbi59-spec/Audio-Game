import { describe, expect, it } from "vitest";
import {
  npcKeyFromName,
  pickVoiceForNpc,
  resolveNpcVoiceAssignment,
  type NpcVoiceAssignment,
} from "./narration-speaker";
import { ELEVENLABS_PRESET_VOICES } from "./voices-catalog";

const FEMALE_VOICES = ELEVENLABS_PRESET_VOICES.filter((v) => v.gender === "female").map((v) => v.id);
const MALE_VOICES = ELEVENLABS_PRESET_VOICES.filter((v) => v.gender === "male").map((v) => v.id);

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
