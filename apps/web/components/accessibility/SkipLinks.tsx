"use client";

export function SkipLinks() {
  return (
    <nav aria-label="Skip navigation" className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <a
        href="#audio-controls"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-40 focus:z-[9999] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none"
      >
        Skip to audio controls
      </a>
      <a
        href="#action-input"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-72 focus:z-[9999] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none"
      >
        Skip to action input
      </a>
    </nav>
  );
}
