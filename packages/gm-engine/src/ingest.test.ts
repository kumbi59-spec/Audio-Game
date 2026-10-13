import { describe, expect, it } from "vitest";
import { ingestBibleFromText } from "./ingest.js";

describe("ingestBibleFromText", () => {
  it("validates the model output against the GameBible schema", async () => {
    const fakeModelOutput = JSON.stringify({
      title: "The Hollow Kingdom",
      pitch: "A buried civilization stirs.",
      genre: "dark fantasy",
      style_mode: "mystery",
      tone: { content_rating: "teen", forbidden_topics: [] },
      rules: { hard_constraints: ["No gunpowder."] },
      entities: [
        {
          id: "npc.lyr",
          kind: "npc",
          name: "Lyr",
          description: "A young scribe.",
          attributes: {},
        },
      ],
      timeline: [],
      character_creation: {
        origins: [],
        classes: [],
        stats: [],
        starting_items: [],
      },
      starting_scenario: "You wake at the gate of the Hollow.",
      win_states: [],
      fail_states: [],
    });

    const result = await ingestBibleFromText({
      rawText: "An ancient kingdom buried under ice...",
      runModel: async () => fakeModelOutput,
    });

    expect(result.bible.title).toBe("The Hollow Kingdom");
    expect(result.bible.entities).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it("warns when entities are empty or scenario is missing", async () => {
    const fakeModelOutput = JSON.stringify({
      title: "Sparse",
      style_mode: "adventure",
      tone: { content_rating: "teen", forbidden_topics: [] },
      rules: { hard_constraints: [] },
      entities: [],
      timeline: [],
      character_creation: { origins: [], classes: [], stats: [], starting_items: [] },
      win_states: [],
      fail_states: [],
    });

    const result = await ingestBibleFromText({
      rawText: "Anything",
      runModel: async () => fakeModelOutput,
    });
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/starting scenario/i),
        expect.stringMatching(/no named entities/i),
      ]),
    );
  });

  it("rejects empty input before calling the model", async () => {
    let modelCalled = false;
    await expect(
      ingestBibleFromText({
        rawText: "   ",
        runModel: async () => {
          modelCalled = true;
          return "{}";
        },
      }),
    ).rejects.toThrow(/empty/i);
    expect(modelCalled).toBe(false);
  });

  it("parses JSON followed by trailing prose, and fenced JSON", async () => {
    const bible = JSON.stringify({
      title: "Tidewater",
      style_mode: "adventure",
      tone: { content_rating: "teen", forbidden_topics: [] },
      rules: { hard_constraints: [] },
      entities: [],
      timeline: [],
      character_creation: { origins: [], classes: [], stats: [], starting_items: [] },
      win_states: [],
      fail_states: [],
    });

    for (const reply of [
      `${bible}\n\nLet me know if you'd like more entities.`,
      `Here is the bible:\n\`\`\`json\n${bible}\n\`\`\`\nEnjoy!`,
    ]) {
      const result = await ingestBibleFromText({
        rawText: "A drowned coast.",
        runModel: async () => reply,
      });
      expect(result.bible.title).toBe("Tidewater");
    }
  });

  it("throws a descriptive error when model output fails validation", async () => {
    await expect(
      ingestBibleFromText({
        rawText: "real text",
        runModel: async () => JSON.stringify({ title: 42 }),
      }),
    ).rejects.toThrow(/validation/i);
  });
});
