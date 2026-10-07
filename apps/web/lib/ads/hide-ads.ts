/**
 * The free "Hide ads" setting. It lives in the accessibility store for the
 * client, and in this cookie so the server can leave ad scripts out of the
 * page HTML too.
 */
export const HIDE_ADS_COOKIE = "eq_hide_ads";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function writeHideAdsCookie(hide: boolean): void {
  if (typeof document === "undefined") return;
  document.cookie = hide
    ? `${HIDE_ADS_COOKIE}=1; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`
    : `${HIDE_ADS_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/** Whether ads show: the tier allows them and the player hasn't hidden them, or ad preview is on. */
export function effectiveShowAds({
  entitled,
  hideAds,
  adPreview,
}: {
  entitled: boolean;
  hideAds: boolean;
  adPreview: boolean;
}): boolean {
  return (entitled && !hideAds) || adPreview;
}
