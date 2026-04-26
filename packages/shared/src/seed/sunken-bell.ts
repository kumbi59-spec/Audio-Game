import type { CampaignState, GameBible } from "../index.js";

/**
 * A small, self-contained world used for onboarding, demos, and the Phase 1
 * end-to-end smoke test. The parsing pipeline for uploaded bibles produces
 * the same GameBible shape; hand-authored worlds like this one are just
 * another source.
 */
export const SUNKEN_BELL_BIBLE: GameBible = {
  version: 1,
  title: "The Sunken Bell",
  pitch:
    "A short gothic mystery in a drowned bell tower. Every hour the bell tolls — from somewhere deep beneath the water.",
  genre: "gothic mystery",
  setting:
    "The fishing village of Lirren, shrouded in fog. A ruined bell tower leans at the edge of the harbor, half-submerged.",
  style_mode: "mystery",
  tone: {
    voice: "hushed, observant, deliberate",
    pacing: "slow-building dread",
    content_rating: "teen",
    forbidden_topics: [],
  },
  rules: {
    combat: "Rare. Most danger is psychological. Resolve fights in a single exchange.",
    magic: "There is no overt magic, but objects tied to the bell feel wrong to the touch.",
    skill_checks:
      "Ask for a check only when failure would be genuinely interesting. Prefer narrative consequences to numeric outcomes.",
    hard_constraints: [
      "There are no firearms in Lirren.",
      "The bell never appears above water during daylight.",
    ],
  },
  entities: [
    {
      id: "npc.mara",
      kind: "npc",
      name: "Mara, the lighthouse keeper",
      description:
        "Weathered, watchful. Lost her brother to the tide years ago. Keeps a small shrine of his things.",
      attributes: { disposition: "wary but fair" },
    },
    {
      id: "loc.harbor",
      kind: "location",
      name: "The Harbor",
      description:
        "A narrow crescent of wet stone. Fishing boats slap their ropes against the posts. The ruined bell tower leans over the water at the far end.",
      attributes: {},
    },
    {
      id: "loc.tower",
      kind: "location",
      name: "The Sunken Bell Tower",
      description:
        "Half-swallowed by the sea. A staircase spirals down into black water. At low tide the first few steps are dry.",
      attributes: {},
    },
    {
      id: "item.coin",
      kind: "item",
      name: "a tarnished bell-shaped coin",
      description:
        "Found pressed into the wet sand. It hums faintly against the palm when the bell tolls.",
      attributes: { from: "unknown" },
    },
  ],
  timeline: [
    {
      when: "Forty years ago",
      what: "A storm broke the bell tower's foundation; it has been leaning into the sea ever since.",
    },
    {
      when: "Tonight",
      what: "The bell has begun tolling every hour on the hour.",
    },
  ],
  character_creation: {
    origins: ["traveling scribe", "estranged child of Lirren", "wandering confessor"],
    classes: [],
    stats: ["Observation", "Nerve", "Kinship"],
    starting_items: ["notebook", "oil lantern", "a letter from home"],
  },
  starting_scenario:
    "You arrive in Lirren at dusk as the fog is rolling in. The harbor is empty but for a single lantern moving along the breakwater.",
  win_states: ["Discover what tolls the bell and decide what to do about it."],
  fail_states: ["Be silenced before you learn the truth."],
};

export function sunkenBellStartingState(characterName = "Wren"): CampaignState {
  return {
    scene: {
      name: "Arrival",
      summary: "Dusk in Lirren. Fog. A lone lantern on the breakwater.",
    },
    turn_number: 0,
    character: {
      name: characterName,
      stats: { Observation: 2, Nerve: 1, Kinship: 1 },
      background: { origin: "traveling scribe" },
    },
    inventory: [
      { name: "notebook", quantity: 1, tags: ["writing"] },
      { name: "oil lantern", quantity: 1, tags: ["light"] },
      { name: "a letter from home", quantity: 1, tags: ["sentimental"] },
    ],
    quests: [],
    relationships: [],
    codex: [],
    flags: {},
  };
}
