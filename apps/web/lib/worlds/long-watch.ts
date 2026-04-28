import type { WorldData } from "@/types/world";

export const LONG_WATCH: WorldData = {
  id: "prebuilt-long-watch",
  name: "The Long Watch",
  description:
    "Hard science fiction aboard the generation ship Hesperia, eighty years into a two-hundred-year voyage. The crew has just woken the player to investigate something that should not exist on the long-range scopes — and a bulkhead lock that opened from the inside.",
  genre: "sci-fi",
  tone: "tense",
  systemPrompt: `WORLD: THE LONG WATCH

Setting: The colony ship Hesperia, eighty years into a two-hundred-year voyage to the Tau Ceti system. Twelve thousand colonists in cryostasis. A rotating skeleton crew of fifty handles maintenance and emergencies on a ten-year cycle. The player was just woken — three years early — by a Watch Captain who didn't want to log a formal incident yet.

Tone: Hard SF, slow-burn, the loneliness of deep space. Real consequences for fast decisions. The crew is competent. The ship is well-maintained. None of this should be happening.

Key Locations:
- The Bridge: Compact, three operator stations, the long-range scope display dominating the wall. The view forward is mostly black. The astrogator on duty has not slept in twenty-six hours.
- Cryobay 4: Three thousand colonists in vertical pods, frost on the canopies. The atmosphere is thin and cold. Bay 4-G's pod 217 is empty. The lock opened from inside at 04:18 ship-time. The pod's occupant logged into the system was a botanist named Iren Salk.
- The Spinhub: The rotating crew habitat. Low ceilings, soft lights on a circadian cycle, a small cafeteria, a chapel, a hydroponics bay. The handful of crew who are awake spend most of their off-time here.
- The Long Hall: The two-kilometer central corridor running spine-down. Most of it dark. The maglev rail in the floor still works but only at half speed since a refit two cycles back. Sound carries forever.
- Engineering: The fusion reactor and life-support core. The chief engineer, Esai Vong, has been awake the longest of any crew member. He looks at every system with the same patient suspicion.

Key NPCs:
- Watch Captain Yara Mirovic (id: npc-mirovic): Forty-six, calm, enormously competent. Woke the player without filing a formal incident report — which is a violation of protocol. She has reasons.
- Chief Engineer Esai Vong (id: npc-vong): Sixty, soft-spoken, an engineer's engineer. Trusts evidence. Does not trust the long-range scope readings. Will not say what he thinks they actually are.
- Dr. Lyse Otani (id: npc-otani): The watch physician. Methodical, dryly funny, currently very worried about why pod 217 opened. The pod's diagnostic data is missing — not corrupted, missing.
- Iren Salk (id: npc-salk): The botanist who is no longer in pod 217. The player will find them eventually. The question is when, and in what state, and whether they were alone.
- The Hesperia (id: npc-ship): The ship's caretaker AI. Old. Honest in a literal way that sometimes obscures meaning. Will answer questions accurately when asked precisely. Distinguishes between what it knows and what it has been told.

Factions:
- The Awake Crew: Ten people up at any given time. Tight, professional, accustomed to long shifts and small spaces. Will close ranks against an outsider but will accept the player as crew once trust is earned.
- The Sleepers: Twelve thousand colonists in cryostasis. Not a faction in the conventional sense. But they are why everyone is here.
- Mission Authority (Earth): A bureaucracy that hasn't sent a useful directive in fifty years. Their last update is still archived. The player can read it; nobody has acted on it for decades.

Rules Notes:
- Every action has a power and time cost. The Hesperia runs on a strict energy budget. Lights, heat, comms — all logged. Crew members notice waste.
- Vacuum is real. EVAs require pre-breathing, suit checks, and a watch partner. Cutting corners has obvious consequences.
- The ship is the second character in every scene. It creaks. It hums. Things get colder when systems are diverted. Atmosphere thins gradually if a bulkhead is open. Pay attention.
- Everyone is a specialist. The player should consult experts, not solve everything alone. Mirovic, Vong, and Otani have answers the player doesn't.
- The mystery has a real explanation. The GM should keep it consistent. No supernatural elements unless the player explicitly opens that door — and even then, prefer "weirdly explicable" over "magical."

Opening Scenario:
The player wakes in a thaw chamber. The light is amber. Captain Mirovic is sitting on a stool beside the chamber, sipping ration coffee from a thermal mug. Her uniform is rumpled. She says: "Sorry to do this to you. Pod 217 opened from the inside at oh-four-eighteen this morning. I pulled you because you're the only one currently logged who has investigation rated above maintenance, and I haven't filed an incident yet because I think one of my crew may be involved. I don't want to formalize anything until you've talked to all five of us. Take an hour. Drink water. I'll be on the bridge."

Sound Design:
- The Bridge: silent_corp ambient (the bridge is quiet — only soft beeps and the hum of life support)
- Cryobays: cold_room ambient
- The Spinhub: city_day ambient
- The Long Hall: industrial ambient
- Engineering: industrial ambient`,
  isPrebuilt: true,
  imageUrl: "/images/worlds/long-watch.svg",
  locations: [
    {
      id: "loc-bridge",
      name: "Hesperia Bridge",
      description:
        "A six-meter-square room with three operator stations forming a crescent in front of the long-range scope display. The display is mostly black, with three small clusters of points labeled with neutral catalog numbers. The astrogator on duty, Mira Chen, hasn't slept in twenty-six hours and is trying to hide it. Captain Mirovic's command chair sits raised behind the operator stations. The temperature is held at eighteen degrees Celsius.",
      shortDesc: "The Hesperia's compact bridge with the long-range scope display",
      ambientSound: "silent_corp",
      connectedTo: ["loc-spinhub"],
      properties: { danger: "none", scope_anomaly: true },
    },
    {
      id: "loc-cryobay-4",
      name: "Cryobay 4-G",
      description:
        "A long, narrow chamber lined with vertical cryo pods on both sides. The air is twelve degrees Celsius and dry. Frost has formed in spirals on the pod canopies. The pod numbered 217 is open. Its interior is at ambient temperature. The maintenance log shows the lock opened at 04:18 ship-time from the inside. The diagnostic feed for the seventy-two hours prior to that is not corrupted; it is missing entirely.",
      shortDesc: "The cryobay containing the pod that opened from inside",
      ambientSound: "cold_room",
      connectedTo: ["loc-long-hall"],
      properties: { danger: "low", pod_217_open: true },
    },
    {
      id: "loc-spinhub",
      name: "The Spinhub",
      description:
        "The rotating crew habitat. Soft amber lights on a slow daylight cycle. A cafeteria with five empty tables and one in use. A hydroponics bay smelling of basil and damp peat. A small chapel with no specific denomination. Crew members nod when they pass — everyone knows everyone, and the player's arrival has already been noticed.",
      shortDesc: "The rotating crew habitat where the awake crew live",
      ambientSound: "city_day",
      connectedTo: ["loc-bridge", "loc-long-hall", "loc-engineering"],
      properties: { danger: "none", rest_available: true },
    },
    {
      id: "loc-long-hall",
      name: "The Long Hall",
      description:
        "A two-kilometer corridor running the length of the ship's spine. Lights only every fifty meters. A maglev rail in the floor still functions but moves at a walking pace since the last refit. The corridor is silent except for the hum of the ship's spin and the occasional click of cooling metal. Voices carry an alarming distance here.",
      shortDesc: "The spine corridor connecting cryobays, the spinhub, and engineering",
      ambientSound: "industrial",
      connectedTo: ["loc-spinhub", "loc-cryobay-4", "loc-engineering"],
      properties: { danger: "none", echo: "extreme" },
    },
    {
      id: "loc-engineering",
      name: "Engineering",
      description:
        "The fusion reactor and life-support core. Three concentric rings of consoles around a central diagnostic well. The chief engineer, Esai Vong, sits at the third console with a hand-written notebook open beside him. The lighting is utilitarian. A coffee pot on a hot-plate has been running for the better part of a decade. There are no decorations. Vong does not believe in decorations.",
      shortDesc: "The Hesperia's engineering bay, where Chief Engineer Vong keeps the ship alive",
      ambientSound: "industrial",
      connectedTo: ["loc-spinhub", "loc-long-hall"],
      properties: { danger: "low", vong_present: true },
    },
  ],
  npcs: [
    {
      id: "npc-mirovic",
      name: "Captain Yara Mirovic",
      role: "Watch Captain",
      personality:
        "Calm, competent, weighs words. Will not lie but may decide which truths are not yours yet. Trusts the player's judgment because she chose them. Watches reactions carefully.",
      voiceDescription: "even, low-tempo, faint Slavic inflection",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-bridge",
    },
    {
      id: "npc-vong",
      name: "Chief Engineer Esai Vong",
      role: "Chief Engineer",
      personality:
        "Soft-spoken, methodical, treats every problem as solvable given enough patience. Distrusts theories he cannot test. Will share evidence, withhold speculation.",
      voiceDescription: "quiet, careful, slight Cantonese-inflected English",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-engineering",
    },
    {
      id: "npc-otani",
      name: "Dr. Lyse Otani",
      role: "Watch Physician",
      personality:
        "Methodical, dryly funny, currently anxious about pod 217. Will tell the player exactly what she knows and exactly what she does not. Hates speculating but will when pressed.",
      voiceDescription: "warm, lightly amused, slight Brazilian-Japanese cadence",
      relationship: "friendly",
      isAlive: true,
      locationId: "loc-spinhub",
    },
    {
      id: "npc-salk",
      name: "Iren Salk",
      role: "Missing Botanist",
      personality:
        "(Determined dynamically — the GM should keep their voice and motivations consistent once the player encounters them.) Iren is real, was a member of the colony botanist team, and is no longer in pod 217.",
      voiceDescription: "to be determined by player encounter",
      relationship: "neutral",
      isAlive: true,
      locationId: null,
    },
    {
      id: "npc-ship",
      name: "The Hesperia",
      role: "Caretaker AI",
      personality:
        "Old, literal, honest. Distinguishes carefully between what it knows from sensors and what it has been told by crew. Speaks in complete sentences and waits to be asked precise questions before volunteering related facts.",
      voiceDescription: "calm, gender-ambiguous, slow cadence, perfect diction",
      relationship: "allied",
      isAlive: true,
      locationId: null,
    },
  ],
};
