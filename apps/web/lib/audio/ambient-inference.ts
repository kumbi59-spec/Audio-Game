import type { AmbientTrack } from "@/types/audio";

const KEYWORD_MAP: Array<{ keywords: string[]; track: AmbientTrack }> = [
  // World-specific tracks first — they win over generic locations when both match.
  { keywords: ["void", "cosmic", "eldritch", "abyss of stars", "the black", "outer dark", "formless", "ancient one", "cosmic horror", "the deep dark"], track: "cosmic_void" },
  { keywords: ["desert", "sand", "dune", "dunes", "oasis", "wasteland", "arid", "crimson wastes", "red sand", "sandstorm"], track: "desert" },
  { keywords: ["space station", "station", "starship", "colony ship", "generation ship", "airlock", "reactor", "ship corridor", "ship bridge", "cryobay", "engineering bay", "spinhub", "long hall"], track: "space_station" },
  { keywords: ["neon", "precinct", "promenade", "arcology", "megacity", "cyberpunk", "mire", "sub-city", "undercity", "rainy street", "rain slick", "rain-slick"], track: "cyberpunk_rain" },
  // Generic location tracks
  { keywords: ["dungeon", "prison", "cell", "underground", "basement", "vault", "crypt", "tomb", "catacomb", "sewer"], track: "dungeon" },
  { keywords: ["cave", "cavern", "grotto", "pit", "abyss", "chasm", "mine", "shaft"], track: "cave" },
  { keywords: ["ocean", "sea", "coast", "shore", "beach", "harbour", "harbor", "port", "dock", "wharf", "bay", "cove", "ship", "vessel", "boat"], track: "ocean" },
  { keywords: ["river", "stream", "waterfall", "water", "rapids", "brook", "creek", "delta", "canal"], track: "ocean" },
  { keywords: ["tavern", "inn", "pub", "bar", "alehouse", "saloon", "common room", "taproom"], track: "tavern" },
  { keywords: ["market", "bazaar", "plaza", "square", "fair", "stall", "vendor", "merchant"], track: "market" },
  { keywords: ["battlefield", "battle", "war camp", "duel", "arena", "armory", "barracks", "training yard", "sword", "combat"], track: "dungeon" },
  { keywords: ["throne", "palace", "castle", "court", "hall", "chamber", "ballroom", "manor", "estate", "keep", "citadel", "fortress"], track: "throne_room" },
  { keywords: ["night", "evening", "dusk", "midnight", "dark street", "alley", "nocturnal"], track: "city_night" },
  { keywords: ["city", "town", "village", "street", "road", "district", "quarter", "urban", "crowd", "guild"], track: "city_day" },
  { keywords: ["forest night", "woods night", "dark woods", "dark forest", "night forest", "nocturnal forest"], track: "forest_night" },
  { keywords: ["forest", "woods", "jungle", "grove", "woodland", "meadow", "glade", "clearing", "nature", "wilderness", "wild"], track: "forest_day" },
];

/**
 * Counts how many of the given keywords appear in `text` as whole words
 * or whole phrases. Multi-word keywords (e.g. "space station") still match
 * literally. Single-word keywords are bounded by \b so "ship" won't fire
 * on "shipment" or "warship" the way includes() did.
 */
function scoreKeywords(text: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    if (kw.includes(" ") || kw.includes("-")) {
      // Multi-word/phrase: substring match is acceptable since the phrase
      // itself implies word boundaries on both ends.
      if (text.includes(kw)) score++;
    } else {
      // Single word: require word boundary on both sides.
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${escaped}\\b`).test(text)) score++;
    }
  }
  return score;
}

/**
 * Infer an ambient sound track from a location's name and description.
 * Returns null if no track matches.
 *
 * Scoring rules:
 *   - Each keyword that hits adds 1 to the candidate's score.
 *   - The first track in KEYWORD_MAP wins ties — order in the map
 *     encodes intent (world-specific before generic).
 *   - A track must score at least 1 to be returned.
 */
export function inferAmbientTrack(name: string, description: string): AmbientTrack | null {
  const text = `${name} ${description}`.toLowerCase();

  let bestTrack: AmbientTrack | null = null;
  let bestScore = 0;
  for (const { keywords, track } of KEYWORD_MAP) {
    const score = scoreKeywords(text, keywords);
    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }
  return bestTrack;
}

/**
 * Like inferAmbientTrack, but biased to keep `currentTrack` unless the new
 * candidate scores meaningfully higher. Prevents a single off-topic mention
 * from swapping ambient mid-scene (e.g. a forest scene that briefly mentions
 * "the tavern's owner" shouldn't flip to tavern ambient).
 *
 *   - If the current track still has any keyword hits, only switch when the
 *     new track scores at least `minMargin` more than the current.
 *   - If the current track has zero hits, switch unconditionally.
 *   - Returns null only when no track matches at all.
 */
export function inferAmbientTrackSticky(
  name: string,
  description: string,
  currentTrack: AmbientTrack | null,
  minMargin = 2,
): AmbientTrack | null {
  const text = `${name} ${description}`.toLowerCase();

  let bestTrack: AmbientTrack | null = null;
  let bestScore = 0;
  let currentScore = 0;
  for (const { keywords, track } of KEYWORD_MAP) {
    const score = scoreKeywords(text, keywords);
    if (track === currentTrack) currentScore = score;
    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }

  if (bestScore === 0) return null;
  if (currentTrack && currentScore > 0 && bestScore - currentScore < minMargin) {
    return currentTrack;
  }
  return bestTrack;
}
