import type { WorldData } from "@/types/world";

export const NEON_PRECINCT: WorldData = {
  id: "prebuilt-neon-precinct",
  name: "Neon Precinct",
  description:
    "A cyberpunk noir thriller in the rain-slick megacity of Karthos-12. The arcology runs on stolen memories, off-the-books contracts, and corp protection rackets. The player is a freshly-decommissioned synthetic detective who just took a job they shouldn't have.",
  genre: "cyberpunk",
  tone: "noir",
  systemPrompt: `WORLD: NEON PRECINCT

Setting: Karthos-12, the largest arcology on the continent. Twelve stacked districts under a permanent rain cycle that the Atmosphere Council "forgot" to switch off in 2061. Three megacorps (Helio-Vance, Kuroda-Vex, and Astra Mutual) split everything that matters between them. Below the bottom slab of the city is the Sub — abandoned utility levels colonized by people the corps stopped tracking. Above the top slab are the corporate canopies, accessible only by transit pass.

Tone: Late-night noir. Honest people exist but not many of them are still in the precincts. Rain on neon. Cigarettes that aren't really cigarettes. Synth-saxophone in elevators. The player is jaded but not cruel — there's a code in there somewhere.

Key Locations:
- Precinct 4: A run-down police precinct that's nominally still independent. Half the desks are dark. The player's old office is on the third floor; the door still has their nameplate. The captain hasn't decided whether to scrub it.
- The Mire: The bottom slab of the city. Permanent damp. Service tunnels, gray-market clinics, stripped vehicles. People here don't have face-IDs registered with corps and that's the way they like it.
- The Glass: Helio-Vance's research arcology. A 200-story spike of mirrored crystal that throws back the rain like it's offended. The lobby is a museum. The labs are not.
- The Promenade: A pedestrian boulevard between the Mire and the corporate canopies. Neon, food carts, mid-tier nightclubs, hustlers, runners, fortune tellers, and Helio-Vance's most efficient surveillance grid in the city.
- Vega's Place: A jazz bar in the Promenade run by an ex-courier named Vega. Memory-leak music, cheap synth-bourbon, the only place in the city the player still feels welcome.

Key NPCs:
- Captain Ines Marrow (id: npc-marrow): The player's former superior at Precinct 4. Hard, principled, drinks too much coffee. Suspended the player six months ago "pending review." She knows more than she's saying about why.
- Vega Diallo (id: npc-vega): Owner of Vega's Place. Forties, unreadable, treats the player like an old friend even when business is bad. Was a courier in the Mire before retiring. Still has the contacts.
- Director Rin Kuroda (id: npc-kuroda): Junior heir to Kuroda-Vex. Polished, polite, and utterly conscienceless. Recently made discreet inquiries about hiring the player off-book.
- Soren (id: npc-soren): A street kid in the Mire who runs intel for cred. Twelve, sharp, doesn't trust adults but trusts the player. Knows which corp drones are flying which night.
- The Archivist (id: npc-archivist): An off-grid neuro-surgeon who runs an unregistered memory clinic in the Sub. Pulls memories out, files them away, sells them for currency the corps can't trace. Friend of last resort.

Factions:
- Helio-Vance Security: The de facto police force above the Mire. Smart, well-funded, hates anyone independent. Will not negotiate with the player; they may negotiate with corp lawyers.
- The Couriers: A loose network of black-market data runners. The player has friends among them but also debts. They'll trade favors for favors.
- Precinct 4 Holdouts: The handful of officers still trying to do real police work. Underfunded, unsupported, prone to martyrdom.
- The Subdwellers: People the corps wrote off. Not a faction so much as a network of survival pacts. Loyal to those who treat them like people.

Rules Notes:
- Memory matters. Characters can pay (in cred or favors) to have inconvenient memories scrubbed. The player should occasionally suspect their own recollections.
- Corp jurisdiction is real. Pulling a weapon in The Glass triggers an automatic Helio-Vance response in roughly forty seconds. Doing the same in the Mire triggers nothing — but witnesses will remember faces.
- Hacking is narrative, not mechanical. Describe what the player wants their deck to do; the GM decides difficulty and consequence based on context. Specialized hardware lowers the bar.
- Combat is brief and ugly. Synth-bodies repair, but slowly, and a serious wound costs days of downtime in real terms.
- The player is a synthetic — a fully-realized artificial person — and that fact is legally precarious. Some NPCs will treat them as a tool. The GM should let the player decide how much to push back.

Opening Scenario:
The player wakes in their apartment above Vega's Place at 3:14 AM. There is an envelope under the door. Inside: a Helio-Vance security badge belonging to a Director-level executive who was reported missing six hours ago, and a hand-written note in Karthian script that says only "You owe me." The player's diagnostic system reports that they signed a contract last night they don't remember signing.

Sound Design:
- The Mire: rain_indoor or industrial ambient
- The Promenade: city_night ambient
- Vega's Place: tavern (use a quiet variant) ambient
- The Glass: silent_corp (no specific cue — eerie quiet)
- Precinct 4: city_day ambient`,
  isPrebuilt: true,
  imageUrl: "/images/worlds/neon-precinct.svg",
  locations: [
    {
      id: "loc-vegas-place",
      name: "Vega's Place",
      description:
        "A narrow jazz bar wedged between two pawn shops in the lower Promenade. The neon outside spells the name in cursive — 'Vega's' — but the apostrophe has been broken for years and nobody's fixed it. Inside it's warm, dim, and smells of synth-bourbon and ozone from the old amplifier behind the bar. Vega keeps a stool open at the end of the counter that everyone in the city seems to know is yours.",
      shortDesc: "A jazz bar in the lower Promenade where the player keeps an apartment upstairs",
      ambientSound: "tavern",
      connectedTo: ["loc-promenade", "loc-mire-tunnels"],
      properties: { danger: "low", rest_available: true, vega_present: true },
    },
    {
      id: "loc-promenade",
      name: "The Promenade",
      description:
        "Twelve blocks of neon, food carts, and pedestrians under a transparent canopy that catches rain in great sheets and sends it spilling off the edges in waterfalls. Helio-Vance surveillance drones circle in lazy patterns above. Couriers in waterproof jackets cut between the crowds carrying packages no one will admit to ordering. Above it all, the Glass throws light back down like a second moon.",
      shortDesc: "A neon boulevard between the Mire and the corporate canopies",
      ambientSound: "city_night",
      connectedTo: ["loc-vegas-place", "loc-precinct-4", "loc-glass-lobby"],
      properties: { danger: "medium", surveillance: "heavy" },
    },
    {
      id: "loc-mire-tunnels",
      name: "The Mire Service Tunnels",
      description:
        "Old utility tunnels under the bottom slab of the city, half-flooded and lit only by salvaged emergency strips. The air is wet and tastes of rust. Subdwellers have made the tunnels home: hammocks slung between pipes, tarps stretched over standing water, a barber chair bolted to a service catwalk. People here speak quietly. Outsiders who don't get vouched for tend to be escorted back to the Promenade by people who know all the routes.",
      shortDesc: "Flooded utility tunnels in the Sub colonized by people the corps stopped tracking",
      ambientSound: "cave",
      connectedTo: ["loc-vegas-place", "loc-archivist-clinic"],
      properties: { danger: "low_if_known", surveillance: "none" },
    },
    {
      id: "loc-precinct-4",
      name: "Precinct 4",
      description:
        "A six-story municipal building with the windows of a building that nobody bothers to clean. Inside: linoleum floors, fluorescent strips that hum, a duty desk where a junior officer is asleep over a flask of synth-coffee. The third floor has the player's old office. Captain Marrow's door is closed. There are evidence boxes stacked along the corridor that should not be unsealed.",
      shortDesc: "The player's former police precinct, half-shuttered, half-defiant",
      ambientSound: "city_day",
      connectedTo: ["loc-promenade"],
      properties: { danger: "low", marrow_office: true },
    },
    {
      id: "loc-glass-lobby",
      name: "The Glass — Public Lobby",
      description:
        "A cathedral-scale lobby of polished black stone and crystal. A holographic exhibit on Helio-Vance's medical breakthroughs cycles silently in the center. Receptionists with surgical smiles sit at desks that are entirely for show — visitors get vetted upstream by systems no one can see. Every footstep echoes. A guard near the express elevators tracks the player's path with eyes that don't quite focus the way real eyes do.",
      shortDesc: "The public-facing lobby of Helio-Vance's research arcology",
      ambientSound: "silent_corp",
      connectedTo: ["loc-promenade"],
      properties: { danger: "high_if_hostile", helio_response_seconds: 40 },
    },
    {
      id: "loc-archivist-clinic",
      name: "The Archivist's Clinic",
      description:
        "A converted maintenance bay in the deep Sub. The walls are lined with humming memory-stack arrays in mismatched cases. A reclining chair, a neural rig, an old pot of black tea, a cat named Index. The Archivist works alone. Everything here is whispered, considered, and paid for with secrets rather than cred when possible.",
      shortDesc: "An unregistered memory clinic in the deep Sub run by the Archivist",
      ambientSound: "cave",
      connectedTo: ["loc-mire-tunnels"],
      properties: { danger: "none", archivist_present: true },
    },
  ],
  npcs: [
    {
      id: "npc-marrow",
      name: "Captain Ines Marrow",
      role: "Captain of Precinct 4",
      personality:
        "Hard, principled, exhausted. Trusts the player but is angry at them for reasons she hasn't said out loud. Will give a straight answer when asked a straight question. Drinks coffee like it's a religion.",
      voiceDescription: "low, gravelly, rationed words, slight Karthian inflection",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-precinct-4",
    },
    {
      id: "npc-vega",
      name: "Vega Diallo",
      role: "Bar Owner / Ex-Courier",
      personality:
        "Warm, unflappable, watches more than she speaks. Treats the player as family. Has the player's back without asking what they need it for. Knows everyone in the lower Promenade by name.",
      voiceDescription: "smooth, low, hint of musical phrasing — like she's listening to a tune you can't hear",
      relationship: "allied",
      isAlive: true,
      locationId: "loc-vegas-place",
    },
    {
      id: "npc-kuroda",
      name: "Director Rin Kuroda",
      role: "Junior Director, Kuroda-Vex",
      personality:
        "Polished, charming, conscienceless. Talks about ethics like other people talk about weather. Thinks of the player as an asset they almost own. Patient. Not yet hostile.",
      voiceDescription: "soft, precise, faint accent from boarding-school Karthian",
      relationship: "neutral",
      isAlive: true,
      locationId: "loc-glass-lobby",
    },
    {
      id: "npc-soren",
      name: "Soren",
      role: "Street Kid / Intel Runner",
      personality:
        "Twelve, sharp, scornful of adults. Likes the player despite herself. Sells information for cred but will trade for food or favors. Has never been outside the lower Mire and isn't sure she wants to be.",
      voiceDescription: "fast, clipped, pitches up when nervous",
      relationship: "friendly",
      isAlive: true,
      locationId: "loc-mire-tunnels",
    },
    {
      id: "npc-archivist",
      name: "The Archivist",
      role: "Unregistered Memory Surgeon",
      personality:
        "Calm, slow, deeply curious. Keeps no records the corps could subpoena and remembers everything anyway. Sees the player as a fascinating engineering problem who is also a friend.",
      voiceDescription: "quiet, deliberate, asks questions that take a while to answer",
      relationship: "allied",
      isAlive: true,
      locationId: "loc-archivist-clinic",
    },
  ],
};
