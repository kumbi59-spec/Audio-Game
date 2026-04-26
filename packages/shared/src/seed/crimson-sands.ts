import type { CampaignState, GameBible } from "../index.js";

export const CRIMSON_SANDS_BIBLE: GameBible = {
  version: 1,
  title: "Crimson Sands",
  pitch:
    "A vast desert hides a buried empire. Every tomb you open asks whether the dead should stay buried.",
  genre: "desert archaeology",
  setting:
    "The Crimson Wastes: a sea of red sand covering a civilization that vanished two thousand years ago. Scholar-guilds, tomb raiders, and zealous Preservers all want what is down there — for very different reasons.",
  style_mode: "adventure",
  tone: {
    voice: "dry wit, wonder at discovery, weight of consequence",
    pacing: "methodical exploration punctuated by sudden danger",
    content_rating: "teen",
    forbidden_topics: [],
  },
  rules: {
    combat:
      "Rare in the deep tombs (sound carries, traps trigger). Above ground, rival guilds and sand-jackals are common. Resolve in two exchanges. Retreat is always the smart call.",
    magic:
      "The buried empire used resonance-glyphs — runes that still function after two millennia. Touching them without preparation is dangerous. With the right knowledge, they open doors, light chambers, or unleash something worse.",
    skill_checks:
      "Three stats: Lore (knowledge, glyph-reading), Grit (endurance, combat), Sand-sense (navigation, intuition, reading danger). Any skill can be applied creatively.",
    hard_constraints: [
      "The dead empire left traps that are still armed — assume every sealed chamber is guarded.",
      "Removing artifacts from the Wastes without a Preserver seal is a crime punishable by exile. Enforcement is inconsistent.",
    ],
  },
  entities: [
    {
      id: "npc.archivist-ysa",
      kind: "npc",
      name: "Archivist Ysa",
      description:
        "A compact woman in sand-bleached scholar robes. She has spent forty years mapping the Wastes and found less than she expected. She hired you. She is hiding something.",
      attributes: { disposition: "mentor with secrets" },
    },
    {
      id: "npc.kael",
      kind: "npc",
      name: "Kael the Bonepicker",
      description:
        "A professional tomb raider who works alone, except when he doesn't. He always knows where you are and occasionally saves your life — and then charges for it.",
      attributes: { disposition: "morally flexible ally" },
    },
    {
      id: "npc.preserver-orah",
      kind: "npc",
      name: "Preserver Orah",
      description:
        "A young zealot from the Order of Sealed Tombs. She believes the buried empire's collapse was divine punishment and that anyone who disturbs the tombs risks repeating it. She may be right.",
      attributes: { disposition: "opposing but not villainous" },
    },
    {
      id: "loc.surface-camp",
      kind: "location",
      name: "Expedition Camp — The Red Shelf",
      description:
        "A sandstone outcropping that provides the only shade for thirty miles. Tents, supply crates, a hand-drawn map pinned to a board. The nearest rival guild's camp is two hours north.",
      attributes: {},
    },
    {
      id: "loc.antechamber",
      kind: "location",
      name: "The Antechamber of the Seventh Gate",
      description:
        "Forty feet below the sand. Walls covered in resonance-glyphs still glowing faint amber. The air smells like hot stone and something older. Three sealed doors.",
      attributes: {},
    },
    {
      id: "loc.inner-sanctum",
      kind: "location",
      name: "The Inner Sanctum",
      description:
        "No expedition in living memory has opened the final gate. Ysa's maps say it leads to the throne room of the last emperor. Whatever is there has been undisturbed for two thousand years.",
      attributes: {},
    },
    {
      id: "item.glyph-lens",
      kind: "item",
      name: "glyph-reading lens",
      description:
        "A disc of amber crystal in a brass frame. When held up to resonance-glyphs, their function becomes legible — danger, doorway, warning, or something harder to translate.",
      attributes: { from: "Archivist Ysa" },
    },
  ],
  timeline: [
    { when: "Two thousand years ago", what: "The empire of the Crimson Throne vanished in a single night. No record outside the Wastes explains why." },
    { when: "Three months ago", what: "A sandstorm exposed the Seventh Gate — the deepest entrance ever found." },
    { when: "Yesterday", what: "A rival guild reached the site twelve hours ahead of you. Their camp is abandoned. Their dig equipment is still running." },
  ],
  character_creation: {
    origins: ["guild scholar on first field assignment", "freelance sand-guide with a past", "disgraced Preserver seeking answers"],
    classes: [],
    stats: ["Lore", "Grit", "Sand-sense"],
    starting_items: ["glyph-reading lens", "sand-proof compass", "water ration (3 days)"],
  },
  starting_scenario:
    "You descend into the Seventh Gate at dawn. The rival guild's lanterns are still burning somewhere ahead in the dark. Ysa is three steps behind you, too quiet.",
  win_states: [
    "Learn what destroyed the empire — and decide whether that knowledge should come back up with you.",
  ],
  fail_states: ["Lose yourself to the dark — or bring something back that should have stayed buried."],
};

export function crimsonSandsStartingState(characterName = "Dune"): CampaignState {
  return {
    scene: {
      name: "The Seventh Gate — Entry Shaft",
      summary: "Rival lanterns ahead. Ysa is silent. The glyph above the door pulses once as you pass.",
    },
    turn_number: 0,
    character: {
      name: characterName,
      stats: { Lore: 2, Grit: 1, "Sand-sense": 1 },
      background: { origin: "guild scholar on first field assignment" },
    },
    inventory: [
      { name: "glyph-reading lens", quantity: 1, tags: ["tool", "magical"] },
      { name: "sand-proof compass", quantity: 1, tags: ["navigation"] },
      { name: "water ration", quantity: 3, tags: ["food", "survival"] },
    ],
    quests: [],
    relationships: [],
    codex: [],
    flags: { rival_guild_ahead: true },
  };
}
