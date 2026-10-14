/** Element id of the injected social bar script (see AdsterraGlobal). */
export const SOCIAL_BAR_SCRIPT_ID = "adsterra-social-bar";

/** True once the social bar has been injected into this page load. */
export function socialBarInjected(): boolean {
  return typeof document !== "undefined" && document.getElementById(SOCIAL_BAR_SCRIPT_ID) !== null;
}

/** The game survives a page load only when it was saved to browser storage. */
function storageWritable(): boolean {
  try {
    const probe = "echoquest-storage-probe";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens a gameplay route such as /play. The social bar is never loaded there
 * (it overlays the page and can take focus from a screen reader), but once a
 * library or create page has injected it, it stays for the life of the page,
 * client-side navigation included. A full page load leaves it behind. With
 * storage blocked the game exists only in memory, so the client router is
 * kept and the game isn't lost.
 */
export function enterAdFreeRoute(router: { push: (href: string) => void }, href: string): void {
  if (socialBarInjected() && storageWritable()) window.location.assign(href);
  else router.push(href);
}
