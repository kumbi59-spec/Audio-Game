import { describe, expect, it } from "vitest";
import { UNREADABLE_REPLY_CHOICES, extractNarrationField, parseGMResponse } from "./gm-response";

describe("parseGMResponse", () => {
  it("strips em dashes from narration and choices", () => {
    const res = parseGMResponse(
      JSON.stringify({ narration: "The rope holds \u2014 barely.", choices: ["Climb \u2014 now", "Wait"] }),
    );
    expect(res.narration).toBe("The rope holds, barely.");
    expect(res.choices).toEqual(["Climb, now", "Wait"]);
  });

  it("drops choices that aren't strings", () => {
    const res = parseGMResponse(JSON.stringify({ narration: "x", choices: ["Run", 3, null] }));
    expect(res.choices).toEqual(["Run"]);
  });

  it("falls back to the narration field and in-voice choices for broken JSON", () => {
    const res = parseGMResponse('{"narration": "You hear it before you see it.", "choices": [');
    expect(res.narration).toBe("You hear it before you see it.");
    expect(res.choices).toEqual(UNREADABLE_REPLY_CHOICES);
  });
});

describe("extractNarrationField", () => {
  it("decodes escapes, including an escaped backslash before a quote", () => {
    expect(extractNarrationField('{"narration": "Path: C:\\\\ \\"ok\\" \\u00e9", "x": 1')).toBe('Path: C:\\ "ok" \u00e9');
  });

  it("returns the prose up to a truncation, dropping a half-written escape", () => {
    expect(extractNarrationField('{"narration": "The tide turns\\u00')).toBe("The tide turns");
    expect(extractNarrationField('{"narration": "Line one\\nLine two\\')).toBe("Line one\nLine two");
  });

  it("returns null when there is no narration key", () => {
    expect(extractNarrationField('{"choices": []}')).toBeNull();
  });
});
