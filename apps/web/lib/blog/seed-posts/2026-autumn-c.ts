import type { ScheduledSeedPost } from "./types";

// Autumn 2026 daily series, part C: 14 Oct – 23 Oct.
export const AUTUMN_2026_C: ScheduledSeedPost[] = [
  {
    publishAt: "2026-10-14",
    title: "Mystery RPGs: How to Solve Cases Without Getting Stuck",
    excerpt: "Love detective RPGs but hate getting stuck? Here's how to search, keep a case file, question suspects and break a stalled mystery with a human or AI GM.",
    content: `# Mystery RPGs: How to Solve Cases Without Getting Stuck

Mystery adventures can be the most satisfying sessions you'll ever play. They can also be the most maddening. When the clues click together, you feel like a genius. When they don't, you lose an hour grilling the wrong butler while the real culprit sits there pouring the tea.

I have a soft spot for this genre. One of EchoQuest's prebuilt worlds is a noir investigation, for a start, and a mystery is a brutally honest test of any Game Master. A fight can paper over sloppy prep. A mystery can't. So this guide covers how to play **mystery and detective RPGs** well: gathering clues, questioning suspects, organising your theories and getting yourself unstuck.

## Why Mystery RPGs Go Wrong

Most failed mysteries break down in one of three ways:

1. **Missed clue:** the key piece of evidence never turned up.
2. **Misread clue:** it turned up, but the player drew a different conclusion.
3. **No next step:** the player has clues and no idea what to do with them.

RPG writer Justin Alexander described the pattern with grim accuracy in his essay on [the Three Clue Rule](https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule): players will "miss the first; ignore the second; and misinterpret the third." Good Game Masters design around these failures. Still, good players can fix all three on their own, and that's what the habits below are for.

## Habit 1: Search With a Purpose

"I search the room" gets you a general answer. Specific searches dig up specific clues:

- "I check the fireplace for burned paper."
- "I look at the victim's hands. Any ink stains, cuts or rings?"
- "I compare the mud on his boots with the garden path."

In AI-run mysteries, specificity pays off especially well, because the Game Master can reason about exactly what you're looking for. On EchoQuest, careful searching usually becomes an intelligence check (the GM's rules file investigation under intelligence), and the GM sets the difficulty from what you actually describe. A vague sweep of the study and a close look at the victim's fingernails are different tasks, so they get treated differently.

There's one more thing here that matters a lot to me, and it's a rule I wrote into the GM myself. If a detail is only noticeable by its colour or shape, it also has to come with a sound or a texture, because plenty of EchoQuest players are blind. A clue nobody can perceive isn't a clue at all. It's a trap. So ask how things feel and smell, not just how they look. And if a detail slipped past you mid-sentence, the R key replays the narration.

## Habit 2: Keep a Case File

Write things down, or ask the Game Master to summarise them for you:

- **People:** name, role, relationship to the victim, alibi
- **Places:** where things happened and who had access
- **Evidence:** what you found and where
- **Questions:** whatever doesn't add up

Even a few lines per session makes a huge difference. Some of the best detective games are built around this habit, actually. In Lucas Pope's [Return of the Obra Dinn](https://obradinn.com/), you play an insurance investigator for the East India Company in 1807, and your main tool is [a logbook holding the crew roster and a plan of the ship](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn), which you fill in as you work out the fate of all sixty souls aboard. It's a case file with a ship attached.

On EchoQuest you can ask "Summarise what I know about the case" at any point, and the Game Master pulls from your campaign history. A couple of other things help as well. The GM writes a codex entry whenever you discover or confirm a significant piece of lore, and only about things you actually learned in play, so the Lore tab on your character sheet (press C) slowly turns into an evidence board. The People tab, meanwhile, shows where you stand with everyone you've met. Auto-save kicks in every five turns (there's a manual Save button too), and since your progress lives on the server, the case file is still waiting when you come back on another device.

## Habit 3: Question Suspects Like a Detective

- **Start open:** "Tell me about your evening."
- **Get specific:** "What time did you leave the library?"
- **Confront with evidence:** "Then why was your glove by the window?"
- **Watch for reactions:** ask the GM "How does she react?"
- **Come back later:** people's stories change

Mix up your approach, too: sympathy, pressure, a discreet bribe, or a bluff that you know more than you do. On EchoQuest, a bluff or a silky appeal is usually a charisma check, so it can genuinely fail, which is half the fun. The NPCs are told to dodge questions and lie when it suits them, so never take the first answer as gospel. Lean on a witness too hard and their standing with you can drop. Win them over, on the other hand, and they might let slip the thing they swore they'd never say.

## Habit 4: Follow Motive, Means and Opportunity

For each suspect, ask:

- **Motive:** why would they want this?
- **Means:** could they physically pull it off?
- **Opportunity:** were they there, and when?

A suspect with all three is a strong lead. A suspect missing one needs an explanation. I'd argue this little grid is the best cure for tunnel vision you'll find. If your favourite suspect has no means, you either let them go or work out how they managed it anyway. Either answer moves the case forward.

## Habit 5: Test Theories Out Loud

Say your theory to the Game Master or to a companion NPC: "I think the gardener did it, because..." Putting a theory into words often exposes the gap in it. Companions can push back, and a good GM may drop a hint that you're warm, or nowhere close.

Fictional detectives do this all the time, incidentally. Holmes has Watson. Poirot, who made his debut in Agatha Christie's [The Mysterious Affair at Styles](https://www.agathachristie.com/stories/the-mysterious-affair-at-styles) back in 1920, has Hastings to think out loud at. Why should your character be any different?

On EchoQuest, try speaking the theory with voice input (press V). The game shows you the transcript before anything is sent, so you can catch a misheard name before you accidentally accuse the vicar.

## Habit 6: When Stuck, Change the Scene

If you've run dry on ideas:

- **Revisit the crime scene** with fresh questions
- **Follow the money:** who benefits financially?
- **Talk to the overlooked:** servants, children, the night watchman, the cabbie who drove the victim home
- **Set a trap:** spread false information and see who acts on it
- **Ask for a nudge:** "What would my character, an experienced investigator, think to check next?"

There's no shame in that last one. Your character is a skilled detective even if you're having an off night. In fact, Pelgrane Press built an entire rules system on that idea. In GUMSHOE, [if a scene holds a core clue and your character uses a relevant investigative ability, you find it](https://pelgranepress.com/2017/09/29/gumshoe-rules-summary/). No roll, no luck involved. The game cares about what you do with clues, not whether you happen to trip over them, and I think that's exactly the right instinct.

## For Game Masters: The Three-Clue Rule

If you're designing a mystery, give at least **three clues pointing to each important conclusion**. Odds are your players will miss one and misread another, and the third is the one that lands. That's Justin Alexander's rule, and his essay adds two bits of advice I like a lot. Treat your prepared clues as a safety net rather than a straitjacket, so a clever approach you never planned for still earns something. And when the players stall completely, let the villain move. A fresh attack or a second body brings fresh clues along with it.

I'll be straight with you about EchoQuest here. I can't promise every campaign was written with exactly three clues per conclusion. What I can describe is how the GM behaves. Its instructions tell it to follow the player's creativity instead of forcing them back onto a path, and to plant small details early so it can pay them off turns later. Because it improvises around what you actually try, there's nearly always another route to the truth. That's Alexander's safety net, more or less, built into the Game Master.

## Great Mystery Setups to Try

- **Locked room:** an impossible crime and a short list of suspects. John Dickson Carr's [The Hollow Man](https://en.wikipedia.org/wiki/The_Hollow_Man_%28Carr_novel%29) (1935) famously pauses for a "locked room lecture" on all the ways it could be done
- **Country house:** a closed circle with secrets in every wing, the territory Christie claimed from Styles onward
- **Noir city:** corruption, dirty cops and nobody telling the truth. Raymond Chandler's [The Big Sleep](https://www.britannica.com/topic/The-Big-Sleep-novel-by-Chandler) (1939) is the template. Try EchoQuest's **Neon Precinct**
- **Supernatural:** the killer might not be human. EchoQuest's The Black Vellum, a present-day cosmic horror investigation, lives here
- **Historical:** limited forensics, so wits count for more. Umberto Eco's [The Name of the Rose](https://en.wikipedia.org/wiki/The_Name_of_the_Rose), set in a 14th-century Italian monastery, is a superb example

### A closer look at Neon Precinct

Neon Precinct takes place in Karthos-12, a twelve-district arcology under a permanent rain cycle that the Atmosphere Council "forgot" to switch off in 2061. Three megacorps carve up everything that matters, and you play a freshly decommissioned synthetic detective. The case opens at 3:14 in the morning, in your apartment above Vega's Place, a jazz bar on the Promenade. Someone has slid an envelope under your door. Inside sits the security badge of a director-level Helio-Vance executive who was reported missing six hours earlier, along with a handwritten note that says only "You owe me." Worse, your own diagnostics report that you signed a contract last night, and you don't remember signing anything.

So what makes it a proper mystery rather than a shootout in the rain? Memory is for sale in Karthos-12, which means you can't fully trust your own recollections. Every source comes with an angle. Captain Ines Marrow suspended you six months ago and knows more than she's letting on. Soren, a twelve-year-old intel runner down in the Mire, knows which corp drones fly on which night (talk to the overlooked, remember?). Down in the Sub, the Archivist runs an unregistered memory clinic. I also gave the GM a real-world detail to weave in: evidence lives or dies on chain of custody, meaning who handled it and where it sat in between. Oh, and don't pull a weapon in the Glass. Helio-Vance security shows up in roughly forty seconds.

## Solve Your First Case

Grab your notebook, or just your ears, and step into a mystery where the suspects talk back. Who are you going to trust first, the captain or the kid?

**[Start investigating in Neon Precinct →](/library)**
`,
  },
  {
    publishAt: "2026-10-15",
    title: "Voice-Controlled Games: The Complete Guide to Playing by Speech",
    excerpt: "How voice-controlled games work, which genres suit speech, how to set up your mic and OS voice tools, and fixes for the problems voice players hit most.",
    content: `# Voice-Controlled Games: The Complete Guide to Playing by Speech

For most of gaming history, playing meant using your hands, on anything from a clunky joystick to the glass of a touchscreen. Speech recognition has finally become quick and accurate enough to loosen that grip. **Voice-controlled games** let you play with nothing but your voice, and for plenty of players that's the difference between playing and sitting it out.

I care about this for a practical reason. I build EchoQuest, an audio-first RPG where an AI Game Master narrates every scene aloud, and voice input has been one of the fussiest parts of the whole project. So this guide mixes what I've read with what I've had to fix.

## Who Benefits From Voice Control?

- **Players with motor disabilities** who find controllers or keyboards hard work, or downright painful
- **Blind and low-vision players** who want a natural way to give commands without looking at anything
- **People with repetitive strain injuries** who need to give their wrists and fingers a rest
- **Multitaskers** playing while they cook, tidy up or pedal on an exercise bike
- **Anyone** who simply finds talking more natural than typing

That last group is bigger than you'd think. Have you ever dictated a text message because typing felt like too much effort? Then you already get it.

## How Voice Input Works in Games

Broadly speaking, games handle speech in three different ways.

### 1. Command Recognition

The game listens for a fixed set of phrases, such as "attack", "go north" or "open inventory". It's dependable, but you have to learn the vocabulary first. Ubisoft's real-time strategy game *Tom Clancy's EndWar* built its whole pitch around this, promising on its [Steam page](https://store.steampowered.com/app/21800/Tom_Clancys_EndWar/) that you could "use your own voice to control your units." That's command recognition in its purest form: a set list of orders, spoken into a headset, which the game recognises or shrugs off.

### 2. Dictation Into a Text Field

Your speech becomes text, and the game receives it exactly as if you'd typed it. That's flexible, and it works with any text-based game, even one that was never designed for voice, because your operating system's dictation tools can fill in the text box for you.

### 3. Natural Language Understanding

You talk normally ("I sneak around the back and try the kitchen door") and the game figures out what you're after. Here AI games have the upper hand, since the Game Master grasps meaning instead of hunting for keywords.

EchoQuest blends dictation with natural language understanding. Press the mic button (or the **V** key) and say what you want to do. The AI Game Master works out the rest. Under the hood it uses the browser's own speech recognition. Short phrases get caught before they ever reach the AI: "pick two" or just "three" selects a numbered choice, and "where am I" or "save game" runs a game command on the spot. Anything else is treated as your action and handed to the GM. For the full list of phrases, see [Voice Commands in EchoQuest](/blog/voice-commands-in-echoquest-play-completely-hands-free).

One decision I'm still glad about: a command only counts if it's the entire phrase. Say "stop" and the narrator pauses. Say "stop the guard," on the other hand, and your character goes after the guard. A game that hijacks your sentence because it contains a magic word is a game you stop trusting.

## Which Game Genres Suit Voice Control?

| Genre | Voice suitability | Why |
| --- | --- | --- |
| AI RPGs and interactive fiction | Excellent | Natural language is the input |
| Trivia and word games | Excellent | Answers are spoken words |
| Turn-based strategy | Good | Commands can be discrete |
| Card games | Good | "Play the seven of hearts" |
| Real-time action | Poor | Speech is too slow for split-second input |

I'd stand by that last row, even with *EndWar* in mind. Barking an order at a squad works fine, because a second of delay rarely ruins a strategy game. A boss fight that wants a dodge in a fifth of a second is a different animal. By the time you've said "jump", you've already been squashed.

## Setting Up for Voice Gaming

### Microphone

- A **headset mic** or earbuds with a built-in mic keep your voice apart from the narration
- Steer clear of laptop mics in noisy rooms, since they pick up everything
- Make sure your browser has **microphone permission** for the game's site

That permission point bit me personally. A couple of weeks ago I discovered that my own security settings were blocking the microphone on EchoQuest's pages, so pressing the mic button quietly did nothing at all. Players weren't doing anything wrong; my site was. It's fixed now, but if voice input ever seems dead in any browser game, check the permission before you blame your mic.

Browser choice matters as well. Speech recognition on the web is still uneven: [Can I use](https://caniuse.com/speech-recognition) lists only partial support in Chrome and Safari, and Firefox keeps it disabled by default. If a game tells you voice input isn't supported, switching to Chrome usually sorts it out.

### Environment

- **Cut background noise**: the TV, a whirring fan, other people chatting nearby
- **Wear headphones** so the game's narration doesn't leak back into the mic

In EchoQuest, the narrator pauses by itself when you open the mic and picks up again if you end up saying nothing. The ambient soundtrack keeps going, however, so if your mic catches the rain and thunder, press **M** to silence it.

### Speaking Style

- Talk at a **natural pace**. There's no need to over-enunciate like a newsreader
- **Pause briefly** before and after your action
- **Say the whole intent** in one go: "I ask the captain where the cargo went, and watch his face as he answers."

That third tip matters more with push-to-talk. In EchoQuest the mic listens for one utterance, and once you go quiet it treats you as finished. So if you stop mid-thought to remember the captain's name, it may stop listening halfway through. You can still cancel the half-sentence when it's read back, but speaking in full thoughts saves you the bother.

## Voice Gaming and Accessibility

Voice control keeps cropping up in accessible game design for a simple reason: it removes a physical barrier. Pair it with **audio output**, where the game narrates everything, and voice input makes a game playable with no sight and no hands. That's the pairing I built EchoQuest around.

Still, the [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/ensure-that-speech-input-is-not-required-and-included-only-as-a-supplementary-alternative-input-method/) make an important point. Speech should never be the *only* way in, because forcing it "excludes all players who are either physically unable to speak" or can't speak clearly enough for a recogniser. I think they're right, and it's why every voice command in EchoQuest can also be done from the keyboard. The number keys pick choices, for instance, and L tells you where you are.

Getting the audio half right taught me as much as the voice half did. This spring I noticed that EchoQuest was announcing the choices while the narrator was still speaking, so screen reader users heard two voices at once. Now the choices wait their turn. Recently I also made narration start speaking while the GM's reply is still being written, to shrink the gap between saying your action and hearing the GM answer.

Operating systems also come with system-wide voice control that can drive keyboard-accessible web games:

- **Windows 11**: [Voice Access](https://support.microsoft.com/en-us/topic/get-started-with-voice-access-bd2aa2dc-46c2-486c-93ae-3d75f7d053a4) lets you control your PC and write text by voice on version 22H2 and later, and Microsoft says it works without an internet connection. Saying ["show numbers"](https://support.microsoft.com/en-us/accessibility/windows/voice-access/use-voice-to-interact-with-items-on-the-screen) puts a number on every button and link, so you can click one by saying its number
- **Android**: Google's [Voice Access app](https://support.google.com/accessibility/android/answer/6151854?hl=en) understands commands such as "Show numbers" and "Tap 7", and you can start it by saying "Hey Google, start Voice Access"
- **Mac**: Apple's [Voice Control](https://support.apple.com/guide/mac-help/use-voice-control-commands-mh40719/mac) responds to "Show numbers" or "Show names", then lets you say "Click" followed by an item's number or name
- **iPhone**: [Voice Control on iOS](https://support.apple.com/guide/iphone/iph2c21a3c88/ios) offers the same overlays, so you can tap an item by saying its name or number

Well-built browser games that follow accessibility standards work with all of these, because real buttons and links carry labels the tools can find.

## Common Problems and Fixes

- **"It keeps mishearing names."** Spell an unusual name out once, or swap in a simpler nickname. Plenty of mishearing isn't your fault, by the way. A 2020 study in [PNAS](https://www.pnas.org/doi/10.1073/pnas.1915768117) tested speech systems from Amazon, Apple, Google, IBM and Microsoft and found an average word error rate of 0.35 for Black speakers against 0.19 for white speakers. The authors traced the gap to the recognisers' acoustic models and called for more diverse training data. For now EchoQuest also asks the browser for US English, which is one more reason I show you the transcript before anything happens
- **"The game narration triggers the mic."** Use headphones, or push-to-talk. EchoQuest is push-to-talk already: nothing listens until you press V or the mic button
- **"Recognition is slow."** Check your internet connection, because some recognition runs in the cloud. As [MDN's Web Speech API guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) puts it, by default "your audio is sent to a web service for recognition processing, so it won't work offline"
- **"I don't know what to say."** Ask the game: "What can I do here?" A good AI Game Master will happily lay out your options

Misheard actions deserve a word of their own. Back in the spring I added a confirmation step after realising that "attack the wizard" could come out as "attack the lizard". Now EchoQuest reads your action back ("Heard: attack the lizard") and sends it after a few seconds, unless you hit Cancel. Short commands and choice numbers skip that wait, since they're hard to get badly wrong. I'd rather lose a few seconds than spend a whole turn brawling with a reptile nobody asked for.

## The Future of Voice Gaming

Speech models keep getting better, and I expect the next leap to be about *how* you say something. Your tone carries meaning that today's games simply throw away, and so does a nervous pause. One day an NPC may well notice the tremor in your voice when you swear you're telling the truth, and call your bluff. Games with an AI Game Master are the natural home for that kind of listening, since the GM is already reading intent rather than matching keywords.

That's not where things stand today, so I won't oversell it. Right now the job is plainer. A voice game has to hear your words correctly, and it must never force anyone to speak. Get those right and the clever stuff has something solid to stand on. So, what will you say first?

**[Play your first voice-controlled adventure →](/library)**
`,
  },
  {
    publishAt: "2026-10-16",
    title: "Free Online RPGs You Can Play in Your Browser (No Download)",
    excerpt: "A guide to free RPGs you can play in a browser with no download, from text adventures and roguelikes to AI Game Masters, plus tips for picking the right one.",
    content: `# Free Online RPGs You Can Play in Your Browser (No Download)

Not everybody owns a gaming PC or a console, and plenty of phones are already groaning under the photos before a 5 GB download even enters the picture. Maybe you're on a work laptop or a Chromebook. Maybe it's a library computer with a timer in the corner. Good news: browser RPGs have grown surprisingly deep, and a lot of them cost nothing. Here's my tour of **free online RPGs you can play in a browser**, along with some advice on choosing between them.

Let me admit my bias up front: EchoQuest, the game I build, runs in a browser tab, so I'm hardly a neutral judge. Still, I'll name other games I think deserve your evening, because a good browser RPG is a good browser RPG no matter who made it.

## Why Play RPGs in a Browser?

- **No install:** open a tab and you're playing
- **Any device:** laptop, Chromebook, tablet or phone
- **Low hardware requirements:** text- and audio-based games will run on almost anything with a speaker
- **Instant updates:** you always get the latest version, with no patch to download
- **Accessibility:** browsers have mature support for screen readers, zoom and keyboard navigation

That last point carries more weight than people assume. In [WebAIM's latest screen reader user survey](https://webaim.org/projects/screenreadersurvey11/), run in July and August 2026, 52.3% of respondents said Chrome was the browser they used with their main screen reader, and Edge came second. In other words, the browser is where a huge number of screen reader users already live, so it makes sense to bring the games to them.

## Types of Free Browser RPGs

### Text Adventures and Interactive Fiction

Thousands of free games run right in the browser, both parser games (where you type commands) and choice-based ones. The [Interactive Fiction Archive](https://ifarchive.org/) has been collecting text adventures since 1992, and it's a lovely rabbit hole. These games are lightweight and literary, and they tend to work well with screen readers. For a longer guide, see [Text Adventure Games Online](/blog/text-adventure-games-online-a-modern-players-guide).

If you want something sprawling, try Failbetter Games' [Fallen London](https://www.failbettergames.com/games/fallen-london), a Victorian-Gothic story game whose tagline announces that "London was stolen by bats." The city now sits in an underworld called the Neath. The studio describes it as free to play in any web browser, with "4.5 million handcrafted words" of story, and it resizes itself to fit a phone screen. It's been running since 2009, which in browser-game years makes it practically a cathedral.

### Browser MMORPGs

Some multiplayer RPGs run entirely in a browser, with 2D or simple 3D graphics. They're social and persistent. On the downside, many lean hard on grinding and need you to see the screen.

There are delightful exceptions, though. Asymmetric's [Kingdom of Loathing](https://www.kingdomofloathing.com/) has been running since 2003, it's free, and it swaps flashy art for stick figures and a frankly ridiculous number of puns. Its humour lives mostly in the writing.

### Incremental and Idle RPGs

Numbers go up, and your heroes level while you're away. These are relaxing, but most are light on story.

Not all of them, mind you. [A Dark Room](https://github.com/doublespeakgames/adarkroom) from Doublespeak Games describes itself as "a minimalist text adventure game for your browser". It opens with a single button that asks you to light a fire, and then it gradually turns into something far stranger. It's open source, too, so you can read exactly how it works.

### Roguelikes

These are procedurally generated dungeons with permadeath: die once, and that character is gone for good. Many classic roguelikes have browser versions, and they're great for tactical players. [Dungeon Crawl Stone Soup](https://crawl.develz.org/), for one, is an open-source roguelike you can play through its WebTiles servers by pointing your browser at one of them.

### AI Game Master RPGs

This is the newest category: a full tabletop-style RPG, run by an AI Game Master, inside your browser. You describe what you do in plain language and the story responds. [AI Dungeon](https://help.aidungeon.com/can-i-play-ai-dungeon-for-free) from Latitude is probably the best-known example, and its help pages say it's free to play on any device, with extra features for Premium members.

EchoQuest belongs here as well. It's free to start, and it narrates every scene aloud right there in your browser tab. One honest caveat: voice input relies on the browser's speech recognition, which works in Chrome but isn't available everywhere, so Firefox players will want to type.

## What EchoQuest's Free Tier Includes

- **Three official campaigns**, each in a different genre
- **Browser text-to-speech narration**, using the voices already on your device
- **60 AI turns per day** (each turn uses one minute of credit), with extra AI minutes for sale if you run out
- **Full keyboard, voice and screen-reader support**
- No download, no credit card

Browser voices come with their quirks, and I've wrestled most of them. This spring Chrome's built-in voice had a race condition and a cut-off at roughly 15 seconds, so I had to work around it. A few weeks ago the narrator began stopping a few seconds into a scene, and I chased that one down too. Mobile threw its own curveball, too: for a while the ambient soundtrack went completely silent on phones. Browser gaming is wonderful, but it keeps you humble.

If you want more, the Storyteller plan costs $15 a month or $129 a year. It brings unlimited turns, no ads and premium ElevenLabs narration with distinct NPC voices. You also get unlimited saved campaigns, plus one private world of your own, built with the World Builder Wizard or by uploading a Game Bible. The Creator plan, at $29 a month or $239 a year, adds publishing your worlds to the public library and creator analytics.

## How to Choose a Browser RPG

Ask yourself:

1. **Story or systems?** Story lovers should try interactive fiction or AI RPGs. System lovers should head for roguelikes and MMOs.
2. **Solo or social?** MMOs suit social play. AI RPGs and IF are mostly solo affairs.
3. **Session length?** Idle games suit two-minute check-ins. AI RPGs are better for sessions of 15 to 60 minutes.
4. **Visual or audio?** If you want to rest your eyes or use a screen reader, choose text-first or audio-first games.

So which of those four questions gets the loudest answer from you? Start there and ignore the rest for now.

## Tips for Browser Gaming

- **Use a modern browser** (Chrome, Edge, Firefox or Safari) and keep it updated
- **Allow audio autoplay** for the game site, so narration isn't blocked. Chrome's [autoplay policy](https://developer.chrome.com/blog/autoplay) holds back sound that tries to start by itself unless you've already interacted with the site or installed it as an app (on desktop, Chrome also remembers sites where you often play media)
- **Allow microphone access** if you want voice input. I learned this one from the wrong side: a few weeks ago I found my own security settings were blocking the mic on EchoQuest's pages, so voice input simply didn't start. That's fixed, but it's the first thing I'd check in any game
- **Pin the tab** so you don't lose it among the forty others
- **Bookmark it, or install it as an app** where supported, for one-click access. In Chrome on a computer, the menu has an [Install page as app](https://support.google.com/chrome/answer/9658361?hl=en) option, and EchoQuest is set up to be installed that way

Switching devices is the other thing people worry about with browser games. Recently I moved EchoQuest's character progress onto the server, so you can start a campaign on a laptop and pick it up later on your phone. Auto-save kicks in every five turns, and there's a manual Save button for when you're about to close the lid.

## Is "Free" Really Free?

Lots of free games earn their keep through ads or premium tiers, and some sell cosmetic extras on top. I don't think that's a problem, provided the game is upfront about it and the free experience is complete. What I'd steer well clear of is any game that stops you halfway through a story and demands money to continue. The same goes for pressure tactics like countdown timers. The US Federal Trade Commission flagged exactly that trick in its [2022 report on dark patterns](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers), describing "countdown timers designed to make consumers believe they only have a limited time to purchase a product."

Daily limits aren't automatically sinister, by the way. Plenty of honest games ration play. Failbetter has even written openly about [why Fallen London stays free-to-play](https://www.failbettergames.com/news/why-is-fallen-london-still-free-to-play), explaining that removing its action caps would have eaten more than a year of its writers' time. I respect that kind of candour, and I'll try to match it.

So here's EchoQuest's deal, plainly. The free tier is a complete experience: three full campaigns and a daily turn allowance. It does show ads between sessions, and I'd rather tell you here than have you find out later. The paid plans are optional, and there's no clock ticking down to scare you into one.

## Start Playing Now

No download and no card required. Pick a world, and your adventure can start within the next minute.

**[Play free in your browser →](/library)**
`,
  },
  {
    publishAt: "2026-10-17",
    title: "Magic Systems 101: How to Design Magic That Feels Fair",
    excerpt: "How to design a fantasy magic system that feels fair: hard vs. soft magic, sources, costs and limits, and how to write magic rules an AI Game Master can follow.",
    content: `# Magic Systems 101: How to Design Magic That Feels Fair

Magic can make a fantasy world feel enchanted, or it can wreck it completely. If a wizard can fix any problem with a spell, why does the story need anybody else? A good **magic system** produces wonder *and* tension at once. It hands characters power, then makes that power cost them something.

This guide covers the basics of designing magic for your RPG world. It also shows how to write the rules down so a Game Master, human or AI, can apply them the same way every time. That second part is close to my heart, because EchoQuest's Game Master reads the world rules that creators write, and a vague rule gives it far too much room to wobble.

## Hard Magic vs. Soft Magic

Fantasy writers often describe magic on a spectrum, and the novelist Brandon Sanderson popularised the terms most people now use. His [First Law of magic](https://www.brandonsanderson.com/blogs/blog/sandersons-first-law) says "an author's ability to solve conflict with magic is DIRECTLY PROPORTIONAL to how well the reader understands said magic." For soft magic, he points to Tolkien. As he puts it, there's a reason Gandalf doesn't simply fly Frodo to Mount Doom: we don't know what his magic can do, so it can't be the thing that solves the plot.

- **Hard magic** has clear, knowable rules. Players understand exactly what it can do, so they can use it cleverly to crack problems.
- **Soft magic** stays mysterious and unpredictable. It stirs awe and dread, but nobody can count on it.

| | Hard magic | Soft magic |
| --- | --- | --- |
| Best for | Problem-solving, tactical play | Mood, mystery, horror |
| Player feeling | Clever, in control | Wonder, fear |
| Risk | Can feel mechanical | Can feel arbitrary |

For RPGs, where players actually *use* magic, you'll usually want **mostly hard magic for player abilities**, with **soft magic for the world's great mysteries**. I'd go further and call that a rule. A novelist can keep the reader guessing, but a player who can't predict their own spell will stop casting it, and fairly so.

My own worlds lean on this split. In The Shattered Reaches, a dark fantasy world in EchoQuest's library, the rules note that magic is unstable and that spells may have unexpected side effects down in the Rift. That's soft magic on purpose, aimed at the scariest place on the map.

## The Three Pillars: Source, Cost, Limit

### 1. Source: Where Does Magic Come From?

- Gods and pacts
- Study and formulae
- Bloodlines
- Natural energies (ley lines, stars, the sea)
- Artefacts and relics

The source shapes your world's politics. If magic comes from gods, temples hold the power. If it comes from study, the universities do. Sanderson's [Third Law](https://www.brandonsanderson.com/blogs/blog/sandersons-third-law-of-magic) ("Expand what you already have before you add something new") pushes the same instinct. He suggests asking "what happens when" questions until the consequences fall out, such as what happens to warfare when magic can make food from thin air. Ask that sort of question about your source and you'll find half your plot hooks waiting.

### 2. Cost: What Does It Take?

Magic without cost has no drama. Costs can be:

- **Physical:** exhaustion, pain, ageing
- **Material:** rare components, silver, blood
- **Social:** fear, persecution, obligations to a patron
- **Moral:** corruption, lost memories, harm to others
- **Risk:** a chance of mishap every time

Tabletop games have been pricing magic for decades. In the current Dungeons & Dragons rules, [casting a spell expends a spell slot](https://www.dndbeyond.com/sources/dnd/br-2024/spells), and finishing a Long Rest is what restores them. Some spells also eat a costly material component, which the caster has to actually own. That's a stamina cost and a material one stacked together, and it's why wizards in D&D spend so much time worrying about when they'll next get to sleep.

Here's something I learned building EchoQuest: a cost the game never enforces isn't really a cost. Until recently, hitting 0 HP in EchoQuest didn't carry a proper setback. I've since added one, because danger that never bites soon stops feeling like danger. Magic works the same way. If casting is supposed to exhaust you, the exhaustion has to show up in the story.

### 3. Limit: What Can't It Do?

Limits are the most important design choice you'll make. Common ones:

- Can't raise the dead
- Can't create something from nothing
- Can't affect someone who knows your true name
- Only works at night, near water, or while chanting
- Range, duration, or number of uses per day

True names have a long pedigree, by the way. In Ursula K. Le Guin's *A Wizard of Earthsea* (1968), to work a spell you need the true name of the thing you're enchanting, and as the [National Endowment for the Arts' reader's guide](https://www.arts.gov/sites/default/files/Readers-Guide-WizardofEarthsea.pdf) quotes the book, "A mage can control only what is near him, what he can name exactly and wholly." That one sentence gives you a range limit and a knowledge limit together. The greatest wizards there do all they can to avoid casting, too, because every spell disturbs the balance of the world.

Sanderson sums the whole idea up in his [Second Law](https://www.brandonsanderson.com/blogs/blog/sandersons-second-law): "Limitations > Powers." Superman isn't interesting because he can fly. He's interesting because of kryptonite and his own moral code.

**Players are most creative when they push against clear limits.**

## Make Magic Say Something

The best magic systems echo the world's themes:

- In a world about **greed**, magic might be fuelled by gold, burned up with each spell.
- In a world about **memory**, casting might erase your own recollections.
- In a world about **community**, spells might need several casters working together.

Sanderson's own example is pleasingly cheeky. While designing *Mistborn*, he [themed every power around what thieves would want](https://www.brandonsanderson.com/blogs/blog/sandersons-third-law-of-magic) and named each one after a role in a thieving crew, so the magic itself tells you it's a heist story. Here's a handy test for your world: drop your magic system into somebody else's setting. If nothing feels out of place, your magic isn't saying much yet.

I did something along these lines in The Iron Citadel, a steampunk world in the library. It has no magic at all. Instead, a rare few workers have resonance, the ability to physically interface with the Engines that keep the city alive. The world's notes warn that it's exhausting, and that it can turn dangerous in high-energy places. So in a story about workers worn down by machines, the one "magical" talent wears its users down too.

## Sensory Signatures

Give each type of magic a signature your senses can catch:

- Fire magic: a roar like a furnace door opening, the smell of scorched air
- Necromancy: sudden silence, cold breath, the taste of iron
- Healing: warmth, a hum just below hearing

In audio-first games these signatures are how players *perceive* magic, and they make every spell memorable. Lucasfilm Games understood this back in 1990 with [*Loom*](https://www.lucasfilm.com/news/lucasfilm-games-rewind-loom/), where you cast spells by playing four-note melodies called drafts on a distaff. The magic was literally music, and in my view few games since have made casting feel as personal.

EchoQuest has its own small version of this. When the GM decides a spell goes off, it can trigger a sound cue: a successful cast swoops upward two octaves with a soft hiss of air. A fizzle does the reverse, sliding two octaves down into a buzzy rasp. Getting those cues heard took real work, though. This spring I made the ambient soundtrack duck under sound cues, and I started dropping duplicate cues that fire within 80 milliseconds of each other, because a doubled chime sounds like two spells when you can't see the screen.

## Writing Magic Rules for an AI Game Master

If you're building a world on EchoQuest, your magic rules go into your Game Bible. Write them clearly:

> **Tidecalling.** Only people born on a ship at sea can use it. Tidecallers command water within sight. Each casting costs the caster a memory; they choose which. Tidecalling cannot affect water inside a living body. Its sign is the smell of salt and a sound like a wave breaking far away.

Clear sources, costs, limits and signatures let the AI Game Master apply the rules consistently and describe them vividly. When you upload a Game Bible, EchoQuest pulls the mechanical rules out of your document, magic systems included, and folds them into the brief the GM works from. It's told to take only what the document actually says, though, so whatever you leave vague, the GM will have to improvise. And if you'd rather build with the World Builder Wizard, one of its questions asks for a single hard rule the Game Master must respect. "Magic always costs blood" is one of the examples it offers, and it's a great place to start. Both routes come with the Storyteller plan's private world. See [How to Write a Game Bible](/blog/how-to-write-a-game-bible-the-world-builders-template) for the full template.

## Common Magic System Mistakes

- **No cost:** magic becomes the answer to everything.
- **Too many exceptions:** players stop trusting the rules.
- **Only combat uses:** the best magic also solves social, exploration and mystery problems.
- **Wizards everywhere:** if everyone can do magic, it stops feeling special.

Of these, I think too many exceptions does the most damage, especially with an AI GM. Each exception is one more thing that can be misremembered in the middle of a tense scene. A short, firm rule beats a long, clever one every time.

## Try It Out

Design one magic tradition with a source, a cost, a limit and a sensory signature. Then play a session with it. Nothing stress-tests a magic system faster than a creative player who has just spotted a loophole. So what will your magic cost?

**[Build your world with the World Builder Wizard →](/library)**
`,
  },
  {
    publishAt: "2026-10-18",
    title: "Assistive Technology for Gaming: Switches, Braille Displays and Adaptive Controllers",
    excerpt: "A plain guide to adaptive controllers, switches, braille displays, eye tracking and voice input for gaming, and what a game must do to work with each.",
    content: `# Assistive Technology for Gaming: Switches, Braille Displays and Adaptive Controllers

For plenty of disabled players, the game was never the real obstacle. The input was. A standard controller quietly assumes two steady, nimble hands, and it takes for granted that you can see what you're pressing. A keyboard makes much the same bet. That's a lot of assumptions to mould into one lump of plastic. **Assistive technology** knocks them over, so a player can reach a game through whatever their body happens to do well.

This is hardly a fringe audience, either. The World Health Organization estimates that [1.3 billion people experience significant disability, which works out at roughly 1 in 6 of us](https://www.who.int/news-room/fact-sheets/detail/disability-and-health). A good share of them want to play games, and they've been patching together workarounds for decades.

I've spent a surprising amount of my time building EchoQuest fretting about input, mostly because an audio game lives or dies on how you talk back to it. So this guide walks through the main families of assistive tech for gaming and what each one asks of a game. I'll also be straight about where EchoQuest fits, including which parts I built on purpose and which parts simply work because the game sticks to standard, well-behaved web pages.

## Adaptive Controllers

Adaptive controllers are hubs. You plug in big buttons, joysticks, foot pedals and switches, and each one gets mapped to an ordinary controller input. Microsoft and Sony each sell an official one now, and a lively third-party scene has grown up around them.

The [Xbox Adaptive Controller](https://www.xbox.com/en-US/accessories/controllers/xbox-adaptive-controller) is the one most people have heard of. Microsoft says it was [designed with extensive input from gamers with disabilities](https://news.microsoft.com/announcement/xbox-adaptive-controller-unveiled/), and its spec sheet lists nineteen 3.5mm ports plus two USB ports for external inputs. It pairs with Xbox One and Xbox Series X and S consoles and Windows 10 and 11 PCs, and Microsoft also lists iOS, Android and some smart TVs over Bluetooth or USB. The Xbox Accessories app handles button remapping and profiles, and a Profile button on the controller flips between three of them. Sony answered with the [Access controller for PS5](https://www.playstation.com/en-us/accessories/access-controller/), which [launched worldwide in December 2023](https://blog.playstation.com/2023/12/06/celebrating-inclusivity-access-controller-for-ps5-launches-today/) after a five-year effort in which Sony worked with AbleGamers, Stack-Up and SpecialEffect. It ships with swappable button and stick caps and four standard 3.5mm expansion ports. You can set up as many as 30 control profiles in the PS5's settings and keep three on the controller itself. Around the Xbox pad in particular there's a healthy market of add-ons, such as Logitech's [Adaptive Gaming Kit](https://www.logitechg.com/en-us/shop/p/adaptive-gaming-kit-accessories): a dozen buttons and triggers, light-touch buttons and pressure-sensitive variable triggers among them, that you fix with hook-and-loop boards or ties wherever suits you.

**Best for:** players with limited hand mobility, strength or dexterity.
**What games need:** full button remapping and hold-to-toggle options.

Now a confession, because I'd rather you hear it from me than find out mid-session. EchoQuest doesn't read controller input directly. It's a web app you drive by keyboard, touch, pointer or voice, so an adaptive controller only reaches it if something on your system turns those buttons into keystrokes or clicks. On Windows or Linux, a free mapper such as [AntiMicroX](https://github.com/AntiMicroX/antimicrox), which maps gamepad buttons to keystrokes and mouse actions, can be that bridge for an Xbox Adaptive Controller plugged into a PC. Then the controller is simply pressing EchoQuest's ordinary keyboard shortcuts. If you'd rather skip the gamepad altogether, Microsoft's [Adaptive Hub and Adaptive Buttons](https://news.microsoft.com/source/features/diversity-inclusion/new-mix-and-match-computer-accessories-give-people-with-disabilities-easier-ways-to-work-and-create/) are a tidy fit. Microsoft built them to replace or augment a regular mouse and keyboard, the buttons can be programmed with macros, and the hub also accepts ordinary assistive switches through 3.5mm ports. Nothing in EchoQuest needs holding down, either, so hold-to-toggle never comes up. Proper controller support is on my wish list. Until it ships, though, I won't pretend it exists.

## Switches

A switch is a single input. It might be a large button, a sip-and-puff tube, a head switch or a blink sensor. Switch users often get around an interface by **scanning**: the interface highlights options one at a time, and pressing the switch picks whichever one is lit.

Both phone platforms have this baked in. Apple's [Switch Control](https://support.apple.com/en-us/119835) works with Bluetooth and Made for iPhone switches, and it can even turn the front camera into a pair of switches that you trigger by turning your head left or right. Its item scanning "highlights items or groups on the screen one at a time," in Apple's own words. Over on Android, [Switch Access](https://support.google.com/accessibility/android/answer/6122836) does the same job and happily accepts dedicated USB or Bluetooth switches, a plain keyboard, or the phone's own volume buttons.

**Best for:** players with very limited movement.
**What games need:** turn-based play, no time pressure, and interfaces with a small number of clear choices.

Turn-based and narrative games suit switch users especially well, and honestly, that's one area where an RPG built around conversation has a head start. At the end of every scene, EchoQuest offers **suggested choices**: three to five plainly labelled options, one of them an open-ended "something else" option. Each is an ordinary button in a numbered list, which is exactly the sort of thing Switch Control and Switch Access know how to scan. To be clear, I didn't write any switch-specific code for this. Scanning works because the choices are plain, properly labelled buttons, which is what these tools expect from any well-built web page. You never have to type, and no clock is ticking while you decide.

I did learn one lesson here the hard way. At one point EchoQuest announced and focused the choices while the narrator was still talking, so screen reader users got two voices at once. Scanning through options while somebody talks over you is no fun, either. So now the choices wait. Once the narrator falls quiet, the game reads them out and, by default, puts focus on the first one, so scanning can start from there.

## Braille Displays

A refreshable braille display shows text as tiny pins that rise and drop to form braille cells, changing as the text changes. Paired with a screen reader, it lets deafblind players and braille readers take in game text by touch.

Support runs wider than most people guess. NVDA, the free Windows screen reader, [can output its information in braille](https://download.nvaccess.org/documentation/userGuide.html) and detects a long roster of displays automatically, from HumanWare's Brailliant series to any display that speaks the Standard HID Braille protocol. On Apple devices, VoiceOver [pairs with a Bluetooth refreshable braille display](https://support.apple.com/guide/iphone/use-a-braille-display-iph73b8c43/ios) so you can read the screen and control the phone from it, with contracted or uncontracted braille tables in plenty of languages.

**Best for:** deafblind players and braille-first readers.
**What games need:** real text (not images of text), proper screen-reader support, and no timed reading.

Text-based and web-based games built on accessible HTML work with braille displays through screen readers like NVDA, JAWS and VoiceOver. To be clear, EchoQuest contains no braille-specific code, and it doesn't need any. Every scene is real text on the page, inside a region labelled "Story narration", and system messages such as auto-save notices go out through live regions. Your screen reader takes it from there and passes the text along to your display.

One detail is worth knowing, though. While the narrator voice reads a scene aloud, I hide that scene's text from screen readers, because otherwise VoiceOver or TalkBack would read it straight over the top of the voice. Drag the narrator's Volume slider (it's under "Fine-tune audio settings") down to zero and the text comes right back for your screen reader, and for your braille display with it. Then read at your own speed. Nothing moves on until you pick something.

Braille users are also the reason I'm glad the page stays tidy. Raw JSON once leaked into the spoken narration, curly braces and all. It's long fixed, but it was a good reminder that whatever lands on the page is exactly what a braille reader gets under their fingertips.

## Eye Tracking

Eye-tracking devices let players steer a pointer or select things with their gaze. A handful of games support eye tracking natively, and system-level software can map gaze onto ordinary mouse input.

The built-in options have become genuinely capable. Windows has an eye control feature for [supported Tobii and EyeTech trackers](https://support.microsoft.com/en-us/windows/get-started-with-eye-control-in-windows-1a170a20-1083-2452-8f42-17a7d4fe89a9) that lets you [control the mouse cursor and type on an on-screen keyboard](https://support.microsoft.com/en-us/accessibility/windows/eye-control/eye-control-basics-in-windows), and you activate things by dwelling, which Microsoft describes as fixing your eyes on part of the screen for a set amount of time. Apple went a step further with [Eye Tracking on iPhone](https://support.apple.com/guide/iphone/control-iphone-with-the-movement-of-your-eyes-iph66057d0f6/ios), which uses the phone's built-in front-facing camera on supported models, with no extra hardware: a pointer follows your eyes, and holding your gaze steady performs a tap by default.

**Best for:** players with severe motor disabilities but good eye control.
**What games need:** large targets, dwell-time selection, and no precision aiming.

There's no eye-tracking code in EchoQuest. Your tracker drives it the way it drives any web page, as a pointer, and EchoQuest asks very little of that pointer. The choice buttons stretch across the width of the panel, and there's nothing to aim at or react to in a hurry. Dwell timing comes from your eye-tracking software rather than from the game, so you can tune it to whatever feels comfortable.

## Voice Input

Speech recognition turns spoken words into commands or text. It's increasingly built into operating systems and games. On Windows 11, for example, [voice access](https://support.microsoft.com/en-us/accessibility/windows/voice-access/get-started-with-voice-access) lets people control the PC and write text using only their voice, and it does that without an internet connection.

**Best for:** players who can speak clearly but have limited hand use.
**What games need:** natural language support or a voice-friendly command set.

Voice is where AI games really earn their keep. You can say "I climb onto the cart and shout for the crowd's attention" instead of rummaging through menus. EchoQuest's voice input uses the speech recognition built into your browser, so support depends on which browser you use, and for now it listens for US English. Short commands like "pick two", "where am I" or "save game" act straight away. A free-form action gets read back to you first and then sends itself after a few seconds unless you press Cancel, because a misheard "lizard" instead of "wizard" shouldn't cost you a turn.

Voice taught me some humility as well. At one point the microphone was blocked on my own pages, so voice input quietly did nothing at all until I tracked it down. Want the full picture? See [Voice-Controlled Games: The Complete Guide](/blog/voice-controlled-games-the-complete-guide-to-playing-by-speech).

## One-Handed Keyboards and Mice

Specialised keyboards, programmable keypads and ergonomic mice help people who game one-handed. Macro software can squash several keys into a single press, and adaptive gear like the Microsoft buttons mentioned above can be programmed with macros too.

**What games need:** full keyboard remapping and minimal simultaneous key presses.

The [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/allow-controls-to-be-remapped-reconfigured/) call remappable controls "one of the best value accessibility features", and I agree with them. They point out that it helps people with motor impairments of very different kinds, from someone living with the effects of a stroke to someone with a broken arm. So here's where EchoQuest stands. The good news: every shortcut is a single key with no modifiers and no chords. Space or P pauses narration, the number keys pick a choice, U undoes your last turn, and nothing ever has to be held down. The gap: EchoQuest has no remapping screen of its own yet. If a key sits somewhere awkward for you, your keypad's software or your operating system's remapping tool is the way round it for now. That's a gap I'd like to close.

## Screen Readers and Magnifiers

These are software, not hardware, but they're at the heart of blind and low-vision gaming. EchoQuest has skip links that jump straight to the audio controls or the action box, and its display settings cover high contrast, large text, reduced motion and a light theme. It also picks up the display preferences you've already set on your device, such as reduced motion or extra contrast, so you don't have to set them twice. For the details, see my guides on [screen reader gaming](/blog/games-you-can-play-with-a-screen-reader-nvda-jaws-and-voiceover-tips) and [gaming with low vision](/blog/gaming-with-low-vision-settings-tools-and-tips-that-actually-help).

## What Makes a Game Assistive-Tech Friendly?

If you're sizing up a new game for your setup, these are the things I'd check first:

- **Full input remapping**
- **No mandatory time pressure**
- **Few simultaneous inputs**
- **Real text exposed to the OS** for screen readers and braille
- **Large, clear interactive targets**
- **Standard keyboard navigation** (Tab, Enter, arrow keys)
- **Choice-based alternatives** to free input

Notice how few of those cost a studio anything exotic. Most of them come down to building with standard parts and resisting the urge to put a timer on everything.

## How EchoQuest Supports Assistive Tech

Here's the honest scorecard, based on what's actually in the game today:

- Fully **keyboard-navigable** with a logical focus order, which works with switch access and with external remapping tools (there's no in-game remapping yet)
- **Suggested choices** after every scene, three to five numbered buttons, for scanning and switch users
- **Voice input** for speech users, with free-form actions read back before they're sent
- **Screen reader and braille** support through semantic HTML and live regions, plus screen reader announcements when your HP or inventory changes
- **No time limits** on any decision, and single-step undo if you pick something you didn't mean to
- **Large-text, high-contrast and reduced-motion** options, plus a light theme

What's missing is direct controller support, as I said above. I'd rather list that plainly than let you buy an adaptive pad on the strength of a vague promise.

## Everyone Deserves to Play

Assistive technology has come a remarkably long way, yet it only pays off when games are built to accept it. My aim with EchoQuest is simple: however you reach the world, you should be able to play. So what does your setup look like? If something in EchoQuest trips it up, [tell me](/contact-us), because that kind of report is the most useful message I get.

**[Try EchoQuest with your setup →](/library)**
`,
  },
  {
    publishAt: "2026-10-19",
    title: "How to Create a Villain Players Love to Hate",
    excerpt: "Eight ways to build an RPG villain your players will curse for years, from a goal they understand to a final confrontation that ends in a real choice.",
    content: `# How to Create a Villain Players Love to Hate

A campaign rises or sinks with its villain. A great one makes the whole table lean in and swear under their breath, and people still bring them up over pizza years later. A weak one is cardboard, evil only because the plot needed somebody to hit. You've probably met both kinds. Which one do you still remember?

Villains are oddly good for us, too. Two Northwestern researchers, Rebecca Krause and Derek Rucker, looked at how roughly 232,000 users of the character site CharacTour related to heroes and villains, and found that people are [drawn to villains who resemble them](https://insight.kellogg.northwestern.edu/article/identify-with-the-villain). Normally we back away from bad people who remind us of ourselves. Fiction takes the sting out of that. As Krause put it, "within the safe confines of fantasy, we're able to explore our dark side without fear of negative consequences." That goes a long way towards explaining the "love to hate" part.

So here's how to build an **RPG villain** your players will love to hate. It's meant for Game Masters and world builders, and it works just as well if you're a solo player building a campaign with an AI. I'm writing from the seat I know best. I built EchoQuest, an audio RPG whose Game Master runs on Claude, and I spent a long time teaching that GM how an antagonist ought to behave.

## 1. Give the Villain a Goal You Understand

The best villains want something **understandable**, and once in a while something downright admirable:

- End a famine by any means necessary
- Restore a fallen dynasty that was wronged
- Protect their people from a threat no one else believes in
- Prove to a dead parent that they were worthy

Mike Shea of Sly Flourish says it bluntly: ["Good villains think their actions are justified. They think they're doing what's right."](https://slyflourish.com/three_motivations_for_your_villains.html) I'd go a step further. A villain with no reason is a weather event. You dodge it, and then nobody gives it another thought.

When your players catch themselves thinking "I see why they're doing this", the villain turns frightening, precisely because the villain is *convinced*. Conviction doesn't flinch, and it doesn't haggle the way greed does.

I took this to heart in my own worlds. The tone notes I wrote for The Iron Citadel, one of EchoQuest's prebuilt campaigns, contain one short line: "Even the villains have reasons." Its head of security, Overseer Drek, has known for ten days that the Engines keeping the lower tiers alive are failing, and he's been quietly arranging his own family's evacuation. My note for the GM insists he isn't a monster. He's "a man who stopped believing salvation was possible." Anyone with a family can follow that logic, which is exactly why he's so hard to face.

## 2. Show Their Method, and Where It Goes Too Far

A goal on its own doesn't make a villain. Goal plus method does. The goal may be good. The method is where the line gets crossed:

> Magistrate Orla wants to end the plague. Her method: burn every village where it's been reported, with the villagers still inside.

Now the players are stuck with a genuine dilemma. The plague is real, and Orla might even be right about how it spreads. Stopping her might let the plague run wild, and that's an ugly gamble for anyone to take.

This split between goal and method helps even with characters who aren't villains. Crimson Sands, another of the prebuilt worlds, has a young zealot called Preserver Orah who wants the old tombs left sealed. My note on her reads "She is not wrong about the danger. She is wrong about the solution." She's explicitly not an antagonist. Still, nudge her one step further, so that she'd bury the expedition alive to keep those tombs shut, and you'd have a villain on your hands. Her goal wouldn't change at all. Only her method would, and with it, how you feel about her.

## 3. Make Them Present Early

A villain who turns up only in the final session is a boss fight, not a villain. Put them on stage early:

- **Meet them before you know they're the villain.** Charming, helpful, reasonable.
- **See their effects:** burned villages, frightened NPCs, missing allies.
- **Talk to them.** Let the villain explain themselves, and maybe offer a deal.

Video games have pulled off that first trick beautifully. In Valve's [Portal](https://store.steampowered.com/app/400/Portal/) (2007), the voice guiding you through the test chambers belongs to GLaDOS, whom Valve's own store page for the sequel cheerfully calls ["the occasionally murderous computer companion who guided them through the original game"](https://store.steampowered.com/app/620/Portal_2/). You spend hours in her company before you fully grasp what she is. On the tabletop side, Wizards of the Coast's [Curse of Strahd](https://wpn.wizards.com/en/products/curse-of-strahd) (2016) frames its vampire count as someone who's been watching from the very beginning: "He knew they were coming, and he knows why they came, all according to his plan." A villain like that hangs over every scene long before anyone draws a sword.

Neon Precinct holds my own spin on the charming first meeting. Director Rin Kuroda, a junior heir at one of the city's megacorps, is described in the world notes as "polished, charming, conscienceless", and has recently made discreet inquiries about hiring the player off-book. The same notes call Kuroda "Patient. Not yet hostile." That little word "yet" does a lot of heavy lifting.

EchoQuest's GM instructions back this up with a craft rule I'm fond of. Hold things back, plant small details now and pay them off turns later, "because a reveal hits harder when the player half saw it coming". A villain seeded early is precisely that kind of detail.

## 4. Let Them Win Sometimes

A villain who always loses is no threat at all. So let them:

- Get to the artefact first
- Turn an ally against the players
- Escape a confrontation
- Expose the players' secrets

Each loss makes the eventual victory sweeter. The Empire Strikes Back (1980) is the textbook case. It opens with [the Rebellion's defeat on the ice planet Hoth](https://www.starwars.com/films/star-wars-episode-v-the-empire-strikes-back) and closes with Vader's trap sprung on Cloud City. Final Fantasy VI (Square, 1994) went further still. Midway through, Kefka knocks the statues of the Warring Triad out of balance, [reshaping the face of the planet](https://en.wikipedia.org/wiki/Kefka_Palazzo), and then rules the wreckage as the god of magic. The entire second half of the game happens in the world he broke.

One of my own design decisions leans on this idea. In EchoQuest, nobody dies permanently. Instead, when your character drops to 0 HP, the GM is told to narrate a real setback that fits the moment: you're captured, or dragged clear by someone with an agenda, or robbed, or you wake hours later with a cost to pay. That setback was a deliberate addition. I wanted defeat to sting without ending anybody's story. As a result, a villain can beat you outright and the campaign carries on. And frankly, being hauled down to the villain's cellar makes a far better scene than a game-over screen.

## 5. Make It Personal

Tie the villain to a character's backstory:

- They're a former mentor, sibling, or friend
- They caused the character's defining tragedy
- They want the same thing the character wants
- They see themselves in the character, and say so

Nobody leaned on this harder than Star Wars. The official databank sums up the duel on Cloud City plainly: Vader revealed to Luke that ["he was Luke's father"](https://www.starwars.com/databank/darth-vader), hoping to turn him toward the dark side. One line of dialogue, and the fight stopped being about the galaxy.

That last bullet ties back to the Northwestern study, incidentally. A villain who sees themselves in your character holds up the same awkward mirror that drew people towards similar villains in the first place.

With an AI Game Master, write these links straight into your backstory. EchoQuest sends your character's backstory to the GM along with the rest of your character state on every single turn, and the GM's instructions tell it to bring old threads back "when it hurts or helps the most". So yes, the GM will use them. For prompts to get you started, see [How to Write a D&D Backstory](/blog/how-to-write-a-dd-backstory-with-10-prompts-and-examples).

## 6. Give Them Distinct Presence

Players should recognise the villain in a heartbeat:

- **A voice:** calm and courteous, or cold and clipped
- **A phrase:** something they always say
- **A sound:** the tap of a cane, a whistled tune, the clink of rings
- **A habit:** always offers tea, never raises their voice

Darth Vader proves a sound alone can carry a villain. The databank mentions his "mechanical lungs that emitted an ominous breathing sound", and sound designer Ben Burtt created it by [placing a microphone inside a scuba regulator and breathing into it in different ways](https://www.starwars.com/news/5-iconic-star-wars-sound-effects-and-how-they-were-made-starwars-com). You hear him before you see him. For an audio game, that's the dream.

In audio-first games, voice and sound become the villain's signature. On EchoQuest's Storyteller plan, premium narration gives NPCs distinct voices. When a new character first appears, the GM notes their gender, and the voice system picks a matching voice and keeps it across sessions, so the villain *sounds* like themselves every time you cross paths. Getting there took some repair work, I'll admit. At one point NPC voices flatly refused to switch, because the NPC's dialogue wasn't woven into the narration, so every villain came out in the narrator's own voice. Nothing deflates a menacing speech faster. Now every spoken line carries its speaker's name.

Phrases and habits are where the GM's character rules come in. When I rewrote the GM to talk like a seasoned human Game Master, I told it that NPCs speak in first person "with their own rhythm and grudges". They hold strong opinions and say them plainly. They dodge questions, and they lie when it suits them. Honestly, that's most of a good villain already. In Saltbound, the Crown officer whose frigate is prowling three islands east, Captain Lord Caspar Veil, "will offer terms before firing" and "will not negotiate after lies". That's a habit and a warning rolled into one.

A practical tip for listeners: EchoQuest's GM is told that anything marked only by colour or shape also needs a sound, a texture or a smell. So don't make a crimson cloak the villain's calling card. Give them the cane tap instead.

## 7. Give Them Lieutenants and Resources

Villains have reach. Give them:

- **Two or three lieutenants** with their own personalities and doubts
- **Resources:** money, soldiers, spies, magic
- **A base** that feels like theirs

Lieutenants can be defeated, turned, or redeemed along the way. They're also where your players get to win small battles before they're ready for the big one. In EchoQuest, the GM keeps track of how each named NPC feels about you on a scale from -100 (sworn enemy) to +100 (loyal ally). So turning a lieutenant is something you actually do over several scenes, one conversation at a time. It cuts the other way as well. Push someone far enough into hatred and there's even an achievement for making yourself a nemesis.

## 8. Build to a Final Choice

The best final confrontations aren't just fights. They're **choices**:

- Kill the villain or spare them?
- Accept their offer?
- Finish their work in a better way?
- Expose them, or let them keep their dignity?

Star Wars nails this one too. In the last act, according to the databank, Vader "rose, the good in him awakened by his son's compassion" and destroyed the Emperor. Luke's refusal to keep fighting was the climax. Toby Fox built an entire game around the same instinct: [Undertale](https://store.steampowered.com/app/391540/Undertale/) (2015) bills itself as "the RPG game where you don't have to destroy anyone", and its store page promises that killing is unnecessary, because you can negotiate your way out of danger.

AI play suits this beautifully, because there's no fixed menu of endings. EchoQuest offers three to five suggested choices at the end of each scene, one of them always open-ended, and you're free to ignore all of them and say whatever you like. If you'd like to offer the villain a job, try it. Since you built them with a goal you understand, the offer might even land.

## Villain Archetypes to Build From

If you're stuck for a starting point, grab one of these and bend it until it fits your world:

| Archetype | Goal | Line crossed |
| --- | --- | --- |
| The Zealot | Save the world by their faith | Anyone who disagrees is expendable |
| The Protector | Keep their people safe | Everyone else can suffer |
| The Avenger | Right an old wrong | Punish the innocent descendants |
| The Perfectionist | Build a flawless society | Remove anyone "imperfect" |
| The Former Hero | Finish what they started | They no longer care about the cost |

Overseer Drek, for what it's worth, sits somewhere between the Protector and the Former Hero. Most memorable villains straddle two rows.

## Bring Your Villain to Life

Villains are where roleplaying gets personal. Build one with a real goal and a line they cross, then give them a voice you'll never shake off. After that, play against them and see who blinks first.

One last tip if you're writing your own world. On the Storyteller plan you get a private world, built with the World Builder Wizard or from an uploaded Game Bible (PDF, DOCX, TXT, MD or JSON). If you go the Game Bible route, open your villain's personality description with the sharpest detail you've got, because the cast list the GM reads keeps only the first 120 characters of each NPC's personality. "Polite to your face, quietly buying the city" will do far more work there than a paragraph of family history.

So, who's your villain going to be?

**[Build a world with a worthy villain →](/library)**
`,
  },
  {
    publishAt: "2026-10-20",
    title: "Best Tabletop RPG Systems for Beginners (And Which Suit AI Play)",
    excerpt: "New to tabletop RPGs? A fair guide to D&D 5e, Pathfinder, PbtA, GUMSHOE, rules-light and solo games, and which ones suit an AI Game Master.",
    content: `# Best Tabletop RPG Systems for Beginners (And Which Suit AI Play)

Walk into a game shop, or scroll through an online store, and you'll run into hundreds of tabletop RPG systems. That's no exaggeration, either. The official Apocalypse World website once kept a database of games built on that one engine alone, then gave up, because there are now, "I kid you not, [hundreds and hundreds](http://apocalypse-world.com/pbta)." For a beginner, a wall of choice like that is daunting. Which one should you learn first? And if your Game Master is an AI, does the system even matter?

It does, although maybe not in the way you'd guess. I've had to chew on this more than most people, because building EchoQuest meant choosing rules for an AI Game Master to run for players who are listening, not peering at a battle map. So this guide walks through the main **tabletop RPG system styles for beginners**, names a real game or two for each, and explains how each style holds up in AI play.

## What Is an RPG "System"?

A system is the ruleset that decides what happens when the outcome is uncertain. You can picture it as the referee's handbook. It covers:

- **How you resolve actions** (dice, cards, or narrative judgement)
- **How characters are built** (classes, skills, freeform traits)
- **How combat works** (detailed tactics or quick narrative)
- **How characters grow** (levels, milestones, or story changes)

Two games can share a genre and still feel nothing alike, simply because they answer those four questions differently. Dice are the most visible difference. The games in this guide use a twenty-sided die, a pair of six-siders, a single six-sider, a fistful of them, or a deck of ordinary playing cards, and each choice changes the rhythm at the table.

## The Main Styles

Five broad families cover most of what a newcomer will bump into. Real games blur the edges, of course. Still, these labels should get you oriented quickly.

### 1. Crunchy Fantasy (e.g., D&D 5th Edition and Its Relatives)

**What it's like:** classes, levels, spell lists, detailed combat with a d20 roll-plus-modifier core.
**Pros:** the most popular style, with huge amounts of content and community. Clear character progression.
**Cons:** lots of rules to learn, and combat can be slow.
**Best for:** players who like tactical choices and character builds.

Dungeons & Dragons, published by Wizards of the Coast, is the flagship here. Its heart is what the rules call a D20 Test: [roll a d20, add the relevant modifiers, and if the total equals or exceeds the target number, you succeed](https://www.dndbeyond.com/sources/dnd/free-rules/playing-the-game). That target is a Difficulty Class for ability checks and saving throws, and the enemy's Armor Class for attacks. Here's the beginner-friendly bit people tend to miss. Those core rules are free to read on D&D Beyond, and Wizards has released its [System Reference Document](https://www.dndbeyond.com/srd) under a Creative Commons licence, which lets other publishers build on it.

Its closest relative is Paizo's [Pathfinder](https://paizo.com/pathfinder), now in its second edition. It keeps the d20-plus-modifier roll and layers on [four degrees of success](https://2e.aonprd.com/Rules.aspx?ID=2286): beat the DC by 10 or more and you critically succeed, miss it by 10 or more and you critically fail. Pathfinder runs even crunchier than D&D. On the other hand, Paizo offers a Beginner Box and points newcomers to the Archives of Nethys, where the rules are free to browse, so the climb is gentler than the page count suggests.

### 2. Rules-Light Fantasy

**What it's like:** a single core mechanic, a few stats, and fast play. Many rules-light games fit on a page or two.
**Pros:** learn in minutes, easy to improvise.
**Cons:** less crunch for players who love optimisation.
**Best for:** newcomers, one-shots, and story-focused groups.

[Cairn](https://cairnrpg.com/second-edition/players-guide/core-rules/), by Yochai Gal, shows how little a fantasy game really needs. Its text is free under a Creative Commons licence. When you risk something, you roll a d20 and succeed if you get equal to or under the relevant attribute. In a fight, attacks automatically hit, so you just roll damage. That one decision strips out a whole layer of arithmetic.

For the extreme end, there's John Harper's [Lasers & Feelings](https://johnharper.itch.io/lasers-feelings) (2013). Admittedly, it's space opera rather than fantasy, but nothing shows off the style better. The whole game fits on one page, and you can pay whatever you like for it. Your character has a single number from 2 to 5. Then, as the [rules sheet](http://onesevendesign.com/lasers_and_feelings_rpg.pdf) explains, you roll one six-sided die for anything risky, plus one if you're prepared and one if you're an expert. Using LASERS (science, reason), you want to roll under your number. Using FEELINGS (rapport, passion), you want to roll over it. Hit your number exactly and you've got "LASER FEELINGS", so you get to ask the GM a question and they'll answer you honestly. I adore that rule.

### 3. Narrative "Powered by the Apocalypse" Style

**What it's like:** roll two six-sided dice. A high roll is success, a mid roll is success with a complication, a low roll means the GM makes a move. Actions are framed as "moves" triggered by the fiction.
**Pros:** every roll moves the story, and there's lots of drama.
**Cons:** less tactical, and it needs players comfortable with improvisation.
**Best for:** players who love story and character drama.

This family descends from [Apocalypse World](http://apocalypse-world.com/), which Meguey Baker and Vincent Baker [first published in 2010](https://en.wikipedia.org/wiki/Powered_by_the_Apocalypse). Moves are usually resolved by rolling 2d6 and adding a stat. The game's own [basic moves](http://apocalypse-world.com/ApocalypseWorldBasicRefbook2ndEd.pdf) show the flavour nicely. When you do something under fire, you roll plus your cool. "On a 10+, you do it. On a 7–9, you flinch, hesitate, or stall: the MC can offer you a worse outcome, a hard bargain, or an ugly choice. On a miss, be prepared for the worst." (The MC is what Apocalypse World calls its GM.)

To be fair to newcomers, Apocalypse World itself carries a content warning, sexual content included, so it isn't everyone's first stop. Happily, with hundreds of games built on the same engine, there's almost certainly a gentler one in a genre you love.

### 4. Investigation-Focused Systems

**What it's like:** built around clue-finding, where the core clues are always found and the question is interpretation.
**Pros:** mysteries don't stall.
**Cons:** less focus on combat.
**Best for:** mystery and horror fans. See [Mystery RPGs: How to Solve Cases Without Getting Stuck](/blog/mystery-rpgs-how-to-solve-cases-without-getting-stuck).

The best-known engine here is GUMSHOE, designed by Robin D. Laws and published by Pelgrane Press. It powers games such as Trail of Cthulhu and Night's Black Agents. Its [reference document](https://pelgranepress.com/gumshoe/files/GUMSHOE%20SRD%20OGL%20version.pdf) states the whole philosophy in one line: "Investigative scenarios are not about finding clues, they're about interpreting the clues you do find." So if you reach the right scene with the right ability, you simply get the core clue, no roll required. Dice still matter for chases and fights, and every one of those rolls uses a single ordinary six-sided die. Honestly, I think every mystery game, digital or not, should steal this rule. A failed roll that hides the one clue you needed doesn't create tension. It just ends the evening early.

### 5. Solo Journaling RPGs

**What it's like:** prompts and random tables guide you as you write your character's story, often alone.
**Pros:** reflective and personal, no group needed.
**Cons:** you're doing all the creative work.
**Best for:** writers and introspective players.

A lovely place to start is Takuma Okada's [Alone Among the Stars](https://noroadhome.itch.io/alone-among-the-stars), a name-your-own-price game about drifting between planets and recording the wonders you find. All you need is a standard 52-card deck and a six-sided die. There's a nice touch for my readers in particular: the download includes a plain-text version of the rules and an MP3 called "Rules Out Loud", so a screen reader user can get going without fighting a fancy PDF layout.

## Beginner Comparison

| Style | Learning curve | Combat depth | Story focus | Group needed? |
| --- | --- | --- | --- | --- |
| Crunchy fantasy | High | High | Medium | Usually |
| Rules-light | Low | Low–Medium | Medium | Flexible |
| Narrative (PbtA-style) | Low–Medium | Low | High | Usually |
| Investigation | Medium | Low | High | Usually |
| Solo journaling | Low | Low | High | No |

If you want my single recommendation for a nervous first-timer, it's the rules-light row. You'll spend the evening playing instead of looking things up.

## Which Style Works Best With an AI Game Master?

AI Game Masters are strongest where **narrative judgement** matters and weakest where **precise tactical positioning** is needed. I'd go further, too. For anybody playing by ear, grid tactics are the wrong fit anyway, because counting squares on a map you can't see is nobody's idea of fun. In practice:

- **Rules-light and narrative styles** translate beautifully. The AI interprets the fiction and resolves uncertain outcomes with dice.
- **Crunchy fantasy** works with some simplification: HP, inventory and checks are tracked, but grid-based tactics become narrative.
- **Investigation** plays well, as long as the campaign provides redundant clues.

EchoQuest uses a **rules-light hybrid**. Behind the scenes it tracks your HP, inventory, quests, story flags and how each named NPC feels about you. When you try something with a real chance of failing, the GM picks the most relevant stat (strength, dexterity, intelligence or charisma) and a difficulty, from 5 for trivial up to 24 for near impossible. Then the game rolls a d20 and adds your stat modifier, using the same maths as D&D, so a 14 in Dexterity gives you +2. And here's the part I care about most: the AI doesn't roll the die. The game does, and the GM is told never to decide success itself. Meanwhile the AI handles everything else narratively. You get the feel of a tabletop game without needing to know a rulebook.

Several of those details came out of my own stumbles. Skill checks resolve in the same turn now, so you hear whether you made the jump right away instead of waiting a whole exchange. I also settled on one XP curve that applies everywhere, and the game handles levelling up and announces it for you. Then there's defeat. Dropping to 0 HP brings a real setback (you might be captured, or wake hours later with a price to pay), but nobody dies permanently. In my view, permadeath is the wrong default for a game so many people play alone. Real state needs real care as well. Early on, a turn that errored halfway could leave half its changes behind, so I added a full rollback, and a turn now lands completely or not at all.

If you build your own world on the Storyteller plan, the World Builder Wizard asks how the GM should run scenes, with options such as "Rules-light and breezy", "Crunchy with mechanics" or a mystery style with slow reveals. Crunchy tells the GM to mention rolls and honour mechanical choices. Rules-light keeps the story first, so consequences still matter but the maths stays quiet. A Game Bible can go further and define its own classes and how stats are generated, although the roll underneath stays a d20 plus a modifier.

## Advice for Total Beginners

1. **Don't learn a system first. Play first.** Rules make more sense once you've felt the game. A rulebook read cold is like a cookbook for a dish you've never tasted.
2. **Start rules-light.** You can always add complexity later. Cairn and Lasers & Feelings cost you nothing, or close to it, and you'll learn the rhythm of play in one sitting.
3. **Try an AI Game Master** to learn the rhythm of RPGs (describe, roll, react) without pressure. Nobody sighs when you ask what a saving throw is, and nobody minds if you stop halfway through to make dinner.
4. **Find your people.** When you're ready for a group, local game stores and online communities host beginner-friendly tables. A good table will teach you more in one evening than a month of forum threads.

New to all of this? Start with [How to Play Your First EchoQuest Adventure](/blog/how-to-play-your-first-echoquest-adventure-beginners-guide).

**[Learn RPGs by playing, free →](/library)**
`,
  },
  {
    publishAt: "2026-10-21",
    title: "Game Master Tips: How to Pace a Session Like a Pro",
    excerpt: "Game Master pacing tips you can use tonight: scene questions, clocks, shorter fights and better cliffhangers, plus how EchoQuest's AI GM keeps scenes moving.",
    content: `# Game Master Tips: How to Pace a Session Like a Pro

Ask players why one session still gets retold years later while another was forgotten by Tuesday. Hardly anyone brings up the rules, and the lore barely gets a mention. They talk about how it *felt*: the knot in the stomach during the rooftop chase, or the laugh that cracked the whole table open after a dreadful pun. Most of that feeling comes down to **pacing**. And here's the cheerful part. Pacing isn't some gift a lucky few GMs are born with. You can learn it, the same way you once learned the grapple rules.

I've spent a slightly embarrassing amount of time thinking about tempo while building EchoQuest, because its Game Master is an AI that narrates every scene aloud. A slow scene on paper is a nuisance. A slow scene read out loud, at you, is a small form of torture. So these **Game Master tips** come from tabletop craft, filtered through the odd job of teaching that craft to a machine. Use them at a kitchen table full of friends. Use them too if you're writing a campaign for an AI Game Master, which can't see anybody yawning and needs the rules spelled out.

## 1. Frame Every Scene With a Question

Every scene should exist to answer one question. A few examples:

- *Will they convince the smuggler to take them across?*
- *Can they escape the burning archive?*
- *Who is the stranger at the funeral?*

Once the question has its answer, the scene is over. **Cut to the next one.** A scene that limps on after its question is settled drains the energy out of a room faster than anything else I know. Ever sat through ten minutes of haggling over rope after the plot had already moved on? Then you've felt it.

There's a handy side effect, too. If you can't name a scene's question, you probably don't need that scene at all.

## 2. Start Late, Leave Early

This one's pinched from screenwriting. William Goldman, who wrote *Butch Cassidy and the Sundance Kid*, put it bluntly: ["You always attack a movie scene as late as you possibly can."](https://gointothestory.blcklst.com/when-should-i-enter-and-exit-a-scene-acdefa218cbb/) So enter a scene as close to the interesting moment as you can manage, and get out the instant it's done.

- Don't narrate the whole walk to the tavern. Open with the players *already at the table* as the informant slides into the empty chair.
- Don't play out a goodbye to every NPC in town. Cut to the road.

Mike Shea, who writes as Sly Flourish, applies the same thinking to the first scene of the night and calls it a strong start. His favourite trick is blunt as well: ["Starting with a fight gets everyone right into the game."](https://slyflourish.com/starting_strong.html) I'd add that it beats twenty minutes of recap every time.

## 3. Alternate Tension and Release

Nonstop action wears players out, and nonstop calm sends them to sleep. So swing between the two:

1. **Tension:** a chase, a fight, a negotiation where nobody trusts anybody, a lock being picked while footsteps get closer
2. **Release:** a campfire chat, a hot meal, a quiet discovery, a joke between old friends
3. **Rising tension:** a new threat appears
4. **Climax:** the big confrontation
5. **Release:** consequences and reflection

Robin D. Laws wrote a whole book about this swing. [*Hamlet's Hit Points*](https://gameplaywright.net/books/hamlets-hit-points/) sorts stories into beats and tracks "their ups and downs from hope to fear and back", with *Hamlet* plus two films, *Casablanca* and *Dr. No*, as its worked examples. It's a useful lens at the table, honestly. If the last several beats all pushed fear up, your players are overdue a win.

Quiet scenes are where characters actually grow, so please don't skip them. Just keep them short.

## 4. Use Clocks and Deadlines

A deadline creates urgency without railroading anyone:

- "The ship sails at dawn."
- "The ritual completes at the third bell."
- "The guard shift changes in ten minutes."

A clock players can see lets them weigh real trade-offs. Search the study properly, or make the ship? John Harper's *Blades in the Dark* turned this into something you can literally draw. Its [progress clock](https://bladesinthedark.com/progress-clocks) is a circle cut into segments (four for a complex obstacle, eight for a daunting one), and the GM ticks segments off as trouble closes in. The rules even suggest racing clocks, where the crew's "Escape" fills up against the constables' "Cornered". I adore that idea. You don't need the game to borrow it, either; a pie chart scribbled on an index card does the job.

Audio play has no index card, of course, so the clock has to live in the words. "Second bell. One more and the ritual's done." That line does the same work as the drawing.

## 5. Vary the Rhythm of Description

- **Fast scenes:** short sentences. Quick beats, with a sound effect or two.
- **Slow scenes:** longer, richer description that gives players time to breathe and notice things.

In audio play, rhythm matters even more. The speed of the narration and the gaps between lines do half the pacing work, and the ambient sound underneath does the rest. See [How Ambient Sound Design Elevates RPG Storytelling](/blog/how-ambient-sound-design-elevates-rpg-storytelling).

I learned this the hard way, because dead air is pacing too, just the wrong kind. At one point the browser narrator kept cutting off a few seconds into a scene, and nothing kills a tense moment like a voice that simply stops mid-sentence. Fixing that was only the start. Now narration begins speaking while the GM's reply is still being written, and the next premium-voice clip is fetched while the current one plays, so there's no awkward gap between one line and the next. Players never notice when that works. They notice right away when it doesn't.

## 6. Watch for Energy Drops

Signs that a scene is dragging:

- Players asking the same question twice
- Long silences that aren't the dramatic kind
- Side conversations (at a table), or one-word replies (in solo play)

When you spot one, reach for one of these levers:

- **Introduce a complication.** The rope frays, or a rival shows up early.
- **Cut to a new scene.** Nobody will miss the rest of this one.
- **Ask a direct question,** such as "What does your character want out of this conversation?"

That last lever is my favourite. A pointed question hands the spotlight back to the player, and most people answer it with more energy than they'd bring to "so, what now?"

## 7. Don't Let Combat Drag

Combat is where pacing most often goes to die. Keep it moving:

- **Describe outcomes vividly** so each turn feels like it counted
- **Let enemies flee or surrender** once the outcome is clear
- **Change the battlefield:** the fire spreads to the rafters, the floor gives way, more goblins pour in, the tide starts coming up
- **End early:** once the result is certain, narrate the rest

I tripped over this one in EchoQuest. A skill check used to need a whole extra exchange before you found out if your blade landed, and it sucked the momentum right out of a fight. These days skill checks resolve in the same turn, so you hear the result straight away. Losing a fight doesn't stall the story, either. Drop to 0 HP and the GM narrates a real setback instead of grinding everything to a halt. Maybe you're captured, or maybe you wake hours later with a price to pay.

## 8. End on a Hook

End each session on something that makes players itch to come back:

- A **revelation:** "The letter is signed in your father's hand."
- A **threat:** "Hoofbeats on the road behind you, a lot of them."
- A **choice:** "The prince offers you a place on his council, starting tomorrow."

Shea has a sneaky variation for ongoing campaigns: stop the session [right before a big battle](https://slyflourish.com/starting_strong.html). As he puts it, "it builds Suspense", and as a bonus you already know exactly how next week opens. What's the best cliffhanger a GM ever left you on? I bet you still remember it.

## How EchoQuest's AI GM Handles Pacing

When I rewrote EchoQuest's GM to talk like a human Game Master, pacing was the thing I fussed over most, and a good chunk of this list went straight into its instructions. Here's how it actually works:

- **Every scene builds.** The GM opens on one concrete sensory detail, tightens things with a complication (or a detail that doesn't fit and keeps nagging), then lands on a hook.
- **Pace follows the moment.** A sword swing gets two quick sentences. A reveal or a new place gets room to breathe.
- **No padding.** Four short paragraphs is the ceiling, and most scenes need fewer. The GM also stops on the hook instead of summing up or moralising, which is "leave early" in practice.
- **One direct question closes each scene,** and it changes from scene to scene ("Do you trust her?", "Left tunnel or right?"). The choices aren't listed in the prose, because the game reads them out separately once the narrator has finished.

That closing question has a pedigree, by the way. Dungeon World's GM rules say ["Whenever you make a move, end with 'What do you do?'"](https://www.darkshire.net/jhkim/rpg/srd/dungeonworld/12-GM_Rules.html), and I think it's one of the best single rules a GM can follow. I didn't hard-code tension and release, though. Instead, the world's tone shapes it, so a horror world gets slow dread and a cinematic one gets dramatic pacing with emotional beats.

You can steer the tempo yourself, too. Type or say "let's skip ahead to the city", or "slow down, I want to explore this". The suggested choices are only suggestions, and the GM is told to follow your lead rather than herd you back onto its own path. On the listening side, Space or P pauses the narrator and R replays the last stretch of narration. If a scene drags or races, the [ and ] keys nudge the speech speed. Read more in [Behind the GM: How We Prompt Claude to Run Your Adventures](/blog/behind-the-gm-how-we-prompt-claude-to-run-your-adventures).

## Quick Pacing Checklist

Copy this onto a sticky note and slap it inside your GM screen:

- [ ] Does every scene have a question?
- [ ] Am I starting late and leaving early?
- [ ] Have I alternated tension and release?
- [ ] Is there a clock or deadline?
- [ ] Is combat ending when the outcome is clear?
- [ ] Will the session end on a hook?

**[Try a well-paced adventure →](/library)**
`,
  },
  {
    publishAt: "2026-10-22",
    title: "Learn English With RPGs: How Interactive Stories Build Language Skills",
    excerpt: "Can RPGs help you learn English? What the research says, and how to use an audio RPG for listening, vocabulary and speaking practice.",
    content: `# Learn English With RPGs: How Interactive Stories Build Language Skills

Language learners tend to hit the same wall. Textbooks hand you grammar and apps drill your vocabulary. Then a real conversation arrives, and it's quick and messy and goes places nobody rehearsed. Roleplaying games plug that gap better than you might expect. An interactive story gives you **listening practice that actually means something**, with new words arriving inside a living scene. It also hands you **a reason to open your mouth**, and there's no real person tapping their foot on the other end of the conversation.

I should be upfront about one thing before we start. I built EchoQuest as an audio-first RPG for blind and low-vision players, and it's not a language course. There's no grammar module, and nothing scores your accent. Still, the features that make it work without a screen (slowable narration and voice input, for instance) happen to be the ones a learner reaches for anyway. So here's how to **learn English with RPGs**, with an honest look at the research along the way.

## Why RPGs Work for Language Learning

### Comprehensible Input

Language researchers keep coming back to **comprehensible input**. The idea comes from Stephen Krashen, who argued in his 1982 book that [we acquire a language when we understand messages containing structure "a little beyond" where we are now](https://sdkrashen.com/content/books/principles_and_practice.pdf), and that we lean on context and knowledge of the world to fill in the rest. RPG narration is pretty much built that way. In a crowded market or a tense negotiation, the situation itself helps you work out what the unfamiliar words must mean.

A fair warning, though. Krashen's version drew plenty of fire. In a review forty years on, Karen Lichtman and Bill VanPatten note that his "i + 1" was never pinned down well enough to test. Even so, they argue that [a central role for meaningful, communicative input now runs through every major theory of second language acquisition](https://doi.org/10.1111/flan.12552). The same paper mentions a handy rule of thumb from vocabulary research: you get the most out of a text when you already know roughly 95 to 98 percent of its words. Keep that number in mind for the speed tips below.

### Motivation

You want to know what happens next. Honestly, that pull is the whole trick, because it keeps you listening far longer than any textbook dialogue about booking a hotel room.

There's some evidence that gaming habits and English skills travel together. A Swedish study of 86 children aged 11 to 12 found that [frequent gamers (five or more hours a week) outscored moderate gamers, who in turn outscored non-gamers](https://eric.ed.gov/?id=EJ985862) on English tests of reading, listening and vocabulary. Still, it's a correlation, and the authors are careful about it. They allow that some of the kids (the boys in particular) may have been stronger in English before they ever played, and gamed more for that very reason. So treat it as an encouraging hint, not proof.

### Active Use

Audiobooks and films let you sit back. RPGs don't, since they need you to **respond**. You have to build sentences and ask questions, and nobody fills the gaps in for you. Merrill Swain's output hypothesis argued that producing language matters too, and Lichtman and VanPatten sum up her original claim as output helping learning "sometimes, under some conditions". That's a modest promise, and I think it's the honest one.

### Low Anxiety

Speaking a new language in front of people is nerve-racking, and researchers have studied that for decades. Elaine Horwitz and her colleagues described [foreign language classroom anxiety](https://onlinelibrary.wiley.com/doi/10.1111/j.1540-4781.1986.tb05256.x) back in 1986 and tied it to things like fear of being judged. Krashen, for his part, wrote that low anxiety "appears to be conducive to second language acquisition".

An AI Game Master never smirks at a mistake, and it never drums its fingers while you hunt for a word. You can replay a scene and have another go as often as you like. Have you ever frozen mid-sentence because someone was waiting? Here, nobody is.

## Skills You Practise in an Audio RPG

| Skill | How it's practised |
| --- | --- |
| Listening | Narrated scenes at a speed you choose, from half speed to double |
| Vocabulary | New words in vivid context: "the rusty *portcullis* groans open" |
| Reading | The narration appears on screen as text while it's read aloud |
| Writing | Typing your character's actions and dialogue |
| Speaking | Voice input: saying your actions aloud (recognition is set to US English) |
| Pragmatics | Polite persuasion and haggling with NPCs who have opinions of their own |

One caveat on that table. A 2022 meta-analysis by Daniel Dixon, Tülay Dixon and Eric Jordan pooled studies of publicly available games and found [a small to medium positive effect on second language learning](https://hdl.handle.net/10125/73464) when gamers were compared against other groups. Most of those studies measured vocabulary, though. Listening, speaking and the rest came up too rarely to compare. So the evidence is thickest for words, and the other rows are reasonable bets rather than settled science.

## How to Use EchoQuest for English Practice

### 1. Adjust the Narration Speed

Start slower than native speed. You'll find the narration speed in the audio settings, where it runs from half speed to double, and during play the [ and ] keys nudge it down or up a notch. Speed up as you improve.

A small build story here. Early on, the premium voices changed pitch whenever the playback speed changed, which could turn a gruff voice into a cartoon. I made the pitch hold steady at any speed, so a slowed-down voice still sounds like a person rather than a record player running out of power.

### 2. Read Along, Then Listen Only

Begin by reading the text while you listen, since the narration shows up on screen as it's spoken (and there's a large-text setting if you need it). Once that feels comfortable, look away or close your eyes and listen only. I'd suggest doing that one scene at a time, not one session at a time.

### 3. Replay Difficult Passages

Press R to replay the last narration as many times as you need. There's no clock running, and the game won't move on until you act. The Dixon meta-analysis mentions that single-player games let you pause, and that this kind of time control has been "recognized as useful" for learners, even if the research on it is still thin.

### 4. Ask the Game Master for Help

There's no dictionary button and no tutor mode, and I won't pretend otherwise. But the Game Master reads anything you type or say, so you can simply ask about the story:

- "What does 'portcullis' mean?"
- "Can you describe that again more simply?"
- "Summarise what just happened."

Remember that it's a storyteller first. It may answer inside the story rather than like a teacher, and each request uses a turn like any other action. For a quick reminder that doesn't use a turn, press L to hear where you are, or S for your character's health and location.

### 5. Speak Your Actions

Press V and say what your character does. It's low-stakes speaking practice, and you'll soon notice which words come out muddy. When you finish speaking, EchoQuest shows what it heard (and announces it to screen readers), then waits about three and a half seconds before sending it, so you can cancel a mishearing. I added that confirmation because speech recognition gets things wrong, and "attack the lizard" is a very different turn from "attack the wizard". For a learner, the readback doubles as a rough mirror. Keep in mind that recognition is set to US English, though, so a perfectly good British or Indian accent may trip it up now and then. Treat a mishearing as a hint, never a verdict on your pronunciation.

### 6. Keep a Vocabulary Journal

After each session, jot down five new words along with the sentence you heard each one in. The sentence matters more than the definition, because it carries the context that made the word make sense.

### 7. Choose Genres You Love

Vocabulary shifts a lot from genre to genre. Fantasy teaches you castles and archaic phrasing. Noir hands you slang and city life, while sci-fi loads you up on technology. EchoQuest's library leans on that variety. Saltbound is full of sailing words like brigantine and quarterdeck, Neon Precinct is cyberpunk noir in a rain-soaked megacity, and The Long Watch is hard science fiction aboard a generation ship. Pick whatever motivates you, then switch now and then to stretch your range.

One more tip. The voice picker in settings lists every voice your browser offers, with its language code, so depending on your device you may find a British or Australian English voice to swap in for a change of accent.

## A Sample Exchange

Here's the kind of back-and-forth you might get in a market scene:

> **Narrator:** "The merchant squints at you. 'Twenty silver for the lantern, and not a coin less.'"
>
> **You:** "I tell him twenty is too expensive and offer twelve."
>
> **Narrator:** "He laughs. 'Twelve? You'd rob an honest man. Fifteen, and I'll throw in the oil.'"

In one short exchange you practised listening, numbers and haggling, plus the gentle art of disagreeing politely. When I rewrote the GM to talk like a human Game Master, I told it that NPCs hold strong opinions and dodge questions when it suits them. That makes them a little prickly, which is exactly what you want from a haggling partner. I also told it to pick specific, unexpected words that still make sense on first hearing, because everything is spoken aloud. That instruction was written for blind players, but it lines up rather neatly with Krashen's "a little beyond".

## Tips for Teachers

- Run short **one-shot adventures** in class, with students deciding actions together. The free tier gives you 60 AI turns a day, which is plenty for a lesson
- Set **listening homework**: play one chapter, then summarise it
- Practise **role vocabulary**: merchant, guard, captain, witness
- Encourage **speaking in character**. A character works like a mask, and it's easier to fumble a sentence when it's the nervous smuggler fumbling rather than you

Your part matters here, too. In the Dixon meta-analysis, gains were roughly twice as large when teachers added supplementary material around the game, although the confidence intervals overlapped. That's promising rather than proven, but a vocabulary sheet and a five-minute debrief cost you very little.

## Beyond English

EchoQuest narrates in English, so it's English practice first. Still, it isn't only for learners. Native speakers can use it to build vocabulary or listening stamina, and listening-based stories help people with reading difficulties such as dyslexia enjoy rich stories without facing a wall of text. As speech-language pathologist Joanne Marttila Pierson puts it, [text-to-speech support "simply levels the playing field"](https://dyslexiahelp.umich.edu/ask-dr-pierson/keep-em-reading/) for dyslexic students. I built the game for ears first, and it's lovely to see that help more people than I planned for.

## Start Learning Through Play

Pick a world and slow the narration down. Then start your first adventure in English. Which genre are you going to learn your new words from?

**[Practise English with a free adventure →](/library)**
`,
  },
  {
    publishAt: "2026-10-23",
    title: "Post-Apocalyptic RPG Campaign Guide: Survival Stories That Stick",
    excerpt: "Plan a post-apocalyptic RPG campaign with real stakes: pick your apocalypse, keep survival light, build settlements and factions, plus 8 wasteland plot hooks.",
    content: `# Post-Apocalyptic RPG Campaign Guide: Survival Stories That Stick

The world ended. Now what? Post-apocalyptic stories take away everything we lean on without thinking, from supermarkets to the water in the tap. Then they ask what people will do to survive, and what they'll refuse to do even then. That second question is the good one. It's why I think this is one of the richest genres in roleplaying, packed with hard choices and small, stubborn victories.

This guide walks through building a **post-apocalyptic RPG campaign** with real stakes and stories that stick. I'll lean on a few books and games that do it brilliantly, and on a couple of things I learned while building EchoQuest, an RPG you play entirely by ear.

## Step 1: Choose Your Apocalypse

The cause shapes everything that follows:

| Apocalypse | Tone | Key threats |
| --- | --- | --- |
| Nuclear war | Grim, radioactive | Radiation, raiders, scarcity |
| Pandemic | Quiet, eerie | Infection, paranoia, abandoned cities |
| Climate collapse | Slow, desperate | Heat, flooding, migration |
| Supernatural | Weird, horror | Monsters, curses, the unknown |
| Machine uprising | Tense, hunted | Drones, surveillance, betrayal |
| Mysterious event | Uncanny | Unknown rules, strange phenomena |

Don't feel you have to explain that last one, by the way. Cormac McCarthy never tells you what happened in *The Road*, where [a father and son struggle to survive after a disaster that's left unspecified](https://www.britannica.com/topic/The-Road-novel-by-McCarthy), and the book won the Pulitzer Prize for Fiction anyway. Mystery about the cause keeps the focus on the people.

Next, decide **how long ago** it happened. One week after is chaos and grief. Fifty years after, new cultures have grown up on the ruins. Push it further still and the apocalypse turns into archaeology. In Crimson Sands, one of the worlds in EchoQuest's library, a whole civilization vanished two thousand years ago in a single night, and the people digging it up now can't agree on whether the dead should stay buried. So how far back does your catastrophe sit?

## Step 2: Make Survival Matter (But Not Tedious)

Survival mechanics add stakes, but they can sink into bookkeeping fast. Keep them light:

- **Track a few key resources:** food, water, fuel, medicine, ammunition
- **Use them to create choices**, not chores: "You have enough fuel to reach the city or the coast, not both."
- **Abstract daily needs** unless they're dramatically relevant

In AI-run games, let the Game Master track resources as part of game state and bring them up when they matter. That's how EchoQuest works, anyway. Your inventory keeps real quantities, so three cans of fuel are three cans, and the GM adds or removes them as the story uses them. If you write your own world, you can make a resource rule part of it too, because the GM treats a world's rules as the source of truth. The Long Watch, a hard sci-fi world in the library, does exactly this with power. Its rules say every action has a power and time cost, and the crew notices waste. Swap "power" for "clean water" and you've got a wasteland.

Getting hurt should cost something, too. In EchoQuest, dropping to 0 HP means a real setback, so you might be captured or robbed, or you might wake hours later with a price to pay. In a world this harsh, that fits better than a reload screen.

## Step 3: Build Settlements as Characters

Settlements are the emotional heart of post-apocalyptic stories. For each one, decide:

- **Who leads it**, and how they got that power
- **What it has** that others want (water, a doctor, walls, seeds)
- **What it lacks**
- **Its rule**, the one law everybody follows
- **Its secret**

A settlement worth protecting gives players something to fight for beyond their own skins. Free League's *Mutant: Year Zero* built a whole game around that idea. Its home base, the Ark, is described as ["a nest of intrigue and Lord of the Flies-style power struggles"](https://freeleaguepublishing.com/games/mutant-year-zero/), far from a safe haven, and players improve it across four areas (Food Supply, Culture, Technology and Warfare) by picking which projects to take on. I love that, because every project is also an argument about what kind of place the Ark should become.

## Step 4: Create Factions With Competing Visions

The apocalypse is also a question: **what should come next?** Factions answer it differently:

- **The Restorers:** rebuild the old world exactly as it was
- **The Raiders:** take what you can while you can
- **The Faithful:** the end was a judgement, and a new faith rises
- **The Traders:** commerce will save us, so keep the roads open
- **The Isolationists:** trust no one, close the gates

Players choose who to side with, and those choices define the new world.

EchoQuest's prebuilt worlds use several of these shapes, as it happens. In The Shattered Reaches, an ancient cataclysm broke a continent into floating islands, and survivors hang on in crumbling city-states. The Thornkin tribes there are textbook isolationists: they attack first if threatened, yet they'll trade fairly if you approach in peace. Meanwhile a group of scholars called the Conclave of Dust believes the catastrophe was deliberate and wants to repeat it "correctly". Over in Crimson Sands, a young Preserver believes the old empire's collapse was divine judgement. The world's notes are clear that she isn't a villain, just someone with real insight and real fear. That's the trick, honestly. A faction with a point is far scarier than one that's simply evil.

## Step 5: Find Hope

The best post-apocalyptic stories aren't only bleak. They're about **hope in hard places**. Think of a school in a bunker, or a rooftop garden. Or a radio station playing music into the silence, night after night. Give players things to protect and small victories to win.

Emily St. John Mandel's *Station Eleven* might be the finest example. After a flu wipes out most of humanity, a troupe called the Traveling Symphony moves between small settlements around the Great Lakes, performing Shakespeare and classical music. Painted on one of their caravans is the motto ["Because survival is insufficient."](https://www.britannica.com/topic/Station-Eleven) I can't think of a better brief for a GM running this genre. Survival is the floor, and the story lives in whatever your players decide is worth more.

## Step 6: Use Sound to Build the Wasteland

In audio-first play, sound carries the setting:

- Wind across empty highways
- A Geiger counter ticking faster
- A distant engine, when engines are rare
- A radio crackling with a voice that shouldn't be there
- Silence in a city that used to roar

That Geiger counter works so well because it's real information turned into sound. As the National MagLab explains, [the number of clicks per second tells you how intense the radiation is](https://nationalmaglab.org/magnet-academy/history-of-electricity-magnetism/museum/geiger-counter-1908/). Faster clicking means you should leave. Players get that without a word of explanation.

EchoQuest layers ambient sound beneath the narration, which makes the wasteland feel vast and lonely. I'll admit there's no Geiger counter in my sound library, so the narrator has to carry that one. Even so, a location described as a wasteland or a sea of dunes picks up the desert bed on its own, and a storm gets the storm track. I also made the ambience duck under sound cues, so a "danger near" sting cuts through the wind instead of drowning in it.

Silence taught me the most, though. I once found the ambient soundtrack quietly ratcheting itself down to nothing after about five turns. Nobody had chosen that silence, so it didn't feel eerie. It just felt broken. That's the lesson I'd pass on to any GM: a silent city only works when the players can tell you meant it, so say so out loud. "The wind drops. For the first time in days, you hear nothing at all." Then let it sit for a beat before anyone speaks.

## 8 Post-Apocalyptic Plot Hooks

1. **The Last Broadcast:** a radio station is still transmitting from the capital, with a message on loop: "Safe zone. Come home."
2. **Seed Vault:** rumours of a vault of pre-collapse seeds, and every faction wants it. This one has a real-world twin. The [Svalbard Global Seed Vault](https://www.croptrust.org/what-we-do/programs/svalbard-global-seed-vault/) sits inside an Arctic mountain halfway between mainland Norway and the North Pole and holds more than 1.4 million seed samples at −18 °C. When conflict closed ICARDA's genebank in Syria, the research centre withdrew its backup seeds from Svalbard and rebuilt its collections in Lebanon and Morocco. Steal that for your campaign, please.
3. **The Doctor's Price:** the only doctor for a hundred miles will treat your friend, in exchange for a favour.
4. **Water War:** two settlements share one well, and it's running dry.
5. **The Convoy:** escort a fuel convoy across raider territory.
6. **Old World Ghost:** a pre-collapse AI in a bunker offers help, and wants to be let out.
7. **The Children's Settlement:** a town run entirely by kids who survived alone. Adults aren't welcome.
8. **First Election:** the settlement is holding its first vote since the collapse. Someone wants it to fail.

## Playing Post-Apocalypse Solo

Survival stories suit solo play naturally. Think of the lone wanderer, or a small band on a long road. *The Road* is basically a two-person campaign, after all. With an AI Game Master, ask for a companion. A dog works, or a wary fellow survivor, or a kid if you want your heart properly broken. Then let that relationship carry the story. EchoQuest keeps a running standing with every named NPC, from sworn enemy to loyal ally, so the trust you build with a scavenger who shares her water actually sticks. On the Storyteller plan, your companion also gets a premium voice of their own instead of the narrator's.

If you haven't played solo before, read [How to Play D&D Solo With an AI Dungeon Master](/blog/how-to-play-dd-solo-with-an-ai-dungeon-master). The same principles apply to any genre.

## Build Your Wasteland

Choose an apocalypse and a settlement worth saving, then find a road to walk. There's no dedicated post-apocalyptic world in the library yet, so the closest ready-made trips are The Shattered Reaches and Crimson Sands. If you want the full wasteland, the Storyteller plan gives you one private world. The World Builder Wizard even lists post-apocalyptic among its example genres, or you can upload a Game Bible as a PDF, DOCX, TXT, MD or JSON file. What would your settlement's one law be?

The end of the world is only the beginning.

**[Start your survival story →](/library)**
`,
  },
];
