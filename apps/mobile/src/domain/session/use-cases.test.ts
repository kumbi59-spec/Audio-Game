import { describe, expect, it } from "vitest";
import {
  buildPlayerTranscript,
  buildTranscriptPlainText,
  parseChoiceCommand,
} from "./use-cases";

describe("session domain use-cases", () => {
  it("formats player transcript text", () => {
    expect(buildPlayerTranscript("  I   examine\n the statue  ")).toBe("I examine the statue");
  });

  it("parses spoken choice commands", () => {
    expect(parseChoiceCommand("choice three please")).toBe(2);
    expect(parseChoiceCommand("  5 " )).toBe(4);
    expect(parseChoiceCommand("do something else")).toBeNull();
  });

  it("formats transcript into plain text", () => {
    expect(
      buildTranscriptPlainText([
        { id: "1", role: "gm", text: "You enter.", streaming: false },
        { id: "2", role: "player", text: "I look around.", streaming: false },
      ]),
    ).toBe("GM: You enter.\n\nYou: I look around.");
  });
});
