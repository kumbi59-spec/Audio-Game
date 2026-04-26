import type { CampaignState, GameBible } from "../index.js";

export const VERDANT_WILDS_BIBLE: GameBible = {
  version: 1,
  title: "The Verdant Wilds",
  pitch:
    "A lush, ancient forest hides a dying secret. The trees remember everything — and something is making them forget.",
  genre: "nature fantasy",
  setting:
    "The Verdant Wilds: an old-growth forest spanning a continent's breadth. Druids, talking beasts, and lost ruins lie within. At the heart, the World Tree is slowly going silent.",
  style_mode: "adventure",
  tone: {
    voice: "warm but urgent, lyrical",
    pacing: "exploratory with rising stakes",
    content_rating: "family",
    forbidden_topics: [],
  },
  rules: {
    combat:
      "Avoid where possible — the forest feels every death. When unavoidable, resolve quickly. Fleeing is always an option.",
    magic:
      "Nature magic is woven into everything. Druids and beasts can speak with trees, command weather, and heal wounds. Wild magic near dying groves misfires unpredictably.",
    skill_checks:
      "Three paths exist for almost every obstacle: find a way around (Cunning), ask the forest for help (Kinship), or push through (Resolve). Failure advances the story, not ends it.",
    hard_constraints: [
      "Iron and fire cause lasting harm to the forest — using them draws hostile attention.",
      "The World Tree cannot be seen directly; its presence is felt as warmth, birdsong, or sudden quiet.",
    ],
  },
  entities: [
    {
      id: "npc.elder-fern",
      kind: "npc",
      name: "Elder Fern",
      description:
        "An ancient dryad whose bark has grown pale and cold. Once the most powerful druid alive. Now she spends her days listening to the forest's diminishing voice.",
      attributes: { disposition: "grieving but hopeful" },
    },
    {
      id: "npc.scratchwing",
      kind: "npc",
      name: "Scratchwing",
      description:
        "A raven with one silver feather who claims to have seen the first tree planted. Sharp-tongued, loves bargains, fiercely honest.",
      attributes: { disposition: "self-interested but trustworthy" },
    },
    {
      id: "npc.hollow-knight",
      kind: "npc",
      name: "The Hollow Knight",
      description:
        "A figure of living wood and moss wearing ancient armor. Patrols the outer reaches. Attacks on sight — but hesitates if addressed by an old druidic greeting.",
      attributes: { disposition: "hostile until disarmed with knowledge" },
    },
    {
      id: "loc.heartwood",
      kind: "location",
      name: "The Heartwood",
      description:
        "The deepest part of the forest where the oldest trees grow so close together that sunlight only reaches the floor at midday. The air tastes green.",
      attributes: {},
    },
    {
      id: "loc.mossy-ruin",
      kind: "location",
      name: "The Mossy Ruins of Vel",
      description:
        "What remains of a druid city swallowed by the forest centuries ago. Stone archways draped in flowering vines. Something valuable was left here when the druids fled.",
      attributes: {},
    },
    {
      id: "loc.silent-grove",
      kind: "location",
      name: "The Silent Grove",
      description:
        "A patch of forest where no birds sing and no wind moves. The trees here are ash-grey. Whatever is killing the World Tree's voice began here.",
      attributes: {},
    },
    {
      id: "item.seedling",
      kind: "item",
      name: "a seedling of silver bark",
      description:
        "A tiny sapling that glows faintly at night. It hums in the presence of dying trees, growing warmer as the cause draws closer.",
      attributes: { from: "Elder Fern" },
    },
  ],
  timeline: [
    { when: "Three centuries ago", what: "The druids of Vel abandoned their city and scattered into the deep forest." },
    { when: "Last season", what: "The World Tree's song — heard as wind through the canopy — fell silent for the first time." },
    { when: "Tonight", what: "The first ancient tree at the edge of the Heartwood died with no visible cause." },
  ],
  character_creation: {
    origins: ["forest-born wanderer", "city scholar seeking proof of old magic", "outcast druid apprentice"],
    classes: [],
    stats: ["Cunning", "Kinship", "Resolve"],
    starting_items: ["bark-bound journal", "a vial of silver sap", "dried wayfarer's bread"],
  },
  starting_scenario:
    "You enter the Verdant Wilds at dawn, following a silver-feathered raven that dropped a dying leaf at your feet three days ago. The forest floor is carpeted in fallen leaves that should not have fallen yet.",
  win_states: ["Discover why the World Tree is going silent and give it a chance to heal."],
  fail_states: ["The silence spreads until the last tree falls."],
};

export function verdantWildsStartingState(characterName = "Rowan"): CampaignState {
  return {
    scene: {
      name: "Forest's Edge",
      summary: "Dawn. A raven watches from a gnarled oak. The air smells of rain and old wood.",
    },
    turn_number: 0,
    character: {
      name: characterName,
      stats: { Cunning: 2, Kinship: 2, Resolve: 0 },
      background: { origin: "forest-born wanderer" },
    },
    inventory: [
      { name: "bark-bound journal", quantity: 1, tags: ["writing"] },
      { name: "a vial of silver sap", quantity: 1, tags: ["magical"] },
      { name: "dried wayfarer's bread", quantity: 2, tags: ["food"] },
    ],
    quests: [],
    relationships: [],
    codex: [],
    flags: {},
  };
}
