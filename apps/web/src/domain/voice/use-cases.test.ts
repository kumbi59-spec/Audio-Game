import { describe, expect, it } from "vitest";
import { friendlyTtsError, voicesForProvider } from "./use-cases";

describe("voice domain use-cases", () => {
  describe("friendlyTtsError", () => {
    it("returns generic message for unknown errors", () => {
      expect(friendlyTtsError(new Error("Preview failed"))).toBe("Preview failed");
    });

    it("maps 'not configured' to a helpful setup message", () => {
      const msg = friendlyTtsError(new Error("ElevenLabs not configured"));
      expect(msg).toMatch(/not configured/i);
      expect(msg).toMatch(/switch to Browser/i);
    });

    it("maps unusual activity errors", () => {
      const msg = friendlyTtsError(new Error("detected_unusual_activity on this IP"));
      expect(msg).toMatch(/paid ElevenLabs plan/i);
    });

    it("maps free tier disabled errors", () => {
      const msg = friendlyTtsError(new Error("Free Tier usage disabled"));
      expect(msg).toMatch(/paid ElevenLabs plan/i);
    });

    it("maps subscription_required errors", () => {
      const msg = friendlyTtsError(new Error("subscription_required"));
      expect(msg).toMatch(/paid plan/i);
    });

    it("handles non-Error values", () => {
      expect(friendlyTtsError("something broke")).toBe("Preview failed");
      expect(friendlyTtsError(null)).toBe("Preview failed");
    });
  });

  describe("voicesForProvider", () => {
    const el = [{ id: "el-1" }];
    const br = [{ id: "br-1" }, { id: "br-2" }];

    it("returns elevenlabs voices for elevenlabs provider", () => {
      expect(voicesForProvider("elevenlabs", el, br)).toBe(el);
    });

    it("returns browser voices for browser provider", () => {
      expect(voicesForProvider("browser", el, br)).toBe(br);
    });

    it("returns browser voices for any unknown provider", () => {
      expect(voicesForProvider("unknown", el, br)).toBe(br);
    });
  });
});
