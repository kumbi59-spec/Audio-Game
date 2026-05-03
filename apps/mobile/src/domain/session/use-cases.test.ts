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

  it("parses spoken choice commands for values 1 through 9", () => {
    expect(parseChoiceCommand("choice one")).toBe(0);
    expect(parseChoiceCommand("choice two")).toBe(1);
    expect(parseChoiceCommand("choice three please")).toBe(2);
    expect(parseChoiceCommand("choice four")).toBe(3);
    expect(parseChoiceCommand("choice five")).toBe(4);
    expect(parseChoiceCommand("choice six")).toBe(5);
    expect(parseChoiceCommand("choice seven")).toBe(6);
    expect(parseChoiceCommand("choice eight")).toBe(7);
    expect(parseChoiceCommand("choice nine")).toBe(8);

    expect(parseChoiceCommand("1")).toBe(0);
    expect(parseChoiceCommand("2")).toBe(1);
    expect(parseChoiceCommand("3")).toBe(2);
    expect(parseChoiceCommand("4")).toBe(3);
    expect(parseChoiceCommand("5")).toBe(4);
    expect(parseChoiceCommand("6")).toBe(5);
    expect(parseChoiceCommand("7")).toBe(6);
    expect(parseChoiceCommand("8")).toBe(7);
    expect(parseChoiceCommand("9")).toBe(8);
  });

  it("returns null for non-choice phrases", () => {
    expect(parseChoiceCommand("do something else")).toBeNull();
    expect(parseChoiceCommand("pick option ten")).toBeNull();
    expect(parseChoiceCommand("this is not a choice command")).toBeNull();
  });

  it("normalizes spacing and case in choice commands", () => {
    expect(parseChoiceCommand("   CHOICE   SIX   now")).toBe(5);
    expect(parseChoiceCommand("\n\tChoice   NINE\t")).toBe(8);
    expect(parseChoiceCommand("   8   ")).toBe(7);
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
