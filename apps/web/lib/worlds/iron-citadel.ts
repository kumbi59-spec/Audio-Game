import type { WorldData } from "@/types/world";

export const IRON_CITADEL: WorldData = {
  id: "prebuilt-iron-citadel",
  name: "The Iron Citadel",
  description:
    "A vast industrial fortress-city where the revolution is already failing. You arrive on the last night before the Engines go dark.",
  genre: "steampunk-thriller",
  tone: "tense",
  systemPrompt: `WORLD: THE IRON CITADEL

Setting: A city-sized iron fortress built over an active volcanic fissure. The Citadel has six tiers: the Founders at the top behind polished brass railings and filtered air, the Engine Workers at the bottom breathing recirculated steam. The Engines in the volcanic core power heat, light, and breathable air for the lower tiers. They are shutting down. No one above Tier Three knows yet.

Tone: Terse, pressured, noir-adjacent. Every minute matters. There is real ideology here on every side — even the villains have reasons. The player's choices about who to trust and what to sacrifice will determine what the Citadel becomes after this night.

Key Locations:
- Tier Three — Gearwork District: Mid-level workshops. Oil, hot metal, and exhaust. The Coalition holds two buildings here. Security patrols have doubled in the last two hours.
- The Engine Core: The volcanic heart of the Citadel, sixty metres below Tier Six. Three security checkpoints, a heat-suited descent, and a sound that should be deafening — and isn't. The Engines are running at 30% capacity.
- Tier One — Founders' Quarter: Polished brass railings and filtered air. Six founding families have governed the Citadel since its construction. Their personal guards carry resonance-disruptors. No unauthorized person has reached this tier in forty years.
- Maintenance Ducts: A network of ventilation shafts connecting all tiers. Barely large enough for an adult. Used exclusively by Engine resonators — people with the rare ability to interface directly with the Engines.

Key NPCs:
- Sable (id: npc-sable): Leader of the Engine Workers' Coalition — the revolution that peaked six months ago and is now fracturing under exhaustion and betrayal. Brilliant and running on ideology and stimulant pills. She will ally with the player but she is not above using them.
- Overseer Drek (id: npc-drek): Head of Citadel Security. Impassive and methodical. He has known the Engines were failing for ten days and has been making private arrangements for his family's evacuation. He is not a monster — he is a man who stopped believing salvation was possible.
- Pip (id: npc-pip): Fourteen years old. A rare Engine resonator who has been hiding in the maintenance ducts for three days. She knows exactly what is wrong with the Engines. She is terrified to say it because the answer implicates someone the Coalition trusts.

Rules Notes:
- Firearms, steam-lances, and bare-knuckle fighting are all common. Combat resolves in two exchanges. Wounds accumulate — three before going down.
- No magic. Some workers have resonance — the ability to physically interface with Engines. It is exhausting, disorienting, and in high-energy environments, dangerous.
- The Citadel exits are sealed for the maintenance lockdown. There is no leaving before dawn.
- Tier One has never been breached. Getting there requires either the right access or the right company.

Opening Scenario:
The player is in Tier Three when the emergency klaxon sounds for the third time tonight. Sable shoves a folded map into their hands: "Pip was last seen near Engine Shaft Seven. Find her before Drek does." Outside, Security Corps boots are already on the grating.

Sound Design:
- Tier Three and general: city_night ambient (industrial hum underneath)
- Engine Core: dungeon ambient (substitute for deep machinery)
- Maintenance ducts: cave ambient
- Tier One: no ambient — unsettling quiet`,
  isPrebuilt: true,
  imageUrl: null,
  locations: [
    {
      id: "loc-ic-tier-three",
      name: "Tier Three — Gearwork District",
      description:
        "Mid-level workshops packed between steam vents and gear towers. The air smells of oil, hot metal, and the faint char of overworked machinery. The Coalition holds two buildings here — a tool store and a former mess hall — and both have their shutters drawn. Security Corps officers in pairs, recognizable by the resonance-disruptors at their belts, move methodically through the district.",
      shortDesc: "The Coalition's stronghold district, now under doubled security patrol",
      ambientSound: "city_night",
      connectedTo: ["loc-ic-engine-core", "loc-ic-ducts"],
      properties: { danger: "high", coalition_presence: true },
    },
    {
      id: "loc-ic-engine-core",
      name: "The Engine Core",
      description:
        "Sixty metres below Tier Six, accessible through three security checkpoints and a heat-suited descent by cable car. The sound here should be immense — the foundational roar that every Citadel resident has lived with since birth. It is not. The Engines are running at a fraction of their designed output. Banks of gauges are all in the red. The heat is still intense but wrong — thin, like the last warmth in a dying fire.",
      shortDesc: "The volcanic heart of the Citadel — running at 30% and falling",
      ambientSound: "dungeon",
      connectedTo: ["loc-ic-tier-three"],
      properties: { danger: "very_high", engine_failing: true, heat_suit_required: true },
    },
    {
      id: "loc-ic-ducts",
      name: "Maintenance Ducts",
      description:
        "A network of ventilation shafts connecting all six tiers. Barely wide enough for a grown adult moving on hands and knees. The metal is warm and the air tastes recycled. You can hear everything from inside the ducts — conversations, footsteps, the klaxon echoing through the shafts like a bell in a well. Pip knows every junction.",
      shortDesc: "Ventilation shafts connecting all tiers — Pip's hiding place",
      ambientSound: "cave",
      connectedTo: ["loc-ic-tier-three", "loc-ic-founders-tier"],
      properties: { danger: "medium", pip_hiding: true },
    },
    {
      id: "loc-ic-founders-tier",
      name: "Tier One — Founders' Quarter",
      description:
        "Polished brass railings, filtered air, and the absence of the industrial sounds that fill every other tier. Six founding families have occupied this level since the Citadel was constructed. The decor is deliberately austere — wealth expressed as quality, not excess. The guards here carry resonance-disruptors and do not stop to ask questions. No unauthorized person has reached this tier in forty years.",
      shortDesc: "The ruling Founders' level — unbreached for forty years",
      ambientSound: undefined,
      connectedTo: ["loc-ic-ducts"],
      properties: { danger: "extreme", founders_here: true, no_ambient: true },
    },
  ],
  npcs: [
    {
      id: "npc-sable",
      name: "Sable",
      role: "Coalition Leader",
      personality:
        "Brilliant and exhausted in equal measure. She genuinely believes in what the Coalition is fighting for and that makes her both inspiring and dangerous — she will ask the player to do things that cost. She trusts slowly but completely. She is hiding that she has already been offered a private evacuation deal and has not yet decided whether to take it.",
      voiceDescription: "low, precise, accent from the lower tiers — drops into silence when thinking, then speaks in complete sentences",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-ic-tier-three",
    },
    {
      id: "npc-drek",
      name: "Overseer Drek",
      role: "Head of Citadel Security",
      personality:
        "Impassive, methodical, and privately grief-stricken. He stopped believing the Citadel could be saved and started making arrangements. He will not explain himself. He will not be reasoned with through ideology. He might be reached through the specific fact he has not yet confronted: the Engines can be saved, but only with information that ruins someone he thought was an ally.",
      voiceDescription: "flat, even — gives orders in the same tone he discusses weather",
      relationship: "hostile",
      isAlive: true,
      locationId: "loc-ic-tier-three",
    },
    {
      id: "npc-pip",
      name: "Pip",
      role: "Engine Resonator, age 14",
      personality:
        "Frightened and certain. She has the specific technical knowledge that can save the Engines and the specific social knowledge of why it has been suppressed. She will not trust easily — she has been in the ducts for three days because she trusts no one. The player has to earn the information, not just find her.",
      voiceDescription: "quick, quiet, pauses to listen before speaking — sounds older than fourteen when she talks about the Engines",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-ic-ducts",
    },
  ],
};
