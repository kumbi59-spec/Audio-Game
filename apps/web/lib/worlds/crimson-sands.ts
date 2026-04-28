import type { WorldData } from "@/types/world";

export const CRIMSON_SANDS: WorldData = {
  id: "prebuilt-crimson-sands",
  name: "Crimson Sands",
  description:
    "A vast desert hides a buried empire. Every tomb you open asks whether the dead should stay buried.",
  genre: "desert-archaeology",
  tone: "mysterious",
  systemPrompt: `WORLD: CRIMSON SANDS

Setting: The Crimson Wastes — a sea of red sand covering a civilization that vanished two thousand years ago in a single night. Scholar-guilds, tomb raiders, and zealous Preservers compete over what is down there. No one has reached the throne room of the last emperor. The Seventh Gate — the deepest entrance ever found — was exposed three months ago by a sandstorm. A rival guild reached it twelve hours ahead of the player. Their camp is abandoned. Their dig equipment is still running.

Tone: Dry wit, genuine wonder at discovery, weight of consequence. The mysteries here are real and the answers matter. Some things in the deep tombs are best left alone — but the player gets to decide that, not the game.

Key Locations:
- Expedition Camp — The Red Shelf: The only shade for thirty miles: a sandstone outcropping with tents, supply crates, and a hand-drawn map. The rival guild's abandoned camp is visible two hours north. The entrance to the Seventh Gate descends from behind the largest boulder.
- Antechamber of the Seventh Gate: Forty feet below the sand. Walls covered in resonance-glyphs glowing faint amber after two millennia. The air smells like hot stone and ozone. Three sealed doors, each marked with a different warning glyph.
- The Deep Archive: A vast underground library carved from living rock. Intact. The rival guild found this and then something stopped them from going further. Their equipment is here, still running.
- The Throne Room: The innermost chamber. No expedition has ever reached it and returned to describe what is inside. Ysa's notes suggest the last emperor sealed himself in with something he refused to let the world have.

Key NPCs:
- Archivist Ysa (id: npc-ysa): The player's employer. Forty years mapping the Wastes. Found less than she expected and kept quiet about what she did find. She is helpful, expert, and hiding a specific piece of knowledge that will change the meaning of everything the player discovers. She is not malicious — she is afraid of what would happen if it were known.
- Kael the Bonepicker (id: npc-kael): A professional tomb raider who knows every entrance in the Wastes. He works alone, charges for everything, and has saved the player's life twice before this expedition. He can be bought but not fooled. He is afraid of the Seventh Gate and won't say why.
- Preserver Orah (id: npc-orah): A young zealot from the Order of Sealed Tombs. She believes the empire's collapse was divine judgment and that opening the tombs courts repetition. She may be right. She is not an antagonist — she is someone with genuine insight and genuine fear who the player might need to hear.

Rules Notes:
- Resonance-glyphs remain active after two thousand years. Touching them without understanding their function causes immediate, dangerous effects. With a glyph-reading lens, function becomes legible.
- Sound carries in the tombs. Combat alerts everything within two chambers.
- Removing artifacts without a Preserver seal is a crime. Enforcement above ground is inconsistent. Enforcement below it is nonexistent.
- Three stats: Lore (knowledge, glyph-reading, historical context), Grit (endurance, combat, holding nerves), Sand-sense (navigation, reading danger, finding what is hidden).

Opening Scenario:
The player descends into the Seventh Gate at dawn. The rival guild's lanterns are still burning somewhere ahead in the dark. Ysa is three steps behind, too quiet. Kael has not been seen since yesterday evening.

Sound Design:
- Surface camp: desert ambient
- Antechamber and general underground: cave ambient
- Deep Archive: silence broken by the hum of still-active equipment
- Throne Room: no ambient — absolute quiet`,
  isPrebuilt: true,
  imageUrl: "/images/worlds/crimson-sands.svg",
  locations: [
    {
      id: "loc-cs-camp",
      name: "Expedition Camp — The Red Shelf",
      description:
        "A sandstone outcropping providing the only shade for thirty miles. The camp is functional and spare — tents staked against the wind, supply crates stenciled with guild marks, a hand-drawn topographic map pinned to a board and already curling in the dry heat. The entrance to the Seventh Gate descends from behind the largest boulder. The rival guild's abandoned camp is visible to the north, its flag still snapping in the hot wind.",
      shortDesc: "The base camp above the Seventh Gate entrance",
      ambientSound: "desert",
      connectedTo: ["loc-cs-antechamber"],
      properties: { danger: "low", ysa_here: true, camp_base: true },
    },
    {
      id: "loc-cs-antechamber",
      name: "Antechamber of the Seventh Gate",
      description:
        "Forty feet below the surface, carved from red sandstone so dense it feels more like iron underfoot. Every wall surface is covered in resonance-glyphs still glowing amber after two millennia — a fact the guild records had not prepared anyone for. The air smells of hot stone, ozone, and something faintly organic that has no name. Three doors, each sealed with a different warning glyph. The left one has been recently disturbed.",
      shortDesc: "The entrance chamber, glyph-covered walls still active after two thousand years",
      ambientSound: "cave",
      connectedTo: ["loc-cs-camp", "loc-cs-archive"],
      properties: { danger: "medium", glyphs_active: true, left_door_disturbed: true },
    },
    {
      id: "loc-cs-archive",
      name: "The Deep Archive",
      description:
        "A library the size of a cathedral, carved from living rock. Every wall is shelved. The scrolls and tablets on those shelves are intact — protected by a preservation glyph still functioning at full capacity. The rival guild's equipment is here: lanterns, rope lines, a survey instrument on a tripod, still running. No bodies. No sign of struggle. Just abandonment in the middle of work.",
      shortDesc: "An intact underground library — the rival guild stopped here",
      ambientSound: "cave",
      connectedTo: ["loc-cs-antechamber", "loc-cs-throne"],
      properties: { danger: "medium", rival_equipment_here: true, archive_intact: true },
    },
    {
      id: "loc-cs-throne",
      name: "The Throne Room",
      description:
        "The innermost chamber. No expedition in recorded history has reached this point and returned to describe what is here. Ysa's notes — the private ones, not the ones she shared — suggest the last emperor sealed himself inside with something he refused to let the world have. The door is the only one in the complex made of a different material: black stone that does not reflect the lantern light.",
      shortDesc: "The final chamber — the emperor's sealed room, never reached before",
      ambientSound: undefined,
      connectedTo: ["loc-cs-archive"],
      properties: { danger: "extreme", never_reached: true, no_ambient: true },
    },
  ],
  npcs: [
    {
      id: "npc-ysa",
      name: "Archivist Ysa",
      role: "Scholar, expedition leader",
      personality:
        "Expert, calm, genuinely warm. She has spent forty years earning credibility and uses it carefully. She will answer any question with complete honesty except for the one specific thing she knows that changes the meaning of the expedition. She is not hiding it maliciously — she is afraid of what happens to the people she cares about if it becomes known. She will eventually tell the truth if directly confronted.",
      voiceDescription: "measured, precise, slightly formal — the cadence of someone who has spent decades composing sentences for the record",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-cs-camp",
    },
    {
      id: "npc-kael",
      name: "Kael the Bonepicker",
      role: "Tomb raider, freelance",
      personality:
        "Cheerful about danger and blunt about everything else. He charges for every service and always delivers exactly what was agreed. He is afraid of the Seventh Gate specifically and will not explain why — only that he came once before, alone, and turned back at the Antechamber. He will help the player if paid but his fear is real and it is contagious.",
      voiceDescription: "quick, casual, uses technical tomb-raiding vocabulary as if it were everyday speech",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-cs-camp",
    },
    {
      id: "npc-orah",
      name: "Preserver Orah",
      role: "Order of Sealed Tombs zealot",
      personality:
        "Young, certain, frightened underneath. She believes the empire was destroyed as punishment and that opening the tombs risks repeating the cause. She has specific theological knowledge about the last emperor that the guilds have suppressed for generations. She is not wrong about the danger — she is wrong about the solution. She will not back down but she will listen to someone who takes her seriously.",
      voiceDescription: "formal, slightly stiff — the speech patterns of someone trained in ritual language who is trying very hard to sound authoritative",
      relationship: "hostile",
      isAlive: true,
      locationId: "loc-cs-camp",
    },
  ],
};
