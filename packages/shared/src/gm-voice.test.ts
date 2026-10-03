import { describe, expect, it } from "vitest";
import { AI_TELL_PHRASES, GM_VOICE_GUIDE, findAiTells } from "./gm-voice.js";

describe("findAiTells", () => {
  it("finds stock phrases on word boundaries, ignoring case", () => {
    expect(findAiTells("Let's DELVE into the dungeon.")).toEqual(["delve"]);
    expect(findAiTells("The delver's lamp gutters.")).toEqual([]);
  });

  it("treats curly apostrophes as straight ones", () => {
    expect(findAiTells("It\u2019s important to note the door.")).toContain("it's important to note");
  });

  it("flags em dashes and spaced en dashes but not number ranges", () => {
    expect(findAiTells("He waits \u2014 then runs.")).toContain("em dash");
    expect(findAiTells("He waits \u2013 then runs.")).toContain("spaced en dash");
    expect(findAiTells("Pick 3\u20134 options.")).toEqual([]);
  });
});

describe("GM_VOICE_GUIDE", () => {
  it("is written the way it asks the GM to write", () => {
    expect(GM_VOICE_GUIDE).not.toContain("\u2014");
    expect(GM_VOICE_GUIDE).not.toMatch(/\s\u2013\s/);
  });

  it("names every banned phrase", () => {
    for (const phrase of AI_TELL_PHRASES) expect(GM_VOICE_GUIDE).toContain(phrase);
  });
});
