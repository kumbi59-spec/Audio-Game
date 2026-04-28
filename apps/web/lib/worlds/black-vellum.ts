import type { WorldData } from "@/types/world";

export const BLACK_VELLUM: WorldData = {
  id: "prebuilt-black-vellum",
  name: "The Black Vellum",
  description:
    "A modern-day cosmic horror investigation. The player is a freelance archivist hired by an estate to catalogue an inherited library. The library contains a single book it should not contain. Six weeks ago, three other archivists tried to catalogue it. None of them are reachable now.",
  genre: "horror",
  tone: "dread",
  systemPrompt: `WORLD: THE BLACK VELLUM

Setting: Present-day Pacific Northwest. The estate of the late Dr. Allard Korst, an antiquarian who died in his sleep three months ago at age ninety-one. Korst's heirs want his library catalogued before sale. The library is in a wing of the manor at the end of a long gravel drive on the north Olympic Peninsula. There is mobile reception only in the front parlor and only during certain hours.

Tone: Slow-build cosmic horror. Real-world plausibility. The horror is in implication and accumulation, not gore. The player is a competent professional doing their job. The book is the threat. The book wants to be read.

Key Locations:
- The Front Parlor: Wood-paneled, warm, reception bars sometimes flicker into existence here. The estate's caretaker, Mrs. Halvorsen, takes her tea here at four. Korst's portrait hangs above the fireplace; he looks neither welcoming nor unwelcoming.
- The Korst Library: A long room with twenty-foot ceilings, oak shelves on three sides, a leaded-glass window onto the back gardens. Approximately 14,000 volumes. The catalogue Korst kept by hand is in a green leather binder on the central reading table. The book is in a glass case on a side table by the window. The case key is in Mrs. Halvorsen's possession.
- The Grounds: Rain-soaked, wooded, steep paths down to a small private cove. Crows. A maintained Japanese garden in the south corner. A guesthouse where the player has been put up for the duration of the contract.
- The Reading Room (upstairs): Korst's private study. Smaller, warmer, a single window onto a stand of cedars. His unfinished annotations on the book are on the desk under a glass paperweight. The annotations stop mid-sentence on a page dated three weeks before his death.
- The Cove: A pebble beach at the foot of the cliff path. Tidepools. Driftwood. At low tide, an old fishing weir is visible — the wood is impossibly old and arranged in a geometry that makes it hard to count the stakes.

Key NPCs:
- Mrs. Greta Halvorsen (id: npc-halvorsen): The caretaker. Sixty, unflappable, served Korst for forty years. Knows what was happening but has decided that whatever the player wants to know, the player should ask plainly.
- Marius Korst (id: npc-marius): The doctor's grandnephew and executor. Thirties, tired, businesslike. Doesn't believe any of "what Allard was into" but also doesn't quite want to be in the library after dark.
- Dr. Anneli Seto (id: npc-seto): A folklorist at the University of Washington who has read the book — once, twenty years ago, briefly. She left academia for two years afterward. Will speak to the player by phone if reception holds.
- The Three (id: npc-the-three): Eira Vance, Jules Park, Tomas Riedel — the previous archivists. The player has their published professional records and their last emails to the estate. Each email's tone deteriorates over the six weeks they worked. None of them came in for a fourth week.
- The Book (id: npc-book): Not a person. The GM should treat the book as an entity with intentions but no voice. It is patient. It does not need to be opened to act on the world. It very much wants to be opened.

Factions:
- The Korst Estate: Wants the library catalogued and sold. Will pay the player promptly. Will not ask too many questions.
- The Society for the Study of Anomalous Marginalia: A small, secretive correspondence circle Dr. Seto used to belong to. Has files on the book and may help — for a price they don't usually name in the first email.

Rules Notes:
- Sanity is not a stat. Costs of investigation are concrete: lost sleep, neglected relationships, things forgotten, a growing reluctance to be in certain rooms. The GM should narrate these.
- The book's content should never be quoted directly. The book's effects on the world should be unmistakable.
- Investigation rewards patience and method. Reckless approaches reveal the book's reach faster — but accelerate consequences.
- The player can decline. Walking away is a real option. The Korsts have other archivists. The book will still be there.
- Keep the supernatural specific. The GM should commit to internal consistency: what the book wants, what it can do, how. The mystery is "what is this thing" not "is anything happening."

Opening Scenario:
The player arrives at the Korst estate at 4:47 PM on a Sunday in late October. The drive is long and wet. Mrs. Halvorsen meets them at the door with tea. She shows the player the guesthouse, then walks them to the library. The catalogue book is open on the central table. The glass case in the corner contains a single black-bound volume. Mrs. Halvorsen does not look at the case. She says: "I'll bring breakfast at eight tomorrow. I lock the back door at ten. The library is yours from now until you finish or leave. Mr. Korst left a letter for whoever took the contract. It's on the desk upstairs."

Sound Design:
- Front Parlor: tavern (use a quiet variant) ambient
- The Library: cave (very quiet) ambient
- The Grounds: forest_day or rain_indoor ambient depending on weather
- The Reading Room: silent_corp ambient
- The Cove: ocean ambient`,
  isPrebuilt: true,
  imageUrl: "/images/worlds/black-vellum.svg",
  locations: [
    {
      id: "loc-front-parlor",
      name: "The Front Parlor",
      description:
        "A long wood-paneled room with a fireplace at one end and tall windows at the other. The furniture is heavy and old. A tea service sits on a low table. Korst's portrait above the fireplace is a stern oil painting of a thin man with very pale eyes. Mobile reception comes and goes here in a way the caretaker has stopped trying to explain.",
      shortDesc: "The estate's wood-paneled front parlor with intermittent mobile reception",
      ambientSound: "tavern",
      connectedTo: ["loc-library", "loc-grounds"],
      properties: { danger: "none", reception: "intermittent" },
    },
    {
      id: "loc-library",
      name: "The Korst Library",
      description:
        "A long room with twenty-foot ceilings and a vaulted oak ceiling. Three walls of shelving. Approximately fourteen thousand volumes, organized by an idiosyncratic system Korst maintained by hand in the green leather binder on the central reading table. A leaded-glass window faces the back gardens. In a glass case on a side table by the window: a single black-bound book without a title on its spine. The light in the room is steady. Outside the window, the cedars move in wind that doesn't quite seem to reach the panes.",
      shortDesc: "Korst's vast personal library, with the book in a locked glass case",
      ambientSound: "cave",
      connectedTo: ["loc-front-parlor", "loc-reading-room"],
      properties: { danger: "growing", book_present: true, case_locked: true },
    },
    {
      id: "loc-reading-room",
      name: "Korst's Reading Room",
      description:
        "A small upstairs study. One window onto a stand of cedars. A leather chair with a worn arm. A walnut desk with Korst's unfinished notes spread across it under a glass paperweight. The notes are precise, scholarly, and stop mid-sentence on a page dated three weeks before his death. There is no apparent disturbance. Korst seems to have set down his pen and never picked it up again.",
      shortDesc: "Korst's private upstairs study with his unfinished annotations",
      ambientSound: "silent_corp",
      connectedTo: ["loc-library"],
      properties: { danger: "low", korst_notes: true },
    },
    {
      id: "loc-grounds",
      name: "The Estate Grounds",
      description:
        "Wooded paths in damp earth, raked Japanese gravel in the south corner, a guesthouse near the drive where the player's bag is unpacked. A path winds down to the cove between rhododendrons. Crows in the tops of the cedars. The rain is steady and cold and quiet.",
      shortDesc: "The estate grounds: a wooded path to the cove and the guesthouse",
      ambientSound: "forest_day",
      connectedTo: ["loc-front-parlor", "loc-cove"],
      properties: { danger: "low", weather: "rain" },
    },
    {
      id: "loc-cove",
      name: "The Cove",
      description:
        "A small pebble beach at the foot of the cliff path. Driftwood. Tidepools full of small green crabs. At low tide, the remains of an old fishing weir are visible: black wooden stakes in the silt, arranged in a curve that doesn't quite resolve when you try to count them. The locals do not fish here. Mrs. Halvorsen suggested casually, on the way in, that the player not swim.",
      shortDesc: "A private cove below the estate with an unsettling tidal weir",
      ambientSound: "ocean",
      connectedTo: ["loc-grounds"],
      properties: { danger: "tide_dependent", weir_visible_at_low_tide: true },
    },
  ],
  npcs: [
    {
      id: "npc-halvorsen",
      name: "Mrs. Greta Halvorsen",
      role: "Estate Caretaker",
      personality:
        "Unflappable, observant, helpful in a measured way. Will answer any direct question honestly. Volunteers nothing. Has worked here forty years and intends to remain.",
      voiceDescription: "warm, slow, faint Norwegian inflection",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-front-parlor",
    },
    {
      id: "npc-marius",
      name: "Marius Korst",
      role: "Estate Executor",
      personality:
        "Tired, businesslike, skeptical of his great-uncle's interests but not contemptuous. Wants the catalogue done and the property sold. Will support the player professionally. Won't stay overnight.",
      voiceDescription: "clipped, well-spoken, faintly impatient",
      relationship: "friendly",
      isAlive: true,
      locationId: null,
    },
    {
      id: "npc-seto",
      name: "Dr. Anneli Seto",
      role: "Folklorist (UW)",
      personality:
        "Cautious, exact, hard to spook because she has been spooked already. Will speak with the player by phone if reception holds. Speaks in careful, qualified sentences and refuses to repeat anything she calls 'incantatory.'",
      voiceDescription: "academic, careful, soft alto",
      relationship: "neutral",
      isAlive: true,
      locationId: null,
    },
    {
      id: "npc-the-three",
      name: "The Three (Vance, Park, Riedel)",
      role: "Previous Archivists",
      personality:
        "Three professional archivists who attempted this contract before the player. Their published records and final emails are available. They are not, currently, available to consult. The player can deduce a great deal from how their tone changed over six weeks of work.",
      voiceDescription: "encountered through documents only, unless the player searches",
      relationship: "neutral",
      isAlive: true,
      locationId: null,
    },
    {
      id: "npc-book",
      name: "The Black Vellum",
      role: "The Book",
      personality:
        "Not a person. The GM treats it as a patient, intentional presence. It does not need to be opened to act on the world. It exerts influence through suggestion, dreams, neglected handwriting, and the gradual rearrangement of small things in the player's surroundings.",
      voiceDescription: "no voice — communicates by effect, never by speech",
      relationship: "hostile",
      isAlive: true,
      locationId: "loc-library",
    },
  ],
};
