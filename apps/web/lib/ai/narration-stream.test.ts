import { describe, expect, it } from "vitest";
import { NarrationStreamExtractor, NarrationStreamTap } from "./narration-stream";

function extractInChunks(raw: string, size: number): string {
  const extractor = new NarrationStreamExtractor();
  let out = "";
  for (let i = 0; i < raw.length; i += size) out += extractor.push(raw.slice(i, i + size));
  return out;
}

describe("NarrationStreamExtractor", () => {
  const narration = 'Rain hisses.\n[Captain Voss]: "Drop it." She sighs \\ — café 🗡 done';
  const reply = JSON.stringify({ soundCue: "danger", narration, choices: ["Run", "Hide"] });

  it("decodes the narration however the stream is chunked", () => {
    for (let size = 1; size <= reply.length; size += 1) {
      expect(extractInChunks(reply, size)).toBe(narration);
    }
  });

  it("decodes \\u escapes split across chunks, including surrogate pairs", () => {
    const raw = '{"narration": "caf\\u00e9 \\ud83d\\udde1!"}';
    for (let size = 1; size <= raw.length; size += 1) {
      expect(extractInChunks(raw, size)).toBe("café 🗡!");
    }
  });

  it("finds the narration when it isn't the first key, and inside a code fence", () => {
    const raw = '```json\n{"choices": ["a"], "narration" : "Hello there."}\n```';
    expect(extractInChunks(raw, 4)).toBe("Hello there.");
  });

  it("returns what it has when the reply is cut off mid-value", () => {
    const extractor = new NarrationStreamExtractor();
    expect(extractor.push('{"narration": "The door cre')).toBe("The door cre");
    expect(extractor.done).toBe(false);
  });

  it("ignores everything after the narration ends", () => {
    const extractor = new NarrationStreamExtractor();
    expect(extractor.push('{"narration": "Done.", "choices": ["x"]}')).toBe("Done.");
    expect(extractor.done).toBe(true);
    expect(extractor.push(' "more": "text"')).toBe("");
  });
});

describe("NarrationStreamTap", () => {
  it("emits the cue and speakers written before the narration, once", () => {
    const tap = new NarrationStreamTap();
    const events = [
      ...tap.onText('{"soundCue": "npc_hos'),
      ...tap.onText('tile", "speakers": [{"name": "Voss", "gender": "male"}, {"name": "Imp", "gender": "goblin"}], '),
      ...tap.onText('"narration": "[Voss]: \\"Halt.\\""'),
      ...tap.onText(', "soundCue": "danger"}'),
    ];
    expect(events).toEqual([
      { type: "sound_cue", data: { cue: "npc_hostile" } },
      {
        type: "speakers",
        data: { speakers: [{ name: "Voss", gender: "male" }, { name: "Imp", gender: "neutral" }] },
      },
      { type: "narration_delta", data: { text: '[Voss]: "Halt."' } },
    ]);
    expect(tap.cueSent).toBe("npc_hostile");
  });

  it("treats a null cue and an empty speaker list as nothing to send", () => {
    const tap = new NarrationStreamTap();
    const events = tap.onText('{"soundCue": null, "speakers": [], "narration": "Quiet."}');
    expect(events).toEqual([{ type: "narration_delta", data: { text: "Quiet." } }]);
    expect(tap.cueSent).toBeNull();
  });

  it("starts over after resetText", () => {
    const tap = new NarrationStreamTap();
    tap.onText('{"narration": "Before the roll');
    tap.resetText();
    expect(tap.onText('{"narration": "After."}')).toEqual([{ type: "narration_delta", data: { text: "After." } }]);
  });
});
