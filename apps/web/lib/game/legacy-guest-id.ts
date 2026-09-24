/**
 * Guest ids used to be generated in the browser and stored here. Identity is
 * now a server-issued cookie; the old id is only sent so the server can
 * re-bind an existing guest's saved games to that cookie.
 */
export function readLegacyGuestId(): string | null {
  try {
    return localStorage.getItem("echoquest-guest-id");
  } catch {
    return null;
  }
}
