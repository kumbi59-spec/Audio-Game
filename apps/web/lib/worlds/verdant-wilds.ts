import type { WorldData } from "@/types/world";

export const VERDANT_WILDS: WorldData = {
  id: "prebuilt-verdant-wilds",
  name: "The Verdant Wilds",
  description:
    "A lush, ancient forest hides a dying secret. The trees remember everything — and something is making them forget.",
  genre: "nature-fantasy",
  tone: "hopeful",
  systemPrompt: `WORLD: THE VERDANT WILDS

Setting: The Verdant Wilds — an old-growth forest spanning a continent's breadth. Ancient druids shaped it over millennia. Talking beasts, living plants, and lost ruins fill its depths. At the heart, the World Tree is slowly going silent, and every death it suffers ripples outward as more and more of the forest loses its voice.

Tone: Warm but urgent. Lyrical, wonder-filled. The stakes are real and rising, but acts of kindness and connection genuinely change things here. Not everything is a threat — much of the world will help if treated with care.

Key Locations:
- Forest's Edge: The borderland where the old growth begins. Ash-grey leaves have started falling here weeks before autumn. Elder Fern keeps a small shrine of warm stones where the forest is still healthy.
- The Heartwood: The deepest part of the forest where the oldest trees grow so close that sunlight only touches the floor at midday. The air here tastes green and electric. Resonance glyphs carved into bark glow faint gold.
- The Mossy Ruins of Vel: What remains of a druid city swallowed by the forest three centuries ago. Stone archways draped in flowering vines. A sealed vault no one has opened since the druids fled.
- The Silent Grove: A patch of forest where no birds sing and no wind moves. The trees are ash-grey. Whatever is killing the World Tree's voice began here. The air has a faint taste of iron.

Key NPCs:
- Elder Fern (id: npc-elder-fern): An ancient dryad whose bark has grown pale and cold. Once the most powerful druid alive. She knows what is happening but cannot bring herself to say it aloud. She speaks slowly, with long pauses. She will trust the player if they listen more than they speak.
- Scratchwing (id: npc-scratchwing): A raven with one silver feather. Claims to have seen the first tree planted. Sharp-tongued, loves trades, fiercely honest about everything except his own history. He can navigate the Heartwood blindfolded.
- The Hollow Knight (id: npc-hollow-knight): A figure of living wood and moss wearing ancient armor. Patrols the outer reaches. Attacks without warning — but hesitates if addressed by the old druidic greeting: "Root before branch, branch before sky."

Rules Notes:
- Iron and fire cause lasting harm to the forest. Using them draws immediate hostile attention from the Hollow Knight and wary beasts.
- The World Tree cannot be seen directly. Its presence is felt as warmth, birdsong, sudden quiet, or the smell of rain on dry stone.
- Most obstacles have three paths: find a way around (Cunning), ask the forest for help (Kinship), or push through (Resolve). The forest remembers which path was taken.
- Healing is abundant in healthy areas of the forest. In or near the Silent Grove, wounds do not close easily.

Opening Scenario:
The player enters the Verdant Wilds at dawn, following a raven with a silver feather who dropped a dying leaf at their feet three days ago and then flew west without looking back. The forest floor is carpeted in fallen leaves that should not have fallen yet. Elder Fern is waiting at the treeline, holding a seedling of silver bark that pulses faintly like a heartbeat.

Sound Design:
- Forest's Edge and general travel: forest_day ambient
- Heartwood: forest_night ambient (quieter, more resonant)
- Silent Grove: silence — no ambient sound at all
- Ruins of Vel: cave ambient (cool stone, distant drip)`,
  isPrebuilt: true,
  imageUrl: "/images/worlds/verdant-wilds.svg",
  locations: [
    {
      id: "loc-vw-forest-edge",
      name: "Forest's Edge",
      description:
        "The borderland where cultivated fields give way to old growth. A line of ash-grey leaves marks where the forest sickness has reached. Elder Fern keeps a small shrine of warm, smooth stones here — the only warmth for a hundred paces in any direction. The path into the forest is clear but the canopy overhead is too quiet.",
      shortDesc: "The treeline where forest sickness is first visible",
      ambientSound: "forest_day",
      connectedTo: ["loc-vw-heartwood", "loc-vw-ruins"],
      properties: { danger: "low", elder_fern_here: true },
    },
    {
      id: "loc-vw-heartwood",
      name: "The Heartwood",
      description:
        "The deepest part of the forest. Ancient trees grow so close together that their canopies merge overhead into a single vault of dark green. Sunlight reaches the floor only at noon, as a single golden column. Resonance glyphs carved into the largest trunks glow faint gold and hum at a frequency felt more than heard. The World Tree's silence is loudest here.",
      shortDesc: "The ancient core of the forest, glowing with druid-carved glyphs",
      ambientSound: "forest_night",
      connectedTo: ["loc-vw-forest-edge", "loc-vw-silent-grove"],
      properties: { danger: "medium", glyph_active: true },
    },
    {
      id: "loc-vw-ruins",
      name: "The Mossy Ruins of Vel",
      description:
        "A druid city swallowed by the forest three centuries ago. Stone archways stand draped in flowering vines. Carved tiles, worn smooth, still show maps of a forest that no longer matches the one around it. At the back of the ruin, a sealed vault door of black stone stands unchanged. No moss grows on it.",
      shortDesc: "The ruins of an ancient druid city with a sealed vault",
      ambientSound: "cave",
      connectedTo: ["loc-vw-forest-edge"],
      properties: { danger: "medium", vault_sealed: true },
    },
    {
      id: "loc-vw-silent-grove",
      name: "The Silent Grove",
      description:
        "No birds. No wind. The trees here are the grey of old ash, their bark smooth and cold. The fallen leaves do not rustle underfoot — they simply compress to dust. The air tastes faintly of iron. This is where it began. Something in the soil here has changed, and the change is spreading outward at the rate of one tree per day.",
      shortDesc: "The origin of the forest's sickness — unnervingly quiet",
      ambientSound: undefined,
      connectedTo: ["loc-vw-heartwood"],
      properties: { danger: "high", sickness_origin: true, no_ambient: true },
    },
  ],
  npcs: [
    {
      id: "npc-elder-fern",
      name: "Elder Fern",
      role: "Ancient Dryad, former Arch-Druid",
      personality:
        "Grieving but not hopeless. She speaks slowly, in long sentences, with pauses that feel deliberate rather than hesitant. She knows more than she says and will share it with someone who listens. She will ask the player to prove they can be still before she trusts them with what she knows.",
      voiceDescription: "soft, resonant, like wind through tall grass — unhurried even in crisis",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-vw-forest-edge",
    },
    {
      id: "npc-scratchwing",
      name: "Scratchwing",
      role: "Ancient Raven, Forest Guide",
      personality:
        "Sharp-tongued and proud of it. He bargains for everything and always delivers on a deal. He will guide the player through the Heartwood in exchange for something unexpected — a specific memory, a spoken secret, a promise. He knows the Silent Grove better than anyone still living.",
      voiceDescription: "clipped, quick, dry — every sentence sounds like a verdict",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-vw-forest-edge",
    },
    {
      id: "npc-hollow-knight",
      name: "The Hollow Knight",
      role: "Ancient Guardian",
      personality:
        "Not cruel — bound. He was charged with protecting the Heartwood a thousand years ago and the charge has never been rescinded. He attacks what enters without permission. He can be stilled with the druidic greeting. He has not spoken in three centuries and does not know if the World Tree's silence means he is released.",
      voiceDescription: "deep, slow, like the groan of a settling tree — few words, each one final",
      relationship: "hostile",
      isAlive: true,
      locationId: "loc-vw-heartwood",
    },
  ],
};
