"use client";

import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

/**
 * Horizontal Adsterra ad bar: the Adsterra smartlink (Direct Link) as a
 * clearly labelled sponsored link. Fills the banner spots (in-game every 5th
 * turn, between blog sections) where a wide banner fits but the account has
 * no Adsterra banner unit of that shape — the native banner can only appear
 * once per page and the display unit is 160×600.
 */
export function AdsterraSponsoredBar() {
  if (!ADSTERRA_ENABLED) return null;
  return (
    <a
      href={ADSTERRA.smartlinkUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label="Sponsored: explore offers from our partners (advertisement, opens in a new tab)"
      className="flex items-center justify-between gap-4 px-4 py-2 text-xs hover:opacity-90"
      style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}
    >
      <span style={{ color: "var(--text-muted)" }}>
        <span className="mr-2 uppercase tracking-wider">Sponsored</span>
        <span style={{ color: "var(--text)" }}>Explore offers from our partners</span>
      </span>
      <span
        className="shrink-0 rounded px-2 py-1 text-xs font-semibold"
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        aria-hidden="true"
      >
        Take a look
      </span>
    </a>
  );
}
