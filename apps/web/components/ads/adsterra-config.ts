/**
 * Adsterra ad units. Every unit is free-tier only (gated on `showAds`).
 * Set NEXT_PUBLIC_ADSTERRA_DISABLED=1 at build time to turn all of them off.
 */
export const ADSTERRA_ENABLED = process.env["NEXT_PUBLIC_ADSTERRA_DISABLED"] !== "1";

export const ADSTERRA = {
  popunderSrc:
    "https://pl31480255.profitableratecpmnetwork.com/bc/ca/5c/bcca5c66a7bba1b94e405ed40dc681cc.js",
  socialBarSrc:
    "https://pl31480257.profitableratecpmnetwork.com/75/71/22/75712283ca9badb6df00a5cfa08e6bf8.js",
  nativeBannerSrc:
    "https://pl31480256.profitableratecpmnetwork.com/0dbdd69628b95bce5aaa65be4ff36f14/invoke.js",
  nativeBannerContainerId: "container-0dbdd69628b95bce5aaa65be4ff36f14",
  smartlinkUrl: "https://www.profitableratecpmnetwork.com/zb1zt3aeix?key=6924bb55550ed25fb03c437c4d0a6b74",
} as const;

/**
 * Routes where the page-level formats (popunder, social bar) are never loaded.
 * They open new windows / overlay the page and steal focus, which breaks
 * screen-reader play and the audio session, and have no place on admin/auth pages.
 */
export const ADSTERRA_EXCLUDED_PREFIXES = ["/play", "/admin", "/auth", "/account"];
