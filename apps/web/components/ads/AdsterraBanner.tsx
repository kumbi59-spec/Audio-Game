"use client";

import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

type BannerUnit = { key: string; src: string; width: number; height: number };

/**
 * Adsterra iframe-format display banner. Each banner runs in its own srcdoc
 * iframe so the global `atOptions` the invoke script reads can't collide
 * between two banners on one page. The sandbox permits the ad script to run
 * while giving the srcdoc an opaque origin, so it cannot access the host page.
 */
export function AdsterraBanner({ unit = ADSTERRA.railBanner }: { unit?: BannerUnit }) {
  if (!ADSTERRA_ENABLED) return null;
  const options = JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} });
  const srcDoc =
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head>` +
    `<body><script>atOptions = ${options};</script><script src="${unit.src}"></script></body></html>`;
  return (
    <iframe
      title="Advertisement"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      width={unit.width}
      height={unit.height}
      scrolling="no"
      style={{ border: 0, display: "block", width: unit.width, height: unit.height }}
    />
  );
}
