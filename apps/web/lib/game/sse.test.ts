import { describe, expect, it } from "vitest";
import { SseParser } from "./sse";

describe("SseParser", () => {
  it("parses events, holding one split across chunks until it's complete", () => {
    const parser = new SseParser();
    expect(parser.push('event: narration_delta\ndata: {"text":"The ga')).toEqual([]);
    expect(parser.push('te opens."}\n\nevent: done\ndata: null\n\n')).toEqual([
      { event: "narration_delta", data: { text: "The gate opens." } },
      { event: "done", data: null },
    ]);
  });

  it("accepts CRLF line endings and byte chunks", () => {
    const parser = new SseParser();
    const bytes = new TextEncoder().encode('event: sound_cue\r\ndata: {"cue":"door_open"}\r\n\r\n');
    expect(parser.push(bytes)).toEqual([{ event: "sound_cue", data: { cue: "door_open" } }]);
  });

  it("drops an event with malformed data instead of throwing", () => {
    const parser = new SseParser();
    expect(parser.push('event: state_change\ndata: {oops\n\nevent: done\ndata: {}\n\n')).toEqual([
      { event: "done", data: {} },
    ]);
  });
});
