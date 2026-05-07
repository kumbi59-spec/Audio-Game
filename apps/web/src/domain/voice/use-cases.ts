/**
 * Maps a raw ElevenLabs / TTS API error into a user-readable string.
 * Keeps the original message for errors that don't match known patterns.
 */
export function friendlyTtsError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Preview failed";
  if (msg.includes("not configured"))
    return "ElevenLabs is not configured on this server. Contact the site owner or switch to Browser narrator.";
  if (
    msg.includes("detected_unusual_activity") ||
    msg.includes("Free Tier usage disabled") ||
    msg.includes("unusual activity")
  )
    return "ElevenLabs has disabled free-tier access from this server. A paid ElevenLabs plan is required.";
  if (msg.includes("subscription_required") || msg.includes("free tier"))
    return "This ElevenLabs feature requires a paid plan.";
  return msg;
}

/**
 * Returns the correct voice list for the active TTS provider.
 */
export function voicesForProvider<T>(
  provider: string,
  elevenLabsVoices: T[],
  browserVoices: T[],
): T[] {
  return provider === "elevenlabs" ? elevenLabsVoices : browserVoices;
}
