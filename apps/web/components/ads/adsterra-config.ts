/**
 * Adsterra ad units. Every unit is free-tier only (gated on `showAds`).
 * Set NEXT_PUBLIC_ADSTERRA_DISABLED=1 at build time to turn all of them off.
 *
 * There is deliberately no popunder: a surprise new window on the first click
 * is disorienting with a screen reader, and these are the players EchoQuest
 * is built for.
 */
export const ADSTERRA_ENABLED = process.env["NEXT_PUBLIC_ADSTERRA_DISABLED"] !== "1";

export const ADSTERRA = {
  socialBarSrc:
    "https://pl31480257.profitableratecpmnetwork.com/75/71/22/75712283ca9badb6df00a5cfa08e6bf8.js",
  nativeBannerSrc:
    "https://pl31480256.profitableratecpmnetwork.com/0dbdd69628b95bce5aaa65be4ff36f14/invoke.js",
  nativeBannerContainerId: "container-0dbdd69628b95bce5aaa65be4ff36f14",
  smartlinkUrl: "https://www.profitableratecpmnetwork.com/zb1zt3aeix?key=6924bb55550ed25fb03c437c4d0a6b74",
  /** 160×600 display banner used in the desktop side rails. */
  railBanner: {
    key: "831059fa39e3288ff5fa55ac4bb800f7",
    src: "https://recordssponge.com/831059fa39e3288ff5fa55ac4bb800f7/invoke.js",
    width: 160,
    height: 600,
  },
} as const;

/**
 * Routes where the page-level format (the social bar) is never loaded. It
 * overlays the page and can steal focus, which breaks screen-reader play and
 * the audio session, and has no place on admin/auth pages.
 */
export const ADSTERRA_EXCLUDED_PREFIXES = ["/play", "/admin", "/auth", "/account"];
