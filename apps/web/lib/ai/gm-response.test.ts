import { describe, expect, it } from "vitest";
import {
  UNREADABLE_REPLY_CHOICES,
  extractNarrationField,
  parseGMResponse,
  stripOutOfCharacterNotes,
  stripOutOfCharacterParentheticals,
} from "./gm-response";

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

  it("keeps the scene's own choices and state changes when the reply is cut off after them", () => {
    const raw =
      '{"soundCue": null, "narration": "The gate swings open.", "choices": ["Slip through the gate", "Call out to Iruka"], ' +
      '"stateChanges": {"locationId": "village", "inventoryChanges": [{"op": "add", "name": "Scroll", "quantity": 1}]}, "npcAction": {"npcId": "ir';
    const res = parseGMResponse(raw);
    expect(res.narration).toBe("The gate swings open.");
    expect(res.choices).toEqual(["Slip through the gate", "Call out to Iruka"]);
    expect(res.stateChanges).toEqual({
      locationId: "village",
      inventoryChanges: [{ op: "add", name: "Scroll", quantity: 1 }],
    });
    expect(res.npcAction).toBeNull();
  });

  it("keeps the complete choices from a choice list that was cut off", () => {
    const res = parseGMResponse('{"narration": "Rain.", "choices": ["Run for the bridge", "Hide under the cart", "Sho');
    expect(res.choices).toEqual(["Run for the bridge", "Hide under the cart"]);
  });

  it("reads a reply with stray prose around the JSON", () => {
    const res = parseGMResponse('Here you go:\n{"narration": "Smoke.", "choices": ["Follow the smoke"]}\nThanks!');
    expect(res.narration).toBe("Smoke.");
    expect(res.choices).toEqual(["Follow the smoke"]);
  });

  it("drops out-of-character GM notes from the narration", () => {
    const res = parseGMResponse(
      JSON.stringify({
        narration:
          "The dark takes you.\n\n(GM aside: the sheet still lists you in the lab. I'm tracking the story, so that's fine.)",
        choices: ["Wake up"],
      }),
    );
    expect(res.narration).toBe("The dark takes you.");
  });
});

describe("stripOutOfCharacterNotes", () => {
  it("removes GM and OOC notes in brackets or on their own line", () => {
    expect(stripOutOfCharacterNotes("You run. (OOC: nice roll!) The door slams.")).toBe("You run. The door slams.");
    expect(stripOutOfCharacterNotes("You run.\nGM note: the map is out of date.\nThe door slams.")).toBe(
      "You run.\n\nThe door slams.",
    );
  });

  it("leaves in-story brackets and text alone", () => {
    const text = "  The sign reads (in faded paint) KEEP OUT.";
    expect(stripOutOfCharacterNotes(text)).toBe(text);
  });

  it("strips notes from a stored raw reply without breaking its JSON", () => {
    const raw = JSON.stringify({ narration: "Quiet. (GM aside: sheet says lab.)", choices: ["Go"] });
    expect(JSON.parse(stripOutOfCharacterParentheticals(raw))).toEqual({ narration: "Quiet.", choices: ["Go"] });
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
