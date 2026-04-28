import type { WorldData } from "@/types/world";

export const MIREWOOD: WorldData = {
  id: "prebuilt-mirewood",
  name: "The Mirewood",
  description:
    "A dark fairy-tale forest where stories are alive and hungry. The trees remember every lie ever spoken beneath them. Something ancient and patient waits at the wood's heart — and it has noticed you.",
  genre: "fairy-tale horror",
  tone: "unsettling",
  systemPrompt: `WORLD: THE MIREWOOD

Setting: A vast, ancient forest where the boundary between story and reality has worn thin. Folk tales walk the paths as living creatures. The deeper you go, the older and stranger the stories become. At the heart is the Loom — a structure no one who has reached it has ever left to describe.

Tone: Darkly whimsical, quietly threatening, like a familiar story told wrong. There is beauty here and genuine wonder, but the world is not safe and does not pretend to be. Hope exists in small, fierce moments.

Key Locations:
- The Threshold: The edge of the Mirewood, where the village of Ashfall backs up against the treeline. Villagers leave offerings here. The trees accept them without acknowledgement.
- The Hollow Road: A path that changes every night. Following it during the day is safe. Following it after dark is how people vanish.
- The Glass Pool: A perfectly still pool that shows not reflections but memories — yours or the wood's, you can never be sure which.
- The Loom: The wood's centre. No reliable description exists. Those who approach report hearing different things: a heartbeat, a lullaby, their own name.

Key NPCs:
- The Woodwarden (id: npc-woodwarden): An ancient figure, neither fully human nor fully tree. Speaks in questions. Does not lie, but every truth it shares costs something small.
- Brindle (id: npc-brindle): A young girl who wandered into the Mirewood three hundred years ago and forgot to leave. Cheerful, sharp, knows every path. Does not understand why you seem upset.
- The Collector (id: npc-collector): A figure in a long coat who trades in stories — not books, the actual living tales. Will offer you power in exchange for something you haven't missed yet.
- Sister Orin (id: npc-orin): A healer from Ashfall who ventures the wood's edge collecting remedies. Practical, kind, knows more than she says and says less than she knows.

Factions:
- The Storied: Living folk tales — the wolf, the witch, the clever third child. Ancient and strange, following patterns they cannot break. Not evil, not good. Narrative.
- The Waking Wood: The forest itself, slow and vast and attentive. It wants something from you. It's patient.
- Ashfall Village: A small community that has survived by keeping their bargains. Pragmatic about the horror next door. Quietly desperate.
- The Unwritten: Travellers like you who have entered the wood and refused its patterns. Small, defiant, hunted gently.

Rules Notes:
- The Mirewood rewards cleverness and story logic, not brute force. A sword is useful, but the right word at the right moment is more powerful.
- Bargains are binding. If you make a promise in the wood, the wood remembers.
- Time moves strangely. Hours inside may be minutes or days outside.
- The wood responds to narrative weight — dramatic moments, true names, spoken vows.
- Fear is not failure. Courage here means continuing despite fear, not its absence.

Opening Scenario:
You have entered the Mirewood chasing something important to you — a missing person, a lost object, a rumour of a cure. You are on the Threshold path as dusk falls, and the trees are beginning to lean toward you with what might be curiosity. Behind you, Ashfall's lights are still visible. Ahead, the Hollow Road is already starting to rearrange itself.

Sound Design:
- Threshold / Ashfall: forest_day ambient
- Mirewood paths: forest_night ambient
- The Glass Pool: cave ambient (still, echoing)
- Deep wood encounters: dungeon ambient`,
  isPrebuilt: true,
  imageUrl: "/images/worlds/mirewood.svg",
  locations: [
    {
      id: "loc-mirewood-threshold",
      name: "The Threshold",
      description:
        "The forest edge is not a clear line but a gradual dimming — of light, of certainty, of the ordinary rules you grew up trusting. The outermost trees are old oaks and ash, normal enough except for the offerings at their roots: small bundles of dried herbs, carved wooden discs, cups of milk gone sweet in the cool air. Behind you is Ashfall, its smoke-grey rooftops visible through the branches. Ahead, the forest begins in earnest.",
      shortDesc: "The uneasy border between Ashfall and the living wood",
      ambientSound: "forest_day",
      connectedTo: ["loc-mirewood-hollow-road", "loc-mirewood-ashfall"],
      properties: { danger: "low", offerings_present: true, day_safe: true },
    },
    {
      id: "loc-mirewood-ashfall",
      name: "Ashfall Village",
      description:
        "A village of perhaps two hundred souls who have made their peace with living next to something that does not sleep. The houses are solid, practical, hung with bundles of rowan and iron. The villagers are not superstitious — they are precise. They know which bargains hold and which ones fray. The inn is called The Steady Lantern. It is always lit.",
      shortDesc: "A small, careful village that survives by keeping its promises",
      ambientSound: "city_night",
      connectedTo: ["loc-mirewood-threshold"],
      properties: { danger: "none", rest_available: true, information_hub: true },
    },
    {
      id: "loc-mirewood-hollow-road",
      name: "The Hollow Road",
      description:
        "A path wide enough for two people, packed earth worn smooth by centuries of careful feet. By day it runs more or less straight. By night it has other opinions. The trees here are taller than they should be, their canopies meeting overhead in a cathedral arch. Light filters through green and gold. Something tracks you from the shadows — not maliciously, not yet. Just watching to see what kind of story you intend to be.",
      shortDesc: "A path that only stays still during daylight hours",
      ambientSound: "forest_night",
      connectedTo: [
        "loc-mirewood-threshold",
        "loc-mirewood-glass-pool",
      ],
      properties: { danger: "medium_night", shifts_at_dark: true },
    },
    {
      id: "loc-mirewood-glass-pool",
      name: "The Glass Pool",
      description:
        "A clearing opens around a pool so still it looks solid. The water is dark and cold and perfectly clear to its unknowable depth. If you look into it, you will see something — a memory, a wish, a fear you had forgotten you were carrying. The Woodwarden sometimes sits on the far bank, watching the surface with the patient attention of something that has been watching a long time.",
      shortDesc: "A still pool that reflects memories instead of faces",
      ambientSound: "cave",
      connectedTo: ["loc-mirewood-hollow-road"],
      properties: { danger: "low", reveals_truths: true, woodwarden_location: true },
    },
  ],
  npcs: [
    {
      id: "npc-woodwarden",
      name: "The Woodwarden",
      role: "Ancient forest keeper",
      personality:
        "Ageless, serene, speaks only in questions because it believes answers belong to the asker. Never lies, never flatters. Has watched this wood for longer than the village has existed. Not unkind — just vast.",
      voiceDescription: "slow, resonant, like wind through deep roots",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-mirewood-glass-pool",
    },
    {
      id: "npc-brindle",
      name: "Brindle",
      role: "Ancient lost child",
      personality:
        "Cheerful and practical and three hundred years old, though she doesn't feel it. Knows every path, every story, every shortcut. Genuinely likes people, which is why she tries to warn them before the wood claims them. Doesn't understand why this upsets people.",
      voiceDescription: "bright and quick, accent from a dialect no longer spoken",
      relationship: "friendly",
      isAlive: true,
      locationId: "loc-mirewood-hollow-road",
    },
    {
      id: "npc-collector",
      name: "The Collector",
      role: "Story trader",
      personality:
        "Smooth, gracious, genuinely interested in you. Trades in living stories — not books, the actual breathing narratives that walk these woods. Always has what you need. The price is always something you won't miss until much later.",
      voiceDescription: "warm, precise, the voice of someone who has made many deals",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-mirewood-hollow-road",
    },
    {
      id: "npc-orin",
      name: "Sister Orin",
      role: "Village healer",
      personality:
        "Pragmatic and kind. Has worked the forest edge for thirty years and is still alive, which means she is very good at what she does. Knows more about the wood than she volunteers. Helps people who seem sensible. Has a private list of those who didn't.",
      voiceDescription: "calm, measured, used to delivering difficult news gently",
      relationship: "friendly",
      isAlive: true,
      locationId: "loc-mirewood-threshold",
    },
  ],
};
