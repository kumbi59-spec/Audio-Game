import type { Tier } from "@audio-rpg/shared";

export interface WorldSummaryItem {
  id: string;
  name: string;
  kind?: string;
  isPublic?: boolean;
  analytics?: {
    sessionCount: number;
    totalTurns: number;
    uniquePlayers: number;
  } | null;
}

export interface WorldAnalyticsSummary {
  sessionCount: number;
  totalTurns: number;
  uniquePlayers: number;
}

/**
 * Returns worlds the authenticated user created or uploaded, excluding
 * official prebuilt campaigns.
 */
export function filterCreatorWorlds<T extends { kind?: string }>(worlds: T[]): T[] {
  return worlds.filter((w) => w.kind === "uploaded" || w.kind === "created");
}

/**
 * Merges a list of analytics records into a world list by worldId.
 * Worlds without an analytics record get zeros.
 */
export function mergeWorldAnalytics<T extends { id: string }>(
  worlds: T[],
  analytics: Array<{ worldId: string } & WorldAnalyticsSummary>,
): Array<T & { analytics: WorldAnalyticsSummary }> {
  const byId = new Map(
    analytics.map(({ worldId: _id, ...rest }) => [_id, rest] as const),
  );
  return worlds.map((w) => ({
    ...w,
    analytics: byId.get(w.id) ?? { sessionCount: 0, totalTurns: 0, uniquePlayers: 0 },
  }));
}

/**
 * Returns true when a world has received at least one play session.
 */
export function worldHasActivity(analytics: WorldAnalyticsSummary): boolean {
  return analytics.sessionCount > 0 || analytics.totalTurns > 0;
}

/**
 * Whether the current tier allows publishing worlds publicly.
 */
export function canPublishWorld(tier: Tier): boolean {
  return tier === "creator";
}

/**
 * Formats total turn count for display (e.g. "1,234").
 */
export function formatTurnCount(n: number): string {
  return n.toLocaleString();
}

/**
 * Sorts worlds ascending by sortOrder field.
 */
export function sortWorldsByOrder<T extends { sortOrder: number }>(worlds: T[]): T[] {
  return [...worlds].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Filters worlds by library tab: "official" → prebuilt only, "community" → user-created only.
 */
export function filterWorldsByTab<T extends { isPrebuilt: boolean }>(
  worlds: T[],
  tab: "official" | "community",
): T[] {
  return worlds.filter((w) => (tab === "official" ? w.isPrebuilt : !w.isPrebuilt));
}

/**
 * Extracts a sorted, deduplicated list of genres from a world list.
 */
export function extractGenres<T extends { genre?: string }>(worlds: T[]): string[] {
  return Array.from(new Set(worlds.map((w) => w.genre).filter((g): g is string => Boolean(g))));
}

/**
 * Filters worlds by genre. Pass "All" to return all worlds unchanged.
 */
export function filterWorldsByGenre<T extends { genre?: string }>(worlds: T[], genre: string): T[] {
  if (genre === "All") return worlds;
  return worlds.filter((w) => w.genre === genre);
}

/**
 * Resolves the final genre value: uses customGenre when the user selected "Other".
 */
export function resolveGenre(genre: string, customGenre: string): string {
  return genre === "Other" ? customGenre.trim() : genre;
}
