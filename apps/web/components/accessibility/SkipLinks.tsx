"use client";

import { usePathname } from "next/navigation";

const LINK =
  "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:z-[9999] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none";

/**
 * Skip links. Every page has #main-content; the game screen also has the
 * audio toolbar and the action box, so those links only appear there.
 */
export function SkipLinks() {
  const onPlay = (usePathname() ?? "").startsWith("/play");
  return (
    <nav aria-label="Skip navigation" className="skip-links">
      <a href="#main-content" className={`${LINK} focus:left-2`}>
        Skip to main content
      </a>
      {onPlay && (
        <>
          <a href="#game-toolbar" className={`${LINK} focus:left-40`}>
            Skip to audio controls
          </a>
          <a href="#action-input" className={`${LINK} focus:left-72`}>
            Skip to action input
          </a>
        </>
      )}
    </nav>
  );
}
