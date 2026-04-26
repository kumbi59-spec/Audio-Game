import type { CampaignState, GameBible } from "../index.js";

export const IRON_CITADEL_BIBLE: GameBible = {
  version: 1,
  title: "The Iron Citadel",
  pitch:
    "A vast industrial fortress-city where the revolution is already failing. You arrive on the last night before the Engines go dark.",
  genre: "steampunk thriller",
  setting:
    "The Citadel: a city-sized iron fortress built over an active volcanic fissure. Steam vents, gear-towers, and smog-choked skyways connect six tiers of society. The Engines in the deep core power everything — and they are shutting down.",
  style_mode: "political",
  tone: {
    voice: "terse, pressured, noir-adjacent",
    pacing: "fast — every minute counts",
    content_rating: "teen",
    forbidden_topics: [],
  },
  rules: {
    combat:
      "Frequent but brief. Firearms, steam-lances, and bare-knuckle brawling are all common. State the approach and resolve in two exchanges maximum. Wounds accumulate — the player has three before going down.",
    magic:
      "No traditional magic. Engineered 'resonance' allows some workers to interface directly with the Engines — a rare, exhausting ability treated as both gift and curse.",
    skill_checks:
      "Three stats: Muscle (force, endurance), Gear (technical skill, machines), Talk (persuasion, deception). Any situation can be approached with any stat if narrated cleverly.",
    hard_constraints: [
      "The Citadel's exits are sealed for Engine maintenance — there is no leaving until morning.",
      "Tier 1 (the ruling Founders) has never been breached. Not yet.",
    ],
  },
  entities: [
    {
      id: "npc.sable",
      kind: "npc",
      name: "Sable",
      description:
        "Leader of the Engine Workers' Coalition — the revolution that already peaked and is now fracturing. Brilliant, exhausted, running on ideology and stimulant pills.",
      attributes: { disposition: "desperate ally" },
    },
    {
      id: "npc.overseer-drek",
      kind: "npc",
      name: "Overseer Drek",
      description:
        "Head of the Citadel Security Corps. Impassive, methodical. Knows the Engines are dying and is quietly making private arrangements.",
      attributes: { disposition: "antagonist with a plan" },
    },
    {
      id: "npc.pip",
      kind: "npc",
      name: "Pip",
      description:
        "A fourteen-year-old Engine resonator who has been hiding in the maintenance ducts for three days. She knows what is actually wrong with the Engines. She is terrified to say it.",
      attributes: { disposition: "frightened, crucial" },
    },
    {
      id: "loc.tier-three",
      kind: "location",
      name: "Tier Three — The Gearwork District",
      description:
        "Mid-level workshops, smells of oil and hot metal. The Coalition holds two buildings here. Security patrols have doubled in the last hour.",
      attributes: {},
    },
    {
      id: "loc.engine-core",
      kind: "location",
      name: "The Engine Core",
      description:
        "The volcanic heart of the Citadel, accessible only through three security checkpoints and a heat-suited descent. The sound here is immense — or was. Now it is quieter than it should be.",
      attributes: {},
    },
    {
      id: "loc.founders-tier",
      kind: "location",
      name: "Tier One — The Founders' Quarter",
      description:
        "Polished brass railings and filtered air. Six families have governed the Citadel since it was built. Their guards carry resonance-disruptors.",
      attributes: {},
    },
    {
      id: "item.keycard",
      kind: "item",
      name: "a Security Corps access keycard",
      description:
        "Level-2 clearance. Gets you past the Gearwork checkpoints and one Engine Core door. Already reported missing — use it fast.",
      attributes: { level: "2" },
    },
  ],
  timeline: [
    { when: "Six months ago", what: "The Coalition seized three tiers of the Citadel in a general strike. The Founders negotiated a temporary truce." },
    { when: "Three days ago", what: "The Engine Core began losing pressure. The Founders declared a maintenance lockdown." },
    { when: "Tonight", what: "The Engines have four hours left. When they die, the Citadel goes dark and everyone below Tier Two loses heat and air." },
  ],
  character_creation: {
    origins: ["Coalition courier", "disgraced Security Corps officer", "Founder's ward gone rogue"],
    classes: [],
    stats: ["Muscle", "Gear", "Talk"],
    starting_items: ["a grease-stained satchel", "lock picks", "Coalition armband"],
  },
  starting_scenario:
    "You are in Tier Three when the emergency klaxon sounds for the third time tonight. Sable shoves a folded map into your hands: 'Pip was last seen near Engine Shaft Seven. Find her before Drek does.'",
  win_states: [
    "Discover what is truly killing the Engines and act on it before the lights go out.",
  ],
  fail_states: ["The Engines die before a solution is reached — and the Citadel falls dark."],
};

export function ironCitadelStartingState(characterName = "Rook"): CampaignState {
  return {
    scene: {
      name: "Tier Three — Coalition Safe House",
      summary: "Klaxons. Steam. Sable's eyes are bloodshot. The map is already in your hands.",
    },
    turn_number: 0,
    character: {
      name: characterName,
      stats: { Muscle: 1, Gear: 1, Talk: 2 },
      background: { origin: "Coalition courier" },
    },
    inventory: [
      { name: "grease-stained satchel", quantity: 1, tags: ["container"] },
      { name: "lock picks", quantity: 1, tags: ["tools"] },
      { name: "Coalition armband", quantity: 1, tags: ["faction"] },
    ],
    quests: [
      {
        name: "Find Pip",
        status: "active",
        objectives: [
          { text: "Locate Pip near Engine Shaft Seven", done: false },
          { text: "Keep her out of Drek's hands", done: false },
        ],
        log: [],
      },
    ],
    relationships: [],
    codex: [],
    flags: { klaxon_count: 3 },
  };
}
