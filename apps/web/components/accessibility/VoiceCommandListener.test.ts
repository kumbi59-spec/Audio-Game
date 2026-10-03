import { describe, expect, it } from "vitest";
import { parseVoiceInput } from "./VoiceCommandListener";

describe("parseVoiceInput", () => {
  it("reads choices by digit or word, with or without a verb", () => {
    expect(parseVoiceInput("choose option 3")).toEqual({ type: "choice", value: 2 });
    expect(parseVoiceInput("Pick two.")).toEqual({ type: "choice", value: 1 });
    expect(parseVoiceInput("number 1")).toEqual({ type: "choice", value: 0 });
    expect(parseVoiceInput("4")).toEqual({ type: "choice", value: 3 });
  });

  it("only treats a whole phrase as a command", () => {
    expect(parseVoiceInput("stop")).toEqual({ type: "meta", value: "pause" });
    expect(parseVoiceInput("Where am I?")).toEqual({ type: "meta", value: "location" });
    expect(parseVoiceInput("stop the guard")).toEqual({ type: "action", value: "stop the guard" });
    expect(parseVoiceInput("I choose to run for the door")).toEqual({ type: "action", value: "I choose to run for the door" });
  });
});
