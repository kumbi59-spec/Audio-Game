"use client";

import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

/**
 * Adsterra iframe-format display banner (the 160×600 rail unit). The ad code
 * lives at /ads/rail (app/ads/rail/route.ts) so it runs on a real URL on our
 * domain — in the old srcdoc frame the script saw "about:srcdoc" and no
 * hostname, and the banner never filled.
 *
 * The frame keeps its own origin (allow-same-origin). Sandboxed without it,
 * the frame had an opaque origin: the ad script could not use its cookies or
 * storage, the restriction carried into Adsterra's own nested ad frame, and
 * the unit never recorded a single impression. Because /ads/rail is on our
 * domain, this gives the ad script the same access as Adsterra's popunder,
 * social bar and native banner, which already run in the page itself (a
 * same-origin frame with scripts could lift its own sandbox, so the remaining
 * flags are a guard against stray redirects and dialogs, not a wall). A click
 * opens the advertiser's page in a new tab.
 */
const AD_SANDBOX = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";
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
