import { describe, expect, it } from "vitest";
import { resolveDisplayModes } from "./display-prefs";

const device = { prefersLight: false, prefersMoreContrast: false, prefersReducedMotion: false };

describe("resolveDisplayModes", () => {
  it("follows the device's light/dark choice when the theme is 'system'", () => {
    expect(resolveDisplayModes({ theme: "system" }, { ...device, prefersLight: true }).light).toBe(true);
    expect(resolveDisplayModes({ theme: "dark" }, { ...device, prefersLight: true }).light).toBe(false);
    expect(resolveDisplayModes({ theme: "light" }, device).light).toBe(true);
  });

  it("honours the device's high-contrast and reduced-motion settings even when off here", () => {
    const modes = resolveDisplayModes({}, { ...device, prefersMoreContrast: true, prefersReducedMotion: true });
    expect(modes).toMatchObject({ highContrast: true, reducedMotion: true });
  });

  it("keeps high contrast dark, whatever the theme", () => {
    expect(resolveDisplayModes({ theme: "light", highContrast: true }, device)).toMatchObject({ light: false, highContrast: true });
  });
});
