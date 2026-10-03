/** "system" follows the device's light/dark setting. */
export type ThemePreference = "system" | "dark" | "light";

/** Where the display settings are kept; the pre-paint script reads it too. */
export const A11Y_STORAGE_KEY = "audio-game-a11y";

/** What the page should look like, after the player's settings and the device's. */
export interface DisplayModes {
  light: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
}

export interface DisplayPrefs {
  theme?: ThemePreference;
  highContrast?: boolean;
  largeText?: boolean;
  reducedMotion?: boolean;
}

export interface DeviceSignals {
  prefersLight: boolean;
  prefersMoreContrast: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Combines the player's settings with the device's. Turning high contrast or
 * reduced motion on in the OS is honoured even if the setting here is off;
 * "system" theme follows the OS light/dark choice. High contrast is always
 * dark (its palette is black and yellow).
 */
export function resolveDisplayModes(prefs: DisplayPrefs, device: DeviceSignals): DisplayModes {
  const highContrast = Boolean(prefs.highContrast) || device.prefersMoreContrast;
  const theme = prefs.theme ?? "system";
  const light = !highContrast && (theme === "light" || (theme === "system" && device.prefersLight));
  return {
    light,
    highContrast,
    largeText: Boolean(prefs.largeText),
    reducedMotion: Boolean(prefs.reducedMotion) || device.prefersReducedMotion,
  };
}

/** Applies the modes as classes on <html> (the theme CSS keys off them). */
export function applyDisplayModes(root: HTMLElement, modes: DisplayModes): void {
  root.classList.toggle("theme-light", modes.light);
  root.classList.toggle("theme-high-contrast", modes.highContrast);
  root.classList.toggle("large-text", modes.largeText);
  root.classList.toggle("reduce-motion", modes.reducedMotion);
}

/**
 * The same logic as a self-contained script for the root layout, run before
 * first paint so a light-theme player doesn't see a flash of the dark one.
 */
export function displayModesBootScript(storageKey: string): string {
  return `(function(){try{var p={};var raw=localStorage.getItem(${JSON.stringify(storageKey)});if(raw){p=(JSON.parse(raw)||{}).state||{};}
var m=function(q){return window.matchMedia&&window.matchMedia(q).matches;};
var hc=!!p.highContrast||m("(prefers-contrast: more)");var t=p.theme||"system";
var light=!hc&&(t==="light"||(t==="system"&&m("(prefers-color-scheme: light)")));
var c=document.documentElement.classList;c.toggle("theme-light",light);c.toggle("theme-high-contrast",hc);
c.toggle("large-text",!!p.largeText);c.toggle("reduce-motion",!!p.reducedMotion||m("(prefers-reduced-motion: reduce)"));}catch(e){}})();`;
}
