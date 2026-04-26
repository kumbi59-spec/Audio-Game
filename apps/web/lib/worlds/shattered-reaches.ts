import type { WorldData } from "@/types/world";

export const SHATTERED_REACHES: WorldData = {
  id: "prebuilt-shattered-reaches",
  name: "The Shattered Reaches",
  description:
    "A dark fantasy world where an ancient cataclysm shattered the continent into floating islands. Magic is wild and unstable. Survivors cling to crumbling city-states while monsters haunt the rifts below.",
  genre: "dark-fantasy",
  tone: "serious",
  systemPrompt: `WORLD: THE SHATTERED REACHES

Setting: A continent shattered by the Sundering — an ancient magical catastrophe — leaving floating islands connected by rope bridges, crumbling sky-ports, and daring airship routes. Below is the Rift: an endless, fog-filled abyss haunted by creatures born of wild magic.

Tone: Dark, atmospheric, morally complex. Hope exists but is hard-won. Not grimdark nihilism — acts of courage and kindness matter.

Key Locations:
- Thornhaven: A corrupt port city built into a massive sea cliff. The city guard is in the pocket of the Syndicate crime guild. The docks smell of salt, fish, and desperation.
- The Aetherian Archive: A floating library that drifts on wind currents, accessible only by invitation. Ancient knowledge is hoarded here.
- The Ironwood: A dense forest on the largest island, home to the feral Thornkin tribes who distrust outsiders but trade fairly.
- The Rift Below: The fog-filled abyss. Strange lights pulse in the depths. Things that fell in during the Sundering still move down there.

Key NPCs:
- Aldric Vane (id: npc-aldric): Corrupt captain of the Thornhaven City Watch. Gruff, calculating, takes bribes openly. Hostile to adventurers threatening his operation.
- Petra Coldwater (id: npc-petra): A dockworker and secret member of the Resistance. Warm, practical, fiercely loyal. Will help the player if they prove trustworthy.
- The Archivist (id: npc-archivist): A centuries-old scholar of unknown species. Cryptic, formal, speaks in careful riddles. Knows everything, shares little without trade.
- Mira Thane (id: npc-mira): A Rift-diver — someone who descends into the abyss for salvage. Reckless, cheerful, hiding deep grief. Could be ally or rival.

Factions:
- The Syndicate: Crime guild controlling Thornhaven trade. Brutal, organized, ambitious.
- The Resistance: Underground movement fighting Syndicate corruption. Small, desperate, morally grey.
- The Thornkin: Island tribes. Isolationist. Attack first if threatened. Trade if approached peacefully.
- The Conclave of Dust: Scholars convinced the Sundering was deliberate. Seek to repeat it "correctly." Dangerous fanatics.

Rules Notes:
- Magic is unstable in the Reaches. Spells may have unexpected side effects in the Rift.
- Violence always has social consequences — witnesses remember, guards respond, reputations spread.
- The player can negotiate, intimidate, deceive, or charm almost any NPC instead of fighting.
- Death is possible but should feel earned, not cheap. Warn the player when stakes are lethal.

Opening Scenario:
The player has just arrived in Thornhaven on a leaky merchant vessel, penniless but free. They witnessed something they shouldn't have on the docks — a Syndicate execution disguised as an accident. Now they have a choice: stay quiet and survive, or get involved.

Sound Design:
- Thornhaven Docks: ocean ambient
- The Ironwood: forest_day or forest_night ambient
- Underground locations: cave or dungeon ambient
- Syndicate lair: city_night ambient`,
  isPrebuilt: true,
  imageUrl: null,
  locations: [
    {
      id: "loc-thornhaven-docks",
      name: "Thornhaven Docks",
      description:
        "The docks are a maze of rotting timber piers and salt-crusted rope. Fog rolls in off the Rift below, carrying the tang of ozone and something older — magic gone sour. Sailors curse in a dozen languages. Somewhere in the distance, a bell tolls the watch change. The city rises up the cliffside above you in tiers, each one crumbling a little more than the last.",
      shortDesc: "The fog-shrouded docks at the base of Thornhaven's sea cliff",
      ambientSound: "ocean",
      connectedTo: ["loc-thornhaven-market", "loc-thornhaven-guard-post"],
      properties: { danger: "medium", syndicate_presence: true },
    },
    {
      id: "loc-thornhaven-market",
      name: "Thornhaven Market",
      description:
        "The market is a clamour of voices: vendors crying prices, haggling customers, children darting between stalls. The cobblestones are uneven and worn smooth. The smell of roasting meat battles with the stench of unwashed bodies and cheaper perfumes. Syndicate enforcers patrol in pairs, recognizable by their black armbands, collecting 'insurance fees' from each stall.",
      shortDesc: "A loud, crowded market district under Syndicate watch",
      ambientSound: "market",
      connectedTo: ["loc-thornhaven-docks", "loc-thornhaven-tavern"],
      properties: { danger: "low", syndicate_presence: true },
    },
    {
      id: "loc-thornhaven-tavern",
      name: "The Broken Anchor",
      description:
        "A low-ceilinged tavern that smells of tallow candles, spilled ale, and old timber. The common room is half-full at any hour. A fire crackles in a stone hearth. The barkeep, a broad-shouldered woman named Sera, says little and forgets nothing. Rumour has it the Resistance meets in the cellar, but asking about it directly is a good way to end up in the Rift.",
      shortDesc: "A discreet tavern frequented by those who keep their voices low",
      ambientSound: "tavern",
      connectedTo: ["loc-thornhaven-market"],
      properties: { danger: "low", rest_available: true },
    },
    {
      id: "loc-thornhaven-guard-post",
      name: "City Watch Post",
      description:
        "A squat stone building at the base of the cliffside road. The door is always open. Inside, guards play cards or sleep at the duty desk. Their armour is polished but their eyes are dull — the kind of dull that comes from looking the other way for too long. Captain Aldric Vane's name is on every signed order pinned to the wall.",
      shortDesc: "The Watch Post, officially maintaining order for the Syndicate",
      ambientSound: "city_night",
      connectedTo: ["loc-thornhaven-docks"],
      properties: { danger: "high_if_hostile", aldric_base: true },
    },
  ],
  npcs: [
    {
      id: "npc-aldric",
      name: "Captain Aldric Vane",
      role: "Corrupt Watch Captain",
      personality:
        "Calculating, pragmatic, and openly corrupt. He's not cruel for sport — cruelty is just good business. Will negotiate if the player has something he wants. Responds to threats with disproportionate force.",
      voiceDescription: "deep, slow, deliberate — like a man who has never been in a hurry",
      relationship: "hostile",
      isAlive: true,
      locationId: "loc-thornhaven-guard-post",
    },
    {
      id: "npc-petra",
      name: "Petra Coldwater",
      role: "Resistance Member (secret)",
      personality:
        "Warm but guarded. Has seen too many allies get caught. Tests the player's trustworthiness before revealing anything. Practical to a fault — won't risk lives for glory.",
      voiceDescription:
        "quick, working-class accent, drops the ends of words when stressed",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-thornhaven-docks",
    },
    {
      id: "npc-mira",
      name: "Mira Thane",
      role: "Rift Diver",
      personality:
        "Cheerful exterior hiding genuine grief over a lost partner in the Rift. Reckless but technically skilled. Offers services to interesting parties. May rival or ally with the player.",
      voiceDescription: "bright, fast-talking, breaks into dark humour when nervous",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-thornhaven-docks",
    },
  ],
};

import { MIREWOOD } from "./mirewood";
import { VERDANT_WILDS } from "./verdant-wilds";
import { IRON_CITADEL } from "./iron-citadel";
import { CRIMSON_SANDS } from "./crimson-sands";

export const PREBUILT_WORLDS: WorldData[] = [
  SHATTERED_REACHES,
  MIREWOOD,
  VERDANT_WILDS,
  IRON_CITADEL,
  CRIMSON_SANDS,
];
