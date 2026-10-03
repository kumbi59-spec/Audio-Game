import { describe, expect, it } from "vitest";
import { EmDashStripper, stripEmDashes } from "./style";

describe("stripEmDashes", () => {
  it("turns a mid-sentence dash into a comma", () => {
    expect(stripEmDashes("The rope holds — barely.")).toBe("The rope holds, barely.");
    expect(stripEmDashes("The rope holds—barely.")).toBe("The rope holds, barely.");
  });

  it("turns a cut-off dash into an ellipsis", () => {
    expect(stripEmDashes('[Mara]: "Wait—" The door slams.')).toBe('[Mara]: "Wait..." The door slams.');
    expect(stripEmDashes("And then—")).toBe("And then...");
  });

  it("treats a spaced en dash like an em dash but leaves ranges alone", () => {
    expect(stripEmDashes("Cold – so cold.")).toBe("Cold, so cold.");
    expect(stripEmDashes("Roll 3–4 dice.")).toBe("Roll 3–4 dice.");
  });

  it("leaves text without dashes untouched", () => {
    const text = "Rain needles the tarp.";
    expect(stripEmDashes(text)).toBe(text);
  });
});

describe("EmDashStripper", () => {
  const samples = [
    "The rope holds — barely. [Mara]: \"Wait—\" Then nothing.",
    "A—B — C – D 3–4 end—",
    "  leading space —\n— next line",
  ];

  it("gives the same result however the text is split", () => {
    for (const text of samples) {
      const whole = stripEmDashes(text);
      for (let size = 1; size <= 4; size += 1) {
        const stripper = new EmDashStripper();
        let out = "";
        for (let i = 0; i < text.length; i += size) out += stripper.push(text.slice(i, i + size));
        out += stripper.flush();
        expect(out).toBe(whole);
      }
    }
  });
});
