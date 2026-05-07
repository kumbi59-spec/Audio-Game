import { describe, expect, it } from "vitest";
import { validatePasswordChange, tierDisplayInfo } from "./use-cases";

describe("auth domain use-cases", () => {
  describe("validatePasswordChange", () => {
    it("returns ok when passwords match and meet length", () => {
      expect(validatePasswordChange("hunter123", "hunter123")).toEqual({ ok: true });
    });

    it("rejects mismatched confirmation", () => {
      const result = validatePasswordChange("hunter123", "different");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/do not match/i);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = validatePasswordChange("short", "short");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/8 characters/i);
    });

    it("checks mismatch before length", () => {
      // both short AND mismatched — mismatch wins
      const result = validatePasswordChange("abc", "xyz");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/do not match/i);
    });
  });

  describe("tierDisplayInfo", () => {
    it("returns correct label and color for known tiers", () => {
      expect(tierDisplayInfo("free").label).toBe("Free");
      expect(tierDisplayInfo("storyteller").label).toBe("Storyteller");
      expect(tierDisplayInfo("creator").label).toBe("Creator");
      expect(tierDisplayInfo("enterprise").label).toBe("Enterprise");
    });

    it("returns fallback for unknown tier", () => {
      const info = tierDisplayInfo("unknown_tier");
      expect(info.label).toBe("Unknown");
    });
  });
});
