import { describe, expect, it } from "vitest";
import type { GameBible } from "@audio-rpg/shared";
import { chunkBible, chunkText } from "./embeddings.js";

function fullBible(): GameBible {
  return {
    version: 1,
    title: "The Hollow Kingdom",
    pitch: "A buried civilization stirs.",
    genre: "dark fantasy",
    setting: "Buried under the icefields.",
    style_mode: "mystery",
    tone: {
      voice: "hushed",
      pacing: "slow",
      content_rating: "teen",
      forbidden_topics: ["gore"],
    },
    rules: {
      combat: "Rare, brutal.",
      magic: "Blood-bound.",
      skill_checks: "GM's call.",
      hard_constraints: ["No firearms.", "Dead never speak."],
    },
    entities: [
      {
        id: "npc.lyr",
        kind: "npc",
        name: "Lyr",
        description: "A young scribe.",
        attributes: {},
      },
      {
        id: "loc.hollow",
        kind: "location",
        name: "The Hollow",
        description: "A buried city beneath the ice.",
        attributes: {},
      },
    ],
    timeline: [
      { when: "Long ago", what: "The kingdom fell." },
      { when: "Last winter", what: "A scribe heard it breathing." },
    ],
    character_creation: { origins: [], classes: [], stats: [], starting_items: [] },
    starting_scenario: "You wake at the gate of the Hollow.",
    win_states: ["Learn what breathes."],
    fail_states: ["Be silenced before the truth."],
  };
}

describe("chunkBible", () => {
  it("produces categorized chunks for each bible section", () => {
    const chunks = chunkBible(fullBible());
    const cats = (c: { categories: string[] }) => c.categories.join(",");
    expect(chunks.find((c) => cats(c).includes("summary"))?.text).toMatch(/Hollow Kingdom/);
    expect(chunks.find((c) => cats(c).includes("scenario"))?.text).toMatch(/gate of the Hollow/);
    expect(chunks.filter((c) => c.categories.includes("rules"))).toHaveLength(4);
    expect(chunks.find((c) => c.categories.includes("combat"))?.text).toMatch(/Rare, brutal/);
    expect(chunks.find((c) => c.categories.includes("constraints"))?.text).toMatch(/No firearms/);
  });

  it("emits one chunk per named entity with metadata", () => {
    const chunks = chunkBible(fullBible());
    const entities = chunks.filter((c) => c.categories[0]?.startsWith("entity:"));
    expect(entities).toHaveLength(2);
    expect(entities[0]?.metadata["entityId"]).toBe("npc.lyr");
    expect(entities.some((c) => c.text.includes("Lyr"))).toBe(true);
  });

  it("skips sections the bible omits", () => {
    const minimal: GameBible = {
      ...fullBible(),
      pitch: undefined as unknown as string,
      setting: undefined as unknown as string,
      starting_scenario: undefined as unknown as string,
      rules: { hard_constraints: [] },
      tone: { content_rating: "teen", forbidden_topics: [] },
      entities: [],
      timeline: [],
      win_states: [],
      fail_states: [],
    };
    expect(chunkBible(minimal)).toEqual([]);
  });
});

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkText("A short paragraph.", ["raw"]);
    expect(chunks).toEqual([
      { text: "A short paragraph.", categories: ["raw"], metadata: {} },
    ]);
  });

  it("splits very long text with overlap", () => {
    const long = Array.from({ length: 50 }, (_, i) => `Paragraph ${i} ${"x".repeat(200)}`).join("\n\n");
    const chunks = chunkText(long, ["raw"]);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 3400)).toBe(true);
  });

  it("makes progress through a long unspaced run and covers all of it", () => {
    // A base64-like blob with no spaces, behind a short spaced intro so the
    // only space sits inside the overlap window.
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let x = 0x2545f491;
    const blob = Array.from({ length: 12_000 }, () => {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return alphabet[(x >>> 0) % alphabet.length];
    }).join("");
    for (const text of [blob, `Intro ${blob}`]) {
      const chunks = chunkText(text, ["raw"]);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every((c) => c.text.length <= 3200)).toBe(true);
      // Each chunk continues where the previous one ended, so none of the
      // text is dropped.
      let covered = 0;
      for (const c of chunks) {
        const at = text.indexOf(c.text);
        expect(at).toBeGreaterThanOrEqual(0);
        expect(at).toBeLessThanOrEqual(covered);
        covered = Math.max(covered, at + c.text.length);
      }
      expect(covered).toBe(text.length);
    }
  });
});
