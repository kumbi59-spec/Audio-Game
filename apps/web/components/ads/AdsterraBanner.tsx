"use client";

import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

/**
 * Adsterra iframe-format display banner (the 160×600 rail unit). The ad code
 * lives at /ads/rail (app/ads/rail/route.ts) so it runs on a real URL on our
 * domain — in the old srcdoc frame the script saw "about:srcdoc" and no
 * hostname, and the banner never filled.
 *
 * The iframe is sandboxed WITHOUT allow-same-origin, so the third-party
 * script gets an opaque origin: it can't read the parent DOM, localStorage or
 * cookies, or call our authenticated APIs. The other flags are the minimum an
 * ad needs: scripts to run, and a click (user activation) to open the
 * advertiser's page in a new, unsandboxed tab.
 */
const AD_SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox";
export const RAIL_BANNER_PATH = "/ads/rail";

export function AdsterraBanner() {
  if (!ADSTERRA_ENABLED) return null;
  const unit = ADSTERRA.railBanner;
  return (
    <iframe
      title="Advertisement"
      sandbox={AD_SANDBOX}
      src={RAIL_BANNER_PATH}
      width={unit.width}
      height={unit.height}
      scrolling="no"
      style={{ border: 0, display: "block", width: unit.width, height: unit.height }}
    />
  );
}
