import type { AmbientTrack } from "@/types/audio";

const KEYWORD_MAP: Array<{ keywords: string[]; track: AmbientTrack }> = [
  { keywords: ["dungeon", "prison", "cell", "underground", "basement", "vault", "crypt", "tomb", "catacomb", "sewer"], track: "dungeon" },
  { keywords: ["cave", "cavern", "grotto", "pit", "abyss", "chasm", "mine", "shaft"], track: "cave" },
  { keywords: ["ocean", "sea", "coast", "shore", "beach", "harbour", "harbor", "port", "dock", "wharf", "bay", "cove", "ship", "vessel", "boat"], track: "ocean" },
  { keywords: ["river", "stream", "waterfall", "water", "rapids", "brook", "creek", "delta", "canal"], track: "ocean" },
  { keywords: ["tavern", "inn", "pub", "bar", "alehouse", "saloon", "common room", "taproom"], track: "tavern" },
  { keywords: ["market", "bazaar", "plaza", "square", "fair", "bazaar", "stall", "vendor", "merchant"], track: "market" },
  { keywords: ["battlefield", "battle", "war camp", "duel", "arena", "armory", "barracks", "training yard", "sword", "combat"], track: "dungeon" },
  { keywords: ["throne", "palace", "castle", "court", "hall", "chamber", "ballroom", "manor", "estate", "keep", "citadel", "fortress"], track: "throne_room" },
  { keywords: ["night", "evening", "dusk", "midnight", "dark street", "alley", "nocturnal"], track: "city_night" },
  { keywords: ["city", "town", "village", "street", "road", "district", "quarter", "urban", "crowd", "guild"], track: "city_day" },
  { keywords: ["forest night", "woods night", "dark woods", "dark forest", "night forest", "nocturnal forest"], track: "forest_night" },
  { keywords: ["forest", "woods", "jungle", "grove", "woodland", "meadow", "glade", "clearing", "nature", "wilderness", "wild"], track: "forest_day" },
];

/**
 * Infer an ambient sound track from a location's name and description.
 * Returns null if no confident match found.
 */
export function inferAmbientTrack(name: string, description: string): AmbientTrack | null {
  const text = `${name} ${description}`.toLowerCase();

  for (const { keywords, track } of KEYWORD_MAP) {
    if (keywords.some((k) => text.includes(k))) {
      return track;
    }
  }
  return null;
}
