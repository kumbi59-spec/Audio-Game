import type { WorldData } from "@/types/world";

/** Longest timeOfDay or weather kept, the same bound the request schema puts on them. */
const MAX_CONDITION_CHARS = 50;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function conditionText(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim().slice(0, MAX_CONDITION_CHARS);
  return text || null;
}

/**
 * A GM turn's stateChanges are model output, and some of them land in typed
 * GameState columns. Keeps those to the types the columns take before the
 * client or the save sees them: a locationId only when the world has that
 * location, timeOfDay and weather as short strings, and flags as an object.
 * A value that doesn't fit is dropped. Everything else passes through; the
 * reducers that read it skip malformed entries themselves.
 */
export function sanitizeStateChanges(
  changes: Record<string, unknown>,
  world: Pick<WorldData, "locations">,
): Record<string, unknown> {
  const out = { ...changes };
  if ("locationId" in out && !world.locations.some((l) => l.id === out.locationId)) {
    delete out.locationId;
  }
  for (const key of ["timeOfDay", "weather"] as const) {
    if (!(key in out)) continue;
    const text = conditionText(out[key]);
    if (text) out[key] = text;
    else delete out[key];
  }
  if ("flags" in out && !isPlainObject(out.flags)) delete out.flags;
  return out;
}
