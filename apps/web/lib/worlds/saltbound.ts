import type { WorldData } from "@/types/world";

export const SALTBOUND: WorldData = {
  id: "prebuilt-saltbound",
  name: "Saltbound",
  description:
    "Age-of-sail piracy in the Stradovine Archipelago. The player has just been elected captain of the brigantine Mercy by a crew of forty-eight after the previous captain's accident. The crew expects a course; the navigator is missing; the Crown's frigate Argent has been sighted three islands east.",
  genre: "adventure",
  tone: "swashbuckling",
  systemPrompt: `WORLD: SALTBOUND

Setting: The Stradovine Archipelago — an island chain in a warm sea ruled jointly by the Crown of Vallaria (formal navy, customs cutters, the frigate Argent) and the loose Confederacy of Free Captains (pirates by Crown definition, free traders by their own). The player has just been elected captain of the brigantine Mercy by acclamation. Two-masted, sixty meters, eighteen guns, forty-eight crew. Provisioned for three weeks. Currently anchored in a hidden cove on Salt-Tongue Island.

Tone: Swashbuckling, fast, generous. The crew is loyal but loud. Decisions have weather, wind, and consequence. The Crown is a real threat but not omnipresent. There is genuine warmth in the Confederacy that doesn't pretend not to be a kind of family.

Key Locations:
- The Mercy's Quarterdeck: Polished oak, the binnacle compass, a brass speaking trumpet on a peg. The first mate, Joss Wren, runs the deck. The crew watches the new captain — the player — to see what kind of captain they're going to be.
- Salt-Tongue Cove: A horseshoe of tall basalt cliffs hiding the Mercy from any seaward view. A driftwood landing, a path up to the village, freshwater spring at the back of the cove. Two other ships at anchor: the Petrel (Captain Nox) and the Sister Annika (Captain Brenne).
- Salt-Tongue Village: A free port — Crown writ does not run here, by old treaty. Tavern, chandler, sailmaker, hedge-witch, a Crown deserter who makes excellent rum. The harbour master takes a tithe in goods, not in cred.
- The Bone Reef: A reef chain three islands east, named for the wrecks. The navigator, Hanno Ash, was seen heading there on a chart-trip a week ago. He has not returned. The reef tides shift quickly.
- The Crown Frigate Argent: A first-rate frigate, thirty-six guns. Captain: Lord Caspar Veil, decorated, ambitious, hates pirates philosophically. Currently three islands east. Has been seen by the Petrel's lookouts twice in two days.

Key NPCs:
- First Mate Joss Wren (id: npc-joss): Forties, thirty years at sea, the calm at the center of the deck. Trusts the player because the crew elected the player. Will tell the truth about what the crew thinks before the crew tells it themselves.
- Bosun Marra Quint (id: npc-quint): Thirties, sharp-tongued, runs the rigging crews. Disliked the previous captain. Watching the new captain narrowly. Respect must be earned, but she'll respect bravery and competence in equal measure.
- Cook Old Ben (id: npc-ben): Sixties, mostly deaf, makes an extraordinary fish stew, knows every story in the archipelago. The crew brings him their gossip. He will share what he hears if the player drinks his coffee.
- Captain Adrek Nox (id: npc-nox): Captain of the Petrel. Confederacy ally and possible rival. Charming, irreverent, sentimental. Owes the player's previous captain a favor he is willing to extend.
- Captain Lord Caspar Veil (id: npc-veil): Captain of the Argent. Crown officer, principled in a way that makes him dangerous. Will accept surrender. Will not accept lies.
- Hanno Ash (id: npc-hanno): The Mercy's missing navigator. Quiet, methodical, keeps a private cipher in his charts. Was researching something at the Bone Reef. May still be alive.

Factions:
- The Crown of Vallaria: Formal navy + customs. Will pursue the Mercy with reasonable force if directly provoked. Will not waste a frigate on a single brigantine unless explicitly ordered.
- The Confederacy of Free Captains: Loose mutual-aid pact. Captains owe each other small favors. The favor economy is real and tracked verbally.
- The Hedge-Witches of Salt-Tongue: Three women in a stone cottage who sell remedies and weather warnings. Older than the village. Take payment in fresh fish, not coin.
- The Stradovine Free Towns: Independent islands paying nominal tithe to the Crown but governing themselves. Useful resupply points; hostile to pirates who burn their own.

Rules Notes:
- Wind and weather are real and consequential. The GM should narrate sea conditions and the crew's response. Sailing into a squall is a decision.
- The crew has agency. The player gives orders and trusts the crew to execute. Joss, Marra, and Ben should have voices in major decisions.
- Combat at sea is gun-and-board. Decisive action is rewarded. Drawn-out fights cost crew, sails, and reputation. Most engagements end in chase or surrender, not slaughter.
- Reputation matters. What the player does in Salt-Tongue this week becomes a song in the next port within a fortnight.
- The Confederacy operates by oath and favor, not contract. The player should expect to be asked to honor obligations the previous captain accepted on behalf of the Mercy.

Opening Scenario:
The crew has just finished the election. The deck is loud with cheers. Joss Wren steps forward with the captain's hat — a battered tricorne that fit the previous captain badly and will fit the player no better — and offers it. The crew falls expectantly silent. Three things press on the new captain immediately: the navigator Hanno Ash is a week overdue from the Bone Reef; Captain Nox of the Petrel has rowed over and is waiting in the captain's cabin to talk; the Argent has been sighted three islands east, and someone needs to decide whether the Mercy is sailing west or going to find Hanno.

Sound Design:
- The Mercy's Deck: ocean ambient
- Salt-Tongue Cove: ocean (with wind in cliffs) ambient
- The Village: tavern ambient
- The Bone Reef: ocean (with surf-break) ambient
- Below decks: cave (very damp) ambient`,
  isPrebuilt: true,
  imageUrl: "/images/worlds/saltbound.svg",
  locations: [
    {
      id: "loc-mercy-deck",
      name: "The Mercy's Quarterdeck",
      description:
        "Polished oak under the player's boots. The binnacle compass swings gently in its housing. A brass speaking trumpet hangs on a peg. The mainmast rises behind. Forty-eight crew below decks and on the rigging, currently watching the new captain. Joss Wren stands at the player's left shoulder, hat in hand. The wind is light from the southwest.",
      shortDesc: "The Mercy's quarterdeck, where the captain commands",
      ambientSound: "ocean",
      connectedTo: ["loc-salt-tongue-cove", "loc-mercy-cabin"],
      properties: { danger: "none", wind: "light_sw", crew_count: 48 },
    },
    {
      id: "loc-mercy-cabin",
      name: "The Captain's Cabin",
      description:
        "A low-ceilinged stern cabin with a leaded transom window letting in green sea-light. Charts pinned to the bulkhead. The previous captain's logbook open on the desk. A chest with the captain's share of the last prize, locked. Captain Adrek Nox of the Petrel is sitting in the player's chair drinking the player's brandy and smiling.",
      shortDesc: "The captain's stern cabin where Nox is waiting",
      ambientSound: "cave",
      connectedTo: ["loc-mercy-deck"],
      properties: { danger: "low", nox_present: true },
    },
    {
      id: "loc-salt-tongue-cove",
      name: "Salt-Tongue Cove",
      description:
        "A horseshoe of tall black basalt cliffs hiding the Mercy and two other ships from any seaward view. The water is glass-calm and impossibly clear. A driftwood landing leads up a narrow path to the village. A freshwater spring drips at the back of the cove. The Petrel and the Sister Annika are at anchor, their crews on shore.",
      shortDesc: "The hidden cove sheltering the Mercy from seaward eyes",
      ambientSound: "ocean",
      connectedTo: ["loc-mercy-deck", "loc-salt-tongue-village"],
      properties: { danger: "none", hidden: true },
    },
    {
      id: "loc-salt-tongue-village",
      name: "Salt-Tongue Village",
      description:
        "A free port of about three hundred souls. A long tavern with the door always open. A chandler, a sailmaker, the hedge-witches' stone cottage, and a small open square where everyone trades news. The harbour master, Old Mette, takes her tithe in goods rather than coin. The smell of salt, frying fish, and rum.",
      shortDesc: "A free port outside the Crown's writ",
      ambientSound: "tavern",
      connectedTo: ["loc-salt-tongue-cove"],
      properties: { danger: "low", crown_jurisdiction: false, rest_available: true },
    },
    {
      id: "loc-bone-reef",
      name: "The Bone Reef",
      description:
        "A reef chain three islands east, named for the wrecks visible at low tide. The water above the reef is an unnatural pale blue. Currents shift fast. The navigator Hanno Ash was last seen heading here a week ago. The Argent has been sighted in this water twice in two days.",
      shortDesc: "A treacherous reef where Hanno was last seen and the Argent is patrolling",
      ambientSound: "ocean",
      connectedTo: [],
      properties: { danger: "high", argent_patrol: true, hanno_last_seen: true },
    },
  ],
  npcs: [
    {
      id: "npc-joss",
      name: "First Mate Joss Wren",
      role: "First Mate of the Mercy",
      personality:
        "Calm, observant, completely loyal to the ship and to whoever the crew elects. Will give the player honest advice when asked, in private, in plain words. Will execute orders publicly without flinching.",
      voiceDescription: "low, weathered, slow West-Vallarian accent",
      relationship: "allied",
      isAlive: true,
      locationId: "loc-mercy-deck",
    },
    {
      id: "npc-quint",
      name: "Bosun Marra Quint",
      role: "Bosun",
      personality:
        "Sharp-tongued, observant, fearless on the rigging. Disliked the previous captain. Watching the player narrowly. Respects bravery and competence; despises hesitation.",
      voiceDescription: "fast, salty, drops her g's, never wastes a syllable",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-mercy-deck",
    },
    {
      id: "npc-ben",
      name: "Cook Old Ben",
      role: "Ship's Cook",
      personality:
        "Mostly deaf, makes superb stew, knows every story. The crew bring him their gossip. He shares it for the price of his own coffee being drunk at his table.",
      voiceDescription: "creaky, warm, often laughs at his own jokes",
      relationship: "friendly",
      isAlive: true,
      locationId: "loc-mercy-deck",
    },
    {
      id: "npc-nox",
      name: "Captain Adrek Nox",
      role: "Captain of the Petrel",
      personality:
        "Charming, irreverent, sentimental about old debts. Will help the player. Will also remember the help and call it back later, with interest, in a way that turns out to be fair.",
      voiceDescription: "warm tenor, theatrical, slight Eastern Stradovine lilt",
      relationship: "friendly",
      isAlive: true,
      locationId: "loc-mercy-cabin",
    },
    {
      id: "npc-veil",
      name: "Captain Lord Caspar Veil",
      role: "Captain of the Argent",
      personality:
        "Principled, courteous, dangerous. Will offer terms before firing. Will not negotiate after lies. Believes piracy is a problem of order, not morality.",
      voiceDescription: "clipped, formal, perfect Vallarian Crown diction",
      relationship: "hostile",
      isAlive: true,
      locationId: null,
    },
    {
      id: "npc-hanno",
      name: "Hanno Ash",
      role: "Missing Navigator",
      personality:
        "Quiet, methodical, keeps a private cipher in his charts. Was researching something at the Bone Reef. Whether he is alive depends on the player's choices in the first three days.",
      voiceDescription: "soft, precise, takes a long time to answer",
      relationship: "allied",
      isAlive: true,
      locationId: null,
    },
  ],
};
