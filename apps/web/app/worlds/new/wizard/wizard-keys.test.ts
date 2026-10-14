import { describe, expect, it } from "vitest";
import { wizardKeyHandledElsewhere } from "./wizard-keys";

function keydown(key: string, tagName: string, opts: { role?: string; defaultPrevented?: boolean } = {}) {
  return {
    key,
    defaultPrevented: opts.defaultPrevented ?? false,
    target: { tagName, getAttribute: (name: string) => (name === "role" ? opts.role ?? null : null) },
  } as unknown as KeyboardEvent;
}

describe("wizard page-wide keys", () => {
  it("leave Enter to a focused button, link or choice option", () => {
    expect(wizardKeyHandledElsewhere(keydown("Enter", "BUTTON"))).toBe(true);
    expect(wizardKeyHandledElsewhere(keydown("Enter", "A"))).toBe(true);
    expect(wizardKeyHandledElsewhere(keydown("Enter", "DIV", { role: "radio" }))).toBe(true);
  });

  it("skip a keydown another handler already took", () => {
    expect(wizardKeyHandledElsewhere(keydown("Enter", "BODY", { defaultPrevented: true }))).toBe(true);
  });

  it("skip keys typed into a field", () => {
    expect(wizardKeyHandledElsewhere(keydown("ArrowLeft", "INPUT"))).toBe(true);
    expect(wizardKeyHandledElsewhere(keydown("v", "TEXTAREA"))).toBe(true);
  });

  it("handle Enter elsewhere on the page, and other shortcuts on a focused button", () => {
    expect(wizardKeyHandledElsewhere(keydown("Enter", "BODY"))).toBe(false);
    expect(wizardKeyHandledElsewhere(keydown("Enter", "H2"))).toBe(false);
    expect(wizardKeyHandledElsewhere(keydown("ArrowRight", "BUTTON"))).toBe(false);
    expect(wizardKeyHandledElsewhere(keydown("r", "BUTTON"))).toBe(false);
  });
});
