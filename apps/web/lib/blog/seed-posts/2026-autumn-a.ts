import type { ScheduledSeedPost } from "./types";

// Autumn 2026 daily series, part A: 24 Sep – 3 Oct.
export const AUTUMN_2026_A: ScheduledSeedPost[] = [
  {
    publishAt: "2026-09-24",
    title: "Best AI Dungeon Alternatives in 2026: What to Look For in an AI RPG",
    excerpt: "Shopping for an AI Dungeon alternative? Here are the questions I'd put to any AI RPG on state, memory, voice, accessibility and price, and where EchoQuest fits.",
    content: `# Best AI Dungeon Alternatives in 2026: What to Look For in an AI RPG

AI Dungeon showed millions of people that a language model could make up a story right alongside them. It started small, too. Nick Walton built the first version during a hackathon at Brigham Young University in 2019, and after the December 2019 relaunch [over 100,000 people played it in a single week](https://en.wikipedia.org/wiki/AI_Dungeon). Since then the field has sprawled in every direction. These days you'll find AI storytelling apps and AI roleplay chatbots. There are AI-assisted visual novels too, plus AI Game Masters that run proper campaigns with rules underneath. So if you're hunting for an **AI Dungeon alternative**, what you're really asking is which of these categories fits the way you like to play.

I'm going to skip the usual "top 10" list. Partly that's because those lists go stale within months. Partly it's because I built one of the contenders, and you'd be right to raise an eyebrow at my rankings. Instead, I'll hand you the questions I think separate a good AI RPG from a chatbot in costume, and then I'll tell you plainly where EchoQuest fits. Fair warning: I have opinions.

## 1. Does It Track Real Game State?

For me, this is the biggest dividing line between AI RPGs: does anything sit underneath the prose? A pure text generator will cheerfully let you lose the same sword three times. It'll also heal you from zero hit points by accident, or forget that the duke died two scenes ago.

A proper AI RPG keeps a **structured game state** next to the story: hit points, inventory, conditions, quest flags, faction reputation, location and time. The model narrates, but the state is the source of truth. So when you ask "what's in my pack?", the answer comes from real data and not from the model's best guess.

Real state brings real headaches, though, and I learned that the hard way. Back in May, a turn in EchoQuest that errored halfway through could leave half-applied changes behind. Say, gold gone from your purse with no sword in your pack to show for it. As a result, I added a full rollback, so a turn either lands completely or not at all. Single-step undo arrived in the same stretch (press U), along with auto-save every five turns and a manual Save button.

**What to test:** pick up a distinctive item early, then ask about it twenty turns later. If it's vanished or quietly changed shape, the app isn't tracking state.

## 2. How Good Is Its Memory?

Long campaigns need long memory. Look for an app that summarises earlier events and remembers named NPCs, then brings back the consequences of your choices. The best AI Game Masters dredge up threads you'd long forgotten, like the smuggler you spared in the first hour turning up again in the finale.

To be fair to AI Dungeon, it takes this seriously. Its own help pages describe a [Memory System](https://help.aidungeon.com/faq/the-memory-system) that keeps a running Story Summary, refreshed every 15 actions, and stores short summaries of every six actions in a Memory Bank, pulling back whichever ones match the current scene. So a "memory" feature on a spec sheet won't settle much by itself these days. Test it in a long game instead.

In EchoQuest, once enough turns pile up, a smaller and quicker Claude model folds each batch of ten turns into a compact factual summary that the GM reads on every turn. Honestly, that part bit me too. On October 2 I found that once a game passed a certain length, every turn re-summarised turns 1 to 10 and never got any further. Games that weren't saved on the server had a different problem: they simply forgot their oldest turns once the history filled up. Both are fixed now, but I'd never have caught them without playing long sessions myself. That's my advice to you as well.

## 3. Is There a Game Master or Just a Narrator?

A narrator describes things. A Game Master **runs a game**. That means pacing scenes and asking for rolls when the outcome is genuinely uncertain. It also means handing out consequences with teeth and steering toward a satisfying climax instead of wandering forever. If every session with an app feels like an endless middle, you're talking to a narrator.

EchoQuest's GM, powered by Claude, is prompted specifically to act as a Game Master. It respects the world's rules and keeps its NPCs consistent from one scene to the next. It also builds toward story beats on purpose. When you try something risky, it can't just decide you succeed, either. The server rolls a d20, adds your stat modifier and compares the total against a difficulty number, and since October 2 the GM narrates that result in the same turn. That same day I also rewrote its instructions so it talks like a seasoned human GM leaning over the screen instead of reciting like a manual. You can read how all of that fits together in [How Claude AI Powers the EchoQuest Game Master](/blog/how-claude-ai-powers-the-echoquest-game-master).

## 4. Can You Listen Instead of Read?

Most AI story apps are walls of text. That works at a desk. On a phone, however, it gets tiring quickly, and for many blind or low-vision players an unspoken wall of text is a locked door. An **audio-first** AI RPG narrates every scene aloud and takes voice input, so you can play with the screen switched off.

That's what EchoQuest was built around. Every scene is spoken. Free players get browser text-to-speech, and Storyteller subscribers get expressive ElevenLabs narration with distinct NPC voices.

I won't pretend audio is easy, mind you. More of my bug-hunting has gone into sound than into anything else. In May, Chrome's built-in voice would cut off after roughly 15 seconds, so I had to engineer around it. Later that month, raw JSON leaked into the spoken narration. Have you ever had a narrator solemnly read you a curly brace? I have, and it kills the mood instantly. These days the narration starts speaking while the GM's reply is still being written, so you're not left sitting in silence.

## 5. Is It Genuinely Accessible?

"Accessible" gets thrown around loosely. Here's a practical checklist:

- Every control has a proper label for screen readers (NVDA, JAWS, VoiceOver, TalkBack)
- The whole game works with a keyboard alone, with a visible focus indicator. The W3C's guidelines make keyboard operation a [Level A requirement](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), the most basic tier there is
- New narration is announced through live regions, not just shown visually. WCAG calls these [status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): updates should reach assistive technology without stealing focus or interrupting you
- You can adjust speech rate, text size, contrast and motion

If an app fails any of these, a large share of players simply can't use it. EchoQuest was designed accessibility-first, and an automated Playwright and axe suite now checks the web app in CI. Still, the bugs that taught me the most were about timing, which no checker catches. On May 16 I realised the choices were being announced and focused while the narrator was still talking, so screen reader users got two voices at once. Now the choices wait their turn. I also made HP and inventory changes announce themselves, since losing six hit points in silence is miserable when you can't glance at a health bar. See [Why Audio-First Gaming Is a Revolution for Blind Players](/blog/why-audio-first-gaming-is-a-revolution-for-blind-players) for the reasoning behind all this.

## 6. Can You Bring Your Own World?

Prebuilt adventures are great for getting started. Before long, though, most players want to play in *their* setting. Maybe that's a homebrew D&D world or the novel they've been chipping away at for years. Some people just want a genre nobody else bothers to cover. Look for an app that lets you upload your lore and rules (characters included), and then check that the AI actually respects them.

In EchoQuest you do this with a **Game Bible** (a structured world document you upload as PDF, DOCX, TXT, MD or JSON) or with the step-by-step **World Builder Wizard**. If the Bible defines its own classes, or its own way of rolling stats, the GM is told to follow those instead of falling back on generic fantasy defaults.

## 7. Is the Pricing Honest?

AI costs real money to run, so every serious AI RPG charges somewhere. What matters is transparency. Look for a real free tier with clear limits. And walk away from dark patterns. The US Federal Trade Commission's 2022 report on the subject listed [making it hard to cancel subscriptions and burying key terms and junk fees](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers) among the most common tricks, so those are exactly the things I'd check. EchoQuest's pricing is simple:

- **Free:** three prebuilt campaigns, browser narration, 60 AI turns per day (one turn uses one minute of credit), full accessibility support, and extra AI minutes you can buy whenever you like
- **Storyteller ($15/month or $129/year):** unlimited turns, no ads, premium ElevenLabs narration with distinct NPC voices, and one private world built with the World Builder Wizard or a Game Bible upload
- **Creator ($29/month or $239/year):** everything in Storyteller, plus publishing your worlds to the library and creator analytics

The free tier does show ads between sessions, and I'd rather say so here than have you discover it.

## Quick Comparison: Types of AI Dungeon Alternatives

Treat these as broad categories, not verdicts on any single app. Plenty of products blend two of them, and they change fast.

| Type | Strengths | Weaknesses |
| --- | --- | --- |
| Freeform AI story generators | Maximum creative freedom | Little structure, memory that varies a lot, few or no rules |
| AI character chat apps | Great for one-on-one roleplay | Rarely handle combat, inventory or plot arcs |
| AI visual novels | Pretty presentation | Limited agency, often awkward with a screen reader |
| AI Game Master platforms (like EchoQuest) | Real game state, pacing, voice narration | Less anything-goes than a raw generator |

## Who Should Try EchoQuest?

EchoQuest is a strong fit if you want:

- A campaign with **stakes and structure**, not just improvised prose
- To **listen** to your adventure on a commute, while cooking, or with your eyes closed
- A game that works fully with a **screen reader or keyboard**
- To run adventures in **your own world**

On the other hand, if you just want to write fiction with an AI co-author and no rules at all, a freeform generator will probably suit you better. I mean that. Different tools suit different players, and I'd rather you find the right one than force the wrong one.

## Try It Free

Reading comparisons only gets you so far, so play. Pick a campaign from the library and make a character in under a minute. Then see whether a real Game Master, with dice and a memory behind it, changes how AI storytelling feels to you. What's the first thing you'd try?

**[Browse the Adventure Library →](/library)**
`,
  },
  {
    publishAt: "2026-09-25",
    title: "Audio Games for Blind People: 10 Genres You Can Play Entirely by Ear",
    excerpt: "Ten genres of audio games that blind and visually impaired players can enjoy by sound alone, with real examples, what makes each one work, and where to start.",
    content: `# Audio Games for Blind People: 10 Genres You Can Play Entirely by Ear

Audio games are games you can play entirely through sound. They've been around for decades, mostly built by small teams and passionate blind developers, and lately the big studios have started taking accessibility seriously as well. If you're blind or visually impaired, or you're helping someone who is, this guide walks through the main genres of **audio games for blind people**. For each one I'll explain what makes it work, name a real example where I can, and help you pick a starting point.

A quick word on why I care. I build EchoQuest, an audio-first RPG, so I spend an unreasonable share of my days listening to game audio with my eyes shut. That habit has made me picky. So consider this list a tour from someone who has broken plenty of audio himself and had to fix it.

## What Makes a Game Truly "Audio-Accessible"?

A game is audio-accessible when every scrap of information you need reaches you through sound or a screen reader. In practice that means:

- **Spoken or screen-reader-readable text** for menus, dialogue and status
- **Spatial audio cues** (left/right panning, distance, pitch) for position and movement
- **Distinct sound signatures** for different objects, enemies and events
- **No timed visual-only prompts**, such as quick-time events you can only see

Keep these in mind as you read. They're the difference between a game that's "technically playable" and one that's genuinely fun.

I'd add a fifth rule from my own scars: sounds must not trample each other. Back in May I caught EchoQuest announcing and focusing the choices while the narrator was still mid-sentence, so screen reader users got two voices talking over each other. Everything was technically "accessible", and it was still a mess. The choices wait for the narrator now. Similarly, I made the ambient soundtrack duck under sound cues, and I drop duplicate cues that fire within 80 milliseconds of each other, because a doubled chime sounds like two events when there was only one.

## 1. Audio RPGs and Interactive Stories

Narrative games are a natural fit, since people told stories aloud long before anyone wrote them down. Modern **AI audio RPGs** go further than classic branching stories, too: you can say anything you like and the Game Master answers.

EchoQuest is built for exactly this genre. Every scene is narrated aloud, you act by speaking or typing, and the interface is built for NVDA, JAWS, VoiceOver and TalkBack. There's no map to decipher and no visual puzzle to solve. The whole game lives inside the story. Still, I'll be honest about one rough patch. In September I found that the microphone was being blocked on my own pages, which meant voice input silently did nothing. That's fixed, and speech transcripts get shown to you for confirmation before they reach the GM, since speech recognition does mishear people.

If you'd like a hand-crafted audio story with action in it, look at [The Vale: Shadow of the Crown](https://afb.org/aw/22/12/17800) from Falling Squirrel. You play Alex, a blind princess, and the game was developed with the Canadian National Institute for the Blind. AccessWorld's reviewer praised it for "some of the best sound design and voice acting you will find in audio gaming."

## 2. Text Adventures and Interactive Fiction

Classic parser games, the "go north, take lamp" style, work beautifully with screen readers because they're pure text. Thousands of free titles exist across the interactive fiction community, and new ones arrive every autumn through [IFComp](https://ifcomp.org/about/comp), an annual competition that hobbyists started in 1995 and whose entries are freely available. The learning curve is the command syntax, which modern AI games remove by understanding plain language. For background, see [The History of Interactive Fiction](/blog/the-history-of-interactive-fiction-and-where-ai-takes-it-next).

## 3. Audio Action and Adventure Games

Games like *A Blind Legend* proved that binaural audio alone can carry a full action adventure. Made by the French studio DOWiNO with the Radio France station France Culture and released in 2015, it casts you as Edward Blake, a blind knight whose daughter Louise guides you by voice. You follow her, hear enemies circling, and swing your sword toward the sound. As [AccessWorld's review](https://afb.org/aw/17/3/15351) puts it, "Headphones or earbuds are a must when playing this game." Stereo positioning is how you aim.

## 4. Racing Games With Audio Assists

Racing sounds impossible without sight, doesn't it? Yet audio-cue systems that signal upcoming turns, braking points and track edges through pitched tones have made it happen. The biggest mainstream example is *Forza Motorsport*. Its [Blind Driving Assists](https://news.xbox.com/en-us/2023/04/27/forza-motorsport-accessibility-features-blind-driving/) tell you where you sit on the track and how you're progressing through each turn, and they were built with feedback from blind accessibility consultant Brandon Cole. Dedicated audio racing games, meanwhile, have existed in the community for years.

## 5. Card and Board Games

Poker, blackjack, solitaire, chess, Uno-style games and word games all translate well to screen readers, because their state is discrete and easy to announce. Plenty of online chess and card platforms support keyboard play and spoken board descriptions. Lichess is a good example. Its [Blind Mode](https://lichess.org/page/blind-mode-tutorial) works with NVDA, JAWS, VoiceOver and Orca, presents the board as a real HTML table you can walk square by square, and lets you type moves like "Nf3" straight into a box.

## 6. Puzzle and Word Games

Anagram games, trivia, screen-reader-friendly crosswords and audio memory games suit short sessions nicely. Word games in particular reward the sharp listening skills that many screen reader users have already built up over years.

## 7. Rhythm and Music Games

Rhythm games are sound-first by their very nature. The best accessible ones map notes to distinct pitches or stereo positions, so you play by ear instead of chasing a scrolling track with your eyes.

## 8. MUDs and Multiplayer Text Worlds

MUDs (multi-user dungeons) are online text worlds, and they go back a long way. Roy Trubshaw and Richard Bartle wrote [MUD1 at the University of Essex in 1978](https://en.wikipedia.org/wiki/MUD1), and plenty of MUDs are still running today. They're screen-reader friendly and deeply social, and many have sizeable blind player communities. Alter Aeon, for instance, calls itself ["blind-friendly for the visually impaired"](http://www.alteraeon.com/indexb.html) and is free to play. Expect a learning curve and a torrent of text, though.

## 9. Fighting Games

This one surprises people, but some fighting games have long been popular with blind players, because each character's moves make distinctive sounds. Back in 2017, Kotaku covered a Dutch player named Sven who [won a match at his first Street Fighter V tournament](https://kotaku.com/blind-player-racks-up-a-win-at-his-first-street-fighter-1793936241) playing by sound alone. "I play with a headset on so I can hear left and right what's going on," he explained. Newer releases add dedicated audio accessibility features that describe distance and positioning. *Street Fighter 6*, for one, worked with blind players through the Japanese organisation ePARA and added cues such as a [distance-to-opponent sound and high, mid and low attack sounds](https://caniplaythat.com/2023/05/05/street-fighter-6-takes-the-fight-to-blind-accessibility/). That review also flagged that the menus lacked narration at the time, which shows how far even good efforts can still have to go.

## 10. Strategy and Simulation

Turn-based strategy and management sims work when every unit, resource and map tile can be queried by keyboard and read aloud. Audio-first strategy games exist in the community, and some mainstream titles are slowly adding better screen reader support. Turn-based games are kinder here, honestly, because you can take all the time you need to listen.

## How to Choose Your First Audio Game

- **Want a story?** Start with an audio RPG or interactive fiction.
- **Want reflex challenges?** Try binaural action or rhythm games, and wear headphones.
- **Want something social?** Look at MUDs or accessible card games.
- **Short on time?** Word and puzzle games fit neatly into five-minute breaks.

## Tips for Getting Started

1. **Use good headphones.** Stereo matters enormously in spatial games.
2. **Adjust speech rate.** Lots of experienced screen reader users play at very high speeds, and games should let you choose. In EchoQuest, the [ and ] keys nudge the narration speed mid-scene. I also had to make sure premium voices keep their pitch when you speed them up, because early on they squeaked like chipmunks.
3. **Learn the shortcuts early.** Accessible games usually have a key that repeats the last message. In EchoQuest you can replay the latest narration at any time with R.
4. **Join a community.** Blind gaming forums and audio game communities are generous with recommendations, and they'll steer you toward hidden gems no store page will.

## Why This Matters

Gaming is social and cultural. It's a shared language for millions of people. When games are built sound-first, blind players get equal access to that culture instead of watching from the doorway. And it's simply good design, in my view. Audio-first games are excellent for sighted players too, if they want to rest their eyes or play on a commute, or just sink into a story without a screen glaring at them. Which genre are you going to try first?

**[Start an audio adventure for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-26",
    title: "How to Play D&D Solo With an AI Dungeon Master",
    excerpt: "No group? No problem. Learn how to play D&D-style adventures solo with an AI Dungeon Master: setup, character creation, pacing, and tips for better sessions.",
    content: `# How to Play D&D Solo With an AI Dungeon Master

The hardest part of Dungeons & Dragons usually isn't the rules. It's scheduling. Five adults with jobs, kids, and time zones rarely line up. That's why so many people are looking for ways to **play D&D solo**, and why AI Dungeon Masters have become one of the most popular options.

This guide explains how solo play with an AI DM works, how to set up a good session, and the habits that make solo campaigns feel as rich as a table full of friends.

## What Is an AI Dungeon Master?

An AI Dungeon Master is a language model prompted to run a tabletop-style game. It describes the world, voices NPCs, asks what you do, decides outcomes (often using dice rolls behind the scenes), and keeps track of your character.

In EchoQuest, the AI Game Master is powered by Claude and tied to structured game state (HP, inventory, conditions, and story flags), so the world stays consistent between turns. Everything is narrated aloud, so it feels closer to sitting across from a real DM than reading a chat log.

## Solo D&D Options Compared

- **Solo gamebooks and oracle systems:** you roll on tables and interpret the results yourself. Rewarding, but you're doing all the work.
- **Solo adventure modules:** pre-written, but limited branches.
- **AI Dungeon Master:** responds to anything you try, voices every NPC, and handles rules and bookkeeping.

An AI DM is the only option where you can simply *play* and let someone else run the game.

## Step 1: Pick a Setting That Suits Solo Play

Some adventures work better solo than others. Good choices:

- **Investigation and mystery**, where one sharp mind is enough
- **Survival and exploration**, where isolation is part of the mood
- **Intrigue and politics**, which are all about conversations
- **Heist stories**, especially if you can recruit NPC allies

Big set-piece battles against armies are harder solo unless the story gives you companions. The AI can provide those. Just ask.

On EchoQuest, **Iron Citadel** (a fantasy siege), **Neon Precinct** (cyberpunk noir), and **Saltbound** (pirate archipelago) are all tuned for solo play.

## Step 2: Build a Character With Built-In Hooks

When you play solo, your character is the whole party, so give them:

- **A goal** they can act on right away ("find my missing brother")
- **A flaw** that creates trouble ("can't resist a wager")
- **A connection** the world can use ("owes money to the harbour guild")

Hooks give the AI Dungeon Master something to work with. Our guide to [classic RPG character archetypes](/blog/10-classic-rpg-character-archetypes-and-how-to-play-them-well) is a good place for ideas.

## Step 3: Tell the DM What You Want

Human DMs run a "session zero" to agree on tone. Do the same with an AI DM in your first message or backstory:

- "I want a gritty tone with real danger."
- "Keep combat quick. I'm here for mystery."
- "Give me a loyal companion NPC I can talk to."

A good AI Game Master will adapt.

## Step 4: Play Actively

The most common beginner mistake in solo play is waiting for the story to happen. Instead:

- **Declare intentions, not just actions.** "I search the desk *because I think the mayor is hiding letters*" gives the DM more to work with than "I search the desk."
- **Talk to NPCs.** They're your party. Ask their opinions, argue with them, recruit them.
- **Chase the odd detail.** A strange smell, a nervous guard. These are hooks.
- **Take risks.** Solo campaigns get dull when you play it safe.

## Step 5: Use Companions to Replace the Party

A solo hero doesn't need to be alone. Ask the AI DM for a companion: a sarcastic rogue, a worried young cleric, a mercenary with their own agenda. Good companion NPCs give you banter, alternative views, and someone to save, or be betrayed by. See [Writing Compelling NPCs](/blog/writing-compelling-npcs-7-techniques-that-work) for what makes them work.

## Step 6: Pace Your Sessions

Solo play can go on without end, and that's a problem. Structure helps:

- Aim for **one clear objective per session** (reach the tower, question the witness)
- Stop at a **cliffhanger** so you're excited to come back
- Keep a one-line **session log** so you remember what happened

EchoQuest saves your campaign state, so you can pick up exactly where you left off.

## Common Solo D&D Pitfalls (and Fixes)

| Problem | Fix |
| --- | --- |
| "I don't know what to do next." | Ask the DM: "What are my options?" or "What would my character notice?" |
| Combat feels flat | Describe tactics and the environment, not just "I attack." |
| The story wanders | Restate your goal to the DM and ask for complications. |
| Too easy | Ask for higher difficulty. See our guide to [setting difficulty in AI RPGs](/blog/setting-difficulty-in-ai-rpgs-from-beginner-to-power-player). |

## Is Solo D&D "Real" D&D?

Yes. Roleplaying games are about making choices in a shared imaginary world, and in solo play you share it with the DM. Many players find solo campaigns more personal: every story beat is about *your* character. For more on this, read [Solo RPG vs. Group Play](/blog/solo-rpg-vs-group-play-the-case-for-playing-alone).

## Start Your Solo Campaign

You don't need a group, a rulebook, or a Friday night free. Pick a world, make a character, and your AI Dungeon Master is ready.

**[Start playing solo for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-27",
    title: "Text Adventure Games Online: A Modern Player's Guide",
    excerpt: "Text adventure games are back, now with AI. Learn how to play text adventures online, how modern AI versions differ from classic parser games, and where to start.",
    content: `# Text Adventure Games Online: A Modern Player's Guide

Before 3D graphics, before sprites, there were words on a screen: "You are standing in an open field west of a white house." Text adventure games were among the first computer games, and they never really went away. Today they're having a revival, driven by accessibility, nostalgia, and AI that can finally understand what players mean.

This guide covers how **text adventure games online** work today, how AI versions differ from classic ones, and how to get the most from them.

## What Is a Text Adventure?

A text adventure (also called interactive fiction) is a game where the world is described in words and you act by typing commands. There are no graphics to learn and nothing to aim. Your imagination does the rendering.

Classic text adventures used a **parser**, a program that understood a small vocabulary like GO, TAKE, OPEN, and EXAMINE. Modern AI text adventures use large language models that understand natural sentences.

## Classic Parser Games vs. AI Text Adventures

| | Classic parser games | AI text adventures |
| --- | --- | --- |
| Input | Short commands ("get key") | Natural language ("I pocket the key while the guard looks away") |
| World | Hand-written, finite | Authored setting that expands as you play |
| Replay | Same puzzles each time | Different story each playthrough |
| Frustration | "I don't understand that." | Rarely stuck on wording |
| Strength | Tight, clever puzzles | Freedom, conversation, emergent story |

Both are worth playing. Classic interactive fiction is a rich art form with decades of free games. AI text adventures offer something new: a world that responds to *anything*.

## Why Text Adventures Are Perfect for Accessibility

Text is the most portable format there is. It works with screen readers, braille displays, text-to-speech, and magnifiers. That's why text adventures have long been popular with blind gamers.

EchoQuest takes this a step further with **audio-first** design: every scene is narrated aloud, and you can respond by voice. It's a text adventure you can play with your eyes closed.

## How to Play a Text Adventure Well

### Read (or Listen) Carefully

Descriptions are your map. Details are rarely there by accident. If the narrator mentions a loose floorboard, it matters.

### Examine Everything

In classic games, EXAMINE is the most useful verb. In AI games, ask questions: "What does the inscription say?" "Does the merchant seem nervous?"

### Talk to Characters

AI text adventures shine in conversation. You can bluff, bargain, flatter, or interrogate, and NPCs react in character.

### Keep Notes

A few lines about names, clues, and unanswered questions help a lot on longer adventures.

### Be Specific About Intent

"I attack" is fine. "I feint left, then drive my shield into his knee to knock him off the bridge" is better. The AI can reward creativity in a way parsers never could.

## Where to Play Text Adventure Games Online

- **Classic interactive fiction archives** host thousands of free parser games you can play in a browser.
- **Annual IF competitions** showcase new short games every year.
- **AI-powered platforms** like EchoQuest let you play narrated, open-ended adventures in fantasy, sci-fi, noir, horror, and more, right in your browser with no download.

## Tips for Your First AI Text Adventure

1. **Start with a structured campaign.** An official campaign gives you clear stakes while you learn the style.
2. **Don't be afraid to experiment.** Try something odd and see how the world reacts.
3. **Ask the narrator for help.** "Remind me what I know about the missing ship" works.
4. **Replay.** The same campaign can go very differently a second time.

If you've never tried one, our [beginner's guide to your first EchoQuest adventure](/blog/how-to-play-your-first-echoquest-adventure-beginners-guide) walks through a session step by step.

## The Future of Text Adventures

Text adventures were written off as a relic once graphics arrived. It turns out words were never the limitation. Early computers just couldn't understand them well. Now they can. The genre that started gaming may turn out to be one of its most flexible futures.

**[Play a text adventure online for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-28",
    title: "What Is an AI Game Master? Everything You Need to Know",
    excerpt: "What is an AI Game Master, how does it work, and can it really run a tabletop-style RPG? A plain-English explainer covering memory, rules, dice, and narration.",
    content: `# What Is an AI Game Master? Everything You Need to Know

"AI Game Master" is one of the fastest-growing terms in gaming, and one of the most misunderstood. Some people picture a chatbot that makes up stories. Others picture a robot running D&D. The reality is somewhere in between, and more interesting than either.

This explainer covers what an **AI Game Master** is, how it works under the hood, what it does well, and where it's still improving.

## The Short Answer

An AI Game Master (AI GM) is software that runs a roleplaying game for you. It describes the world, plays every non-player character, decides the outcome of your actions, and keeps the story moving, the same job a human GM or Dungeon Master does at a tabletop.

The difference from a chatbot is **structure**. A good AI GM combines a language model with game rules, persistent state, and a clear sense of pacing.

## How an AI Game Master Works

### 1. The Language Model

At the core is a large language model. In EchoQuest's case that's Claude, from Anthropic. The model handles what's hard to program by hand: understanding your intent, writing vivid descriptions, and giving NPCs believable voices.

### 2. The World Definition

The AI needs to know what world it's running. That comes from a campaign definition, sometimes called a Game Bible, containing setting lore, factions, locations, key NPCs, tone guidelines, and rules. This keeps the GM from inventing things that break the world.

### 3. Game State

Behind the narration, the system tracks structured data:

- Character stats and hit points
- Inventory and currency
- Conditions (poisoned, exhausted, hidden)
- Quest progress and story flags
- Location and time

The AI reads this state before each response and proposes updates after. That's how a potion you drank stays drunk.

### 4. Rules and Randomness

When the outcome of an action is uncertain (picking a lock, persuading a guard, dodging a blade), a good AI GM resolves it with **dice rolls**, not just narrative convenience. Randomness creates tension and makes success feel earned.

### 5. Memory and Summaries

Long campaigns go beyond what any model can hold at once. AI GMs use rolling summaries and key facts so earlier events can come back. The informant you betrayed can still hold a grudge ten sessions later.

### 6. Narration and Voice

Finally, the output has to reach you. In EchoQuest, every response is **narrated aloud**, with browser speech on the free tier and expressive ElevenLabs voices on premium plans, with different voices for different characters.

## What an AI Game Master Does Well

- **Improvisation:** it can respond sensibly to almost anything you try.
- **Availability:** it's there at 2am, on a lunch break, or for ten minutes on a train.
- **Patience:** it never sighs when you spend an hour haggling with a fishmonger.
- **Consistency of effort:** every NPC gets a voice, every scene gets description.
- **Accessibility:** it can be fully audio-driven and screen-reader friendly, which physical tabletop play often isn't.

## Where AI GMs Are Still Improving

To be fair, AI Game Masters aren't perfect:

- **Very long-term continuity** can drift without good summarisation.
- **Tactical grid combat** is harder to convey in pure narration than on a battle map.
- **Reading the room** at a real table, noticing a friend is bored or upset, is a human skill.

The best platforms reduce these with state tracking, structured campaigns, and letting you steer ("Let's skip ahead to the city").

## AI GM vs. Human GM: Which Is Better?

Neither. They're different experiences. A human GM brings friendship, shared history, and table chemistry. An AI GM brings on-demand play, endless patience, and total personalisation. Many players use both: a human-run group every other week, and AI sessions in between. See [From Tabletop to AI: How EchoQuest Reimagines D&D](/blog/from-tabletop-to-ai-how-echoquest-reimagines-dd).

## How to Get the Best From an AI Game Master

1. **Set expectations early:** tone, difficulty, content limits.
2. **Be descriptive:** detailed actions get detailed responses.
3. **Ask questions:** "What do I know about this faction?"
4. **Steer when needed:** you're allowed to say "Let's move on."
5. **Give feedback:** if a scene isn't working, say so.

## Try an AI Game Master Today

The best way to understand an AI GM is to play one. EchoQuest's free tier includes three official campaigns with full narration. Make a character, speak or type your first action, and see how it responds.

**[Meet your AI Game Master →](/library)**
`,
  },
  {
    publishAt: "2026-09-29",
    title: "Accessible Video Games: A Checklist for Blind and Low-Vision Gamers",
    excerpt: "A practical checklist for blind and low-vision gamers: what to check for screen readers, audio cues, text size and controls before you buy a game.",
    content: `# Accessible Video Games: A Checklist for Blind and Low-Vision Gamers

Store pages throw the word "accessible" around very freely. Yet a colour-blind filter plus a subtitle toggle won't make a game playable if you can't see the screen at all. So before you hand over money (or, worse, a whole weekend), it pays to know exactly what to look for.

And you're hardly a niche audience. The World Health Organization's [fact sheet on vision impairment](https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment) puts the number of people living with a near or distance vision impairment at no fewer than 2.2 billion worldwide. Plenty of them play games, or would if games let them.

What follows is the checklist I wish every store page answered for **blind and low-vision gamers**, along with the questions worth asking before you buy. I leaned on it hard while building EchoQuest, and I'll be honest about the spots where I tripped over my own list.

## Part 1: Screen Reader and Speech Support

For blind players, this section is non-negotiable. Everything else sits on top of it.

- [ ] **Menus are read aloud**, either by a built-in narrator or through your own screen reader
- [ ] **All game text is readable**: dialogue, item descriptions, quest logs, tutorials
- [ ] **Status information is available on demand** (health, location, objectives) with a single key press
- [ ] **New events are announced** automatically, not merely flashed on screen
- [ ] **Speech rate is adjustable**, so you can listen at whatever speed suits your ears
- [ ] **A "repeat last message" command** exists

Microsoft's own [Xbox Accessibility Guideline on screen narration](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/106) says much the same thing in developer language. It asks studios to narrate HUD details such as health and inventory, and to let players repeat narration and change the speaking rate. When a platform holder writes that down for studios, a game that skips it has run out of excuses.

**Why it matters:** if you can't get through the main menu, nothing else counts. Honestly, I learned a subtler version of this lesson myself. In May I found that EchoQuest was announcing and focusing the choices while the narrator was still mid-sentence, so screen reader users heard two voices talking over each other. Technically, everything was "read aloud". In practice it was a mess. Now the choices wait until the narration finishes. So when you test a game, listen for timing as well as coverage.

## Part 2: Audio Design

Once speech is sorted, sound design does the heavy lifting.

- [ ] **Spatial audio** (stereo or 3D) tells you where things are
- [ ] **Distinct sounds** for different objects, enemies and interactions
- [ ] **Audio cues for navigation**, such as footstep surfaces, wall bumps and pathfinding pings
- [ ] **Separate volume sliders** for speech, music, effects and ambience
- [ ] **Mono audio option** for players with hearing differences in one ear
- [ ] **Audio description of cutscenes**, or cutscenes you can skip without losing the plot

Those volume sliders deserve a closer look. The [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/provide-separate-volume-controls-or-mutes-for-effects-speech-and-background-music/) rate separate volume controls as a basic requirement for hearing and an intermediate one for vision, since anyone relying on audio cues has to be able to pick them out of the mix. Mono gets its own [guideline](https://gameaccessibilityguidelines.com/provide-a-stereo-mono-toggle/) too, and the logic is blunt: if you're deaf in one ear, a sound that only plays on the left might as well not exist.

I had a few humbling moments here. My ambient soundtrack originally sat right on top of the sound cues, so I made it duck underneath them. Then I noticed the same cue sometimes fired twice in a row, which just sounds like a glitch, so duplicates arriving within 80 milliseconds now get dropped. Even the volume slider needed rework. A straight linear slider feels oddly lopsided to human ears, so I gave it a squared curve that tracks how we actually perceive loudness. Small stuff, sure. Still, small stuff decides whether audio cues help you or wear you out.

## Part 3: Visual Options for Low Vision

Low vision covers an enormous range, so these options matter for lots of players who do look at the screen, just differently.

- [ ] **Scalable text and UI** (not just subtitles)
- [ ] **High-contrast mode** for key elements
- [ ] **Colour-blind modes** that don't rely on colour alone
- [ ] **Screen magnifier compatibility** or built-in zoom
- [ ] **Adjustable camera and motion**, including reduced camera shake and motion blur
- [ ] **Readable fonts**, not thin decorative typefaces

Want to see how far a big studio can push this? Look at The Last of Us Part II. Naughty Dog shipped it in 2020 with [more than 60 accessibility settings](https://www.naughtydog.com/blog/the_last_of_us_part_ii_accessibility_features_detailed), including a high contrast mode that mutes the environment's colours and paints allies, enemies and interactive objects in distinct ones. That's the bar. A lone "large subtitles" toggle isn't.

## Part 4: Controls and Timing

- [ ] **Fully remappable controls**
- [ ] **No mandatory timed visual prompts** (quick-time events you have to see)
- [ ] **Adjustable game speed**, or the ability to pause anywhere
- [ ] **Hold-to-press alternatives** (toggle instead of hold)
- [ ] **Keyboard-only play** on PC, with no mouse required

Timed prompts are the sneaky one. A game can narrate every menu flawlessly and then ambush you with a button prompt that flashes for half a second. If a review mentions quick-time events, find out if you can switch them off before you buy. A pause button you can hit anywhere is worth more than it sounds, too; life interrupts, and a game that punishes you for answering the door has its priorities backwards.

## Part 5: Information Design

This is the part that separates games that are accessible on paper from games that are accessible in your hands.

- [ ] **No information conveyed by visuals alone**. Every visual cue has an audio or text equivalent.
- [ ] **Objectives are clearly stated** and can be re-read
- [ ] **Maps are describable**: you can ask where things are relative to you
- [ ] **Puzzles are solvable without sight**, or skippable

The Last of Us Part II is a handy reference again. Its Vision Accessibility Preset bundles text-to-speech with extra audio cues for traversal and combat, and you can ask the game for a spoken description of your current status. That's the "status on demand" idea from Part 1 meeting the "no visuals alone" rule here, and it's exactly the pairing I'd look for in any game.

## Part 6: Support and Community

- [ ] **An accessibility statement** from the developer that says what's tested and supported
- [ ] **A way to report accessibility bugs**
- [ ] **Patches that fix accessibility issues**
- [ ] **An active blind gaming community** talking about the title

Don't underrate the last two. Every game ships with accessibility bugs (mine certainly has), so what you're really judging is whether the developer listens and repairs them. In September, for example, I discovered that EchoQuest's browser narrator was cutting off a few seconds into a scene. A blind player would notice that in the first minute, and it needed a patch, not a shrug.

## How EchoQuest Scores

I built EchoQuest against this checklist from the start, so here's how it measures up:

- Every scene is **narrated aloud**, and every control is labelled so NVDA, JAWS, VoiceOver and TalkBack can read it (it's standard web markup, so Orca on Linux picks up the same labels)
- New narration is announced through **ARIA live regions**, and so are changes to your HP and inventory
- **Full keyboard navigation** with visible focus (see [Keyboard Navigation in EchoQuest](/blog/keyboard-navigation-in-echoquest-play-without-a-mouse))
- Single-key shortcuts for the Part 1 essentials: **R** replays the narration, **S** reads your status, **L** tells you where you are, and **[** and **]** change speech speed
- **Voice commands** for hands-free play (see [Voice Commands in EchoQuest](/blog/voice-commands-in-echoquest-play-completely-hands-free))
- Adjustable **speech rate**, large text, high contrast and **reduced motion** in Settings
- **No timed prompts**: take as long as you like on every turn
- The game world comes across entirely through narration, so nothing depends on sight

Is it perfect? No, and the narrator cut-off I just mentioned proves it. But the foundation is right, and I'd much rather fix bugs on a solid base than bolt accessibility onto a visual game after the fact.

## How to Use This Checklist

1. **Before buying:** search the game's name plus "blind accessible" and look for reviews written by blind players.
2. **Check the accessibility page:** reputable developers publish one, and the good ones are specific about what they tested.
3. **Try a demo or free tier** when there is one.
4. **Share what you learn:** your review spares the next player an afternoon of frustration.

## The Bigger Picture

Game accessibility has come a long way, and several big releases now ship with deep option menus. Even so, it's patchy. One studio does brilliant work and the next adds a colour-blind filter and calls it a day. That's why I think checklists like this one earn their keep: they help players decide with their eyes open (or closed), and they show developers what "accessible" actually means once a real person sits down to play. For more background, read [Accessibility in Gaming: The State of Play in 2026](/blog/accessibility-in-gaming-the-state-of-play-in-2026).

So which item on this list do you find missing most often? My bet is Part 5, nearly every time.

**[Try an audio-first, fully accessible RPG for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-30",
    title: "Choose Your Own Adventure Games for Adults: Where to Start",
    excerpt: "Loved choose-your-own-adventure books as a kid? Here's how the grown-up versions work now, from stat-driven novels to AI adventures, and where to start.",
    content: `# Choose Your Own Adventure Games for Adults: Where to Start

"If you open the door, turn to page 42. If you run, turn to page 17." For plenty of us, that was the first interactive story we ever met. We kept a thumb wedged in the previous page, peeked at both outcomes and cheated without a flicker of shame. (Admit it. You did too.) The format has grown up a lot since then, and **choose your own adventure games for adults** now stretch from carefully authored branching fiction to AI-narrated stories with no fixed pages at all.

A little history first, because it's a lovely one. Edward Packard came up with the idea while telling bedtime stories to his daughters. One night he ran out of things for his hero to do, so he asked the girls what *they* would do. Bantam published his The Cave of Time as the first official Choose Your Own Adventure book in 1979, and the series went on to sell [more than 250 million copies between 1979 and 1998](https://en.wikipedia.org/wiki/Choose_Your_Own_Adventure). Over in Britain, Steve Jackson and Ian Livingstone bolted dice and combat onto the idea with [The Warlock of Firetop Mountain](https://en.wikipedia.org/wiki/The_Warlock_of_Firetop_Mountain), which Puffin published in 1982 as the first Fighting Fantasy gamebook. Those kids flipping pages are grown-ups now, with long commutes and firm opinions about what a good story owes them.

I'm one of them, frankly. When I started building EchoQuest, that page-42 thrill was the thing I most wanted to keep, minus the page numbers.

## What Makes a CYOA Game "for Adults"?

"Adult" here doesn't mean explicit. It means **grown-up storytelling**:

- Moral dilemmas without tidy answers
- Consequences that follow you across the whole story
- Knotty characters with clashing motives
- Themes like grief, ambition, loyalty and power
- Genres beyond kids' fantasy: noir, horror, political intrigue, hard sci-fi

Put plainly, an adult CYOA trusts you with a choice that stings either way. The children's books mostly asked which tunnel you fancied. The good adult ones ask who you're prepared to let down.

## The Three Types of Modern CYOA Games

Today's choice-driven games fall roughly into three families. They blur at the edges, of course. Still, the labels help a lot when you're trying to pick something for tonight.

### 1. Classic Branching Stories

These behave like the books did: a fixed set of options at each fork, each one leading to an outcome somebody wrote by hand. Because a person crafted every path, the prose can be superb. The price is agency, since you can only choose what the author anticipated. Those early Choose Your Own Adventure titles carried as many as 44 endings, which sounds generous right up until you want a 45th.

### 2. Stat-Driven Interactive Novels

These keep track of hidden variables such as your reputation and your relationships (skills, too), and those numbers quietly change what's on offer later. They feel more reactive, and over a playthrough your choices add up to an actual person. Choice of Games has built a whole catalogue on this approach since Choice of the Dragon in 2009. Its own writing guide says a player [typically makes hundreds of individual decisions](https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/) in one run, and that a decision which modifies a stat has some effect. That's the clever bit. Nobody has to hand-write a callback to chapter one, because the numbers remember for them.

inkle's 80 Days is another fine doorway. It's a steampunk riff on Jules Verne where you play Passepartout, plotting a route around the globe while you look after Phileas Fogg and try to earn his trust, and TIME made it [its Game of the Year for 2014](https://www.inklestudios.com/press/80days/). Not bad for a game built mostly out of words.

### 3. AI-Narrated Adventures

This is the newest family. Instead of choosing from fixed options, you can **type or say anything**, and an AI narrator responds within a world someone designed. EchoQuest works this way. Its Game Master runs on Anthropic's Claude, and it still offers a few suggested choices each turn (usually three or four) for the moments when you'd rather pick than write. Press the number key, or just say "option two".

I learned something humbling about those suggestions, by the way. Back in May, EchoQuest was announcing and focusing them while the narrator was still mid-sentence, so screen reader users heard two voices tripping over each other. These days the choices wait until the story has finished speaking. A choice you can't actually hear is hardly a choice.

| | Branching | Stat-driven | AI-narrated |
| --- | --- | --- | --- |
| Choices | Fixed | Fixed, stat-gated | Unlimited |
| Replayability | Moderate | High | Very high |
| Writing polish | Highest | High | Varies with the AI and world |
| Surprise | Low on replay | Medium | High |

I stand by that "writing polish" row, even though it's my own product sitting in the weakest spot. A great human author still writes a finer sentence than any model. Where AI wins is the dead end. You simply never hit one.

## Why Adults Are Rediscovering CYOA

- **Time-friendly.** A satisfying session can fit into 15 minutes, about the length of a coffee.
- **Low barrier.** No reflexes or controller skills needed.
- **Real agency.** Your choices count in a way passive media can't match.
- **Screen fatigue.** Audio CYOA lets you close your eyes and listen.
- **Personalisation.** AI adventures react to the specific character you bring.

There's a quieter reason too. Games made of words have long been among the friendliest around for blind players, and Choice of Games in particular [has been noted for making games accessible to visually impaired players](https://en.wikipedia.org/wiki/Choice_of_Games). That tradition is a big part of why I went audio-first.

## How to Choose Your First Adult CYOA Game

- **Love literary writing?** Start with hand-authored branching fiction.
- **Love building a character?** Try a stat-driven interactive novel.
- **Want total freedom?** Try an AI adventure.
- **Want to listen instead of read?** Pick an audio-first platform like EchoQuest.

Still torn? My advice is to start with whatever you can play tonight, because a CYOA you keep meaning to try teaches you nothing. EchoQuest's free tier gives you three campaigns and 60 AI turns a day, which is plenty to learn if writing (or saying) your own moves suits you.

## Making Better Choices: Tips for CYOA Players

1. **Play in character, not to "win".** The best stories come from choices your character would make, not the ones that look optimal on paper.
2. **Don't reload after every bad outcome.** Failure is often where the best story beats are hiding. I did build single-step undo into EchoQuest (press U), but mainly for slipped fingers and misheard voice commands. Please don't use it to dodge every bruise. Since October, hitting 0 HP brings a genuine setback, and honestly, that's often where a session finally gets good.
3. **Explore the unusual option.** In AI games, try things the story never suggested.
4. **Replay with a different personality.** A cautious scholar and a reckless mercenary will pull very different stories out of the same world.

For more on how branching works under the hood, see [The Power of Choice: How Branching Narratives Work in AI RPGs](/blog/the-power-of-choice-how-branching-narratives-work-in-ai-rpgs). If you relish hard decisions, read [Crafting Moral Dilemmas](/blog/crafting-moral-dilemmas-how-to-make-players-truly-think).

## A Sample Adult CYOA Moment

> The informant slides the ledger across the table. It proves the captain of the guard is selling weapons to the rebels, the same rebels who fed your village through the winter. The captain's daughter is waiting outside for her father.

So what do you do? Expose him? Blackmail him? Warn the rebels? Burn the ledger? In an AI-narrated game, every one of those is available, along with anything else you can dream up. Fancy slipping the daughter a warning and letting her decide what happens to her father? Go ahead. A gamebook would need a whole extra page for that, and nobody wrote it. Here, you just say it.

## Start Your Adventure

You don't need a thumb jammed in page 42 anymore. Pick a world and make a character. After that, choose your own path, out loud if you like.

**[Start a free adventure →](/library)**
`,
  },
  {
    publishAt: "2026-10-01",
    title: "How to Write a D&D Backstory (With 10 Prompts and Examples)",
    excerpt: "Learn how to write a D&D character backstory that gives your DM hooks to use: a simple structure, common mistakes, and 10 backstory prompts with examples.",
    content: `# How to Write a D&D Backstory (With 10 Prompts and Examples)

A great backstory does more than explain where your character came from. It gives your Game Master hooks: people, debts, secrets, and goals they can bring into the story. Whether you're playing with a human Dungeon Master or an AI Game Master, a strong backstory makes the campaign about *you*.

This guide gives you a simple structure for writing a **D&D backstory**, the mistakes to avoid, and ten prompts to get you started.

## The 5-Part Backstory Formula

You don't need five pages. You need five ideas.

1. **Origin:** where and how they grew up, in one or two sentences.
2. **Turning point:** the event that set them on the adventurer's path.
3. **Goal:** what they want right now, concrete and actionable.
4. **Flaw or fear:** what gets them into trouble.
5. **Loose thread:** an unresolved person, debt, or mystery the story can pick up.

The loose thread matters most, because it's the hook the GM will use.

## Example Backstory Using the Formula

> **Origin:** Mira grew up on a salt barge, the youngest of six, learning knots before letters.
> **Turning point:** When a customs cutter sank the barge, Mira was the only one who swam ashore.
> **Goal:** Find out who tipped off the customs captain.
> **Flaw:** She trusts no one in uniform, even when she should.
> **Loose thread:** Her eldest brother's body was never found.

That's five sentences, and it gives a GM a villain (the informant), a faction (customs), a personal mystery (the brother), and a flaw to test.

## Common Backstory Mistakes

- **The finished hero.** If your character already defeated their nemesis and mastered their craft, the story has nowhere to go.
- **The orphan with no one.** Tragedy is fine, but a character with *no* living connections gives the GM nothing to use. Leave someone alive.
- **The novel.** Ten pages of lore is hard to use. Keep it short and let the rest emerge in play.
- **The lone wolf who refuses everything.** Moody is fine. Unwilling to engage is not.
- **Overpowered secrets.** "Secretly the heir to the empire and a dragon" tends to take over the whole campaign.

## 10 D&D Backstory Prompts

Use these as starting points. Each includes a built-in hook.

1. **The Borrowed Name.** You're travelling under the name of someone who died. Their family doesn't know yet.
2. **The Unpaid Debt.** A temple healed your dying parent. The priests now want payment, and not in gold.
3. **The Failed Apprentice.** Your master expelled you the night before the final test, with no explanation. You want to know why.
4. **The Wrong Prophecy.** A seer named you as the one who will "open the last door". You have no idea what that means, but some people are very interested in you.
5. **The Deserter.** You walked away from a battle you knew was a massacre. Your old regiment still has your name on a list.
6. **The Letter Carrier.** You've carried a sealed letter for three years, promising a dying stranger to deliver it. You still haven't found the recipient.
7. **The Stolen Voice.** A curse took your singing voice, which used to be your living. The bard who has it now is famous.
8. **The Collector's Mark.** You were tattooed as a child by a secretive guild. Occasionally someone recognises the mark.
9. **The Second Chance.** You were hanged for a crime you did commit, and you woke up alive. Someone saved you for a reason.
10. **The Map Fragment.** Your grandmother left you a third of a map. Two other people have the other pieces.

## How Backstory Works With an AI Game Master

When you create a character in EchoQuest, the backstory you write goes straight to the AI Game Master, powered by Claude. It uses those details to:

- Introduce NPCs connected to your past
- Add complications that test your flaw
- Build toward your stated goal
- Pay off loose threads at dramatic moments

Short, concrete backstories work best. A few specific names and one clear goal beat a vague paragraph about "a troubled past".

## Quick Backstory Checklist

- [ ] Can I summarise it in five sentences?
- [ ] Does my character want something concrete *right now*?
- [ ] Is there at least one living person connected to my past?
- [ ] Is there an unresolved mystery or debt?
- [ ] Does my flaw create interesting problems rather than just blocking the story?

If you're stuck on the character concept itself, browse [10 Classic RPG Character Archetypes](/blog/10-classic-rpg-character-archetypes-and-how-to-play-them-well) for inspiration.

## Put Your Backstory to Work

The best way to test a backstory is to play it. Create a character on EchoQuest, paste in your five sentences, and see how quickly the AI Game Master picks up your loose thread.

**[Create your character →](/library)**
`,
  },
  {
    publishAt: "2026-10-02",
    title: "Games You Can Play With a Screen Reader: NVDA, JAWS and VoiceOver Tips",
    excerpt: "Which games work with a screen reader, and how do you set up NVDA, JAWS, or VoiceOver for gaming? Practical tips for playing browser, PC, and mobile games.",
    content: `# Games You Can Play With a Screen Reader: NVDA, JAWS and VoiceOver Tips

Screen readers were built for documents and websites, not games. Even so, a growing number of games work well with them, especially browser-based and text-driven ones. This guide covers which **games work with a screen reader**, and how to configure NVDA, JAWS, VoiceOver, and TalkBack for the smoothest experience.

## Which Kinds of Games Work Best With Screen Readers?

Screen readers work best with games whose interface is built from **real, semantic elements** (buttons, headings, lists, live regions) rather than pixels drawn on a canvas. That gives us a simple rule of thumb:

- **Great:** browser games built with accessible HTML, text adventures, AI RPGs, card and board games, trivia, MUDs
- **Mixed:** mobile games (depends entirely on the developer), turn-based strategy with keyboard queries
- **Hard:** canvas-rendered or engine-rendered games without a built-in narrator. These need self-voicing or dedicated audio design.

Browser-based **AI RPGs** like EchoQuest are among the most screen-reader-friendly games because the whole game is text and speech.

## NVDA Tips for Gaming (Windows, Free)

NVDA is free, open-source, and one of the most popular screen readers in the world.

- **Browse vs. focus mode:** NVDA switches to focus mode automatically in text inputs. In game interfaces, press **NVDA+Space** to toggle if keystrokes aren't reaching the game.
- **Live regions:** make sure "Report dynamic content changes" is enabled so new narration is spoken automatically.
- **Speech rate:** many gamers go faster than default. Use **NVDA+Ctrl+Up/Down** with the rate setting selected in the synth settings ring.
- **Speech viewer:** handy for sighted helpers or when debugging what's being announced.

## JAWS Tips for Gaming (Windows)

- **Virtual PC cursor:** toggle with **Insert+Z** if a game's keyboard shortcuts are being intercepted.
- **Forms mode:** JAWS enters forms mode in edit fields. Make sure auto forms mode is on.
- **Verbosity:** lower verbosity during play to reduce chatter like "clickable" or "link".
- **Pass-through key:** **Insert+3** passes the next keystroke straight to the application.

## VoiceOver Tips (macOS and iOS)

- **Web rotor:** on Mac, **VO+U** opens the rotor to jump between headings, buttons, and landmarks.
- **Quick Nav:** turn it off while typing in a game's action field so arrow keys behave normally.
- **iOS:** use the rotor to change speaking rate on the fly, and try **Screen Curtain** (three-finger triple-tap) to save battery during long sessions.
- **Safari vs. Chrome:** VoiceOver is generally most reliable in Safari on Apple devices.

## TalkBack Tips (Android)

- **Reading controls:** set up a gesture for "read from next item".
- **Speech rate:** adjust in TalkBack settings, then Text-to-speech.
- **Chrome is recommended** for browser games on Android.

## Avoiding "Double Speech" in Self-Voicing Games

Some games speak aloud *and* expose text to your screen reader, so you hear everything twice. Options:

- Turn off the game's built-in narration and rely on your screen reader, **or**
- Keep the game's narration (often more expressive) and mute your screen reader during narration.

EchoQuest gives you control here. You can keep the expressive narrator voice for the story and use your screen reader for menus and controls. Our [technical deep dive on screen readers](/blog/how-screen-readers-work-with-echoquest-a-technical-deep-dive) explains how the live regions are set up.

## What to Look for in a Screen-Reader-Friendly Game

- Clear **headings and landmarks** so you can jump around quickly
- **Labelled buttons**, not "button, button, button"
- **Live announcements** for new content
- A **keyboard shortcut** to repeat the last message
- **No time limits** on reading
- A published **accessibility statement**

## A Quick Test You Can Run on Any Browser Game

1. Load the game and press **Tab** repeatedly. Does focus move logically, and is every element announced with a meaningful name?
2. Trigger an in-game event. Is it announced without you moving focus?
3. Try to complete one core action (start a game, make a move) without using a mouse.

If a game passes all three, it's probably worth your time.

## Play EchoQuest With Your Screen Reader

EchoQuest is tested with NVDA, JAWS, VoiceOver, TalkBack, and Orca. The free tier includes three narrated campaigns, and everything works by keyboard.

**[Start playing with your screen reader →](/library)**
`,
  },
  {
    publishAt: "2026-10-03",
    title: "Games You Can Play With Your Eyes Closed: Audio RPGs for Commutes, Chores and Bedtime",
    excerpt: "Looking for games you can play with your eyes closed? Audio RPGs let you adventure while commuting, doing chores, or winding down. Here's how to fit them into your day.",
    content: `# Games You Can Play With Your Eyes Closed: Audio RPGs for Commutes, Chores and Bedtime

Most games demand your eyes and your hands. That's a problem when you're on a crowded train, folding laundry, or trying to wind down without another hour of screen glare. **Games you can play with your eyes closed** fill that gap. The best of them aren't simple distractions. They're full adventures.

## Why Eyes-Free Gaming Is Taking Off

- **Screen fatigue:** after a day of screens, many people want to rest their eyes but still do something engaging.
- **The podcast habit:** people already listen during commutes and chores, and audio games add interaction.
- **Accessibility:** eyes-free design helps blind and low-vision players and suits everyone else too.
- **Better voice tech:** speech recognition and natural-sounding narration have improved dramatically.

## What Makes an Audio RPG Work Eyes-Free?

A game is truly eyes-free when:

1. **Everything important is spoken**: scenes, choices, and status
2. **You can respond by voice** or with simple, memorable keys
3. **There's no time pressure**, so you can pause for a doorbell
4. **You can ask for a recap** when your attention drifts

EchoQuest was designed for exactly this. Every scene is narrated, you can speak your actions, and you can ask the Game Master "What's happening?" whenever you need to catch up.

## Scenario 1: The Commute

**Best for:** bus, train, or passenger-seat travel. (Never play anything interactive while driving. Keep your attention on the road.)

- **Use earbuds** with a built-in mic for voice input, or tap suggested choices.
- **Pick scenes with natural pauses:** exploration and conversation work better than tense combat when you might be interrupted.
- **Play 10–20 minute chapters:** aim to reach one objective per journey.

## Scenario 2: Chores and Cooking

**Best for:** washing up, laundry, gardening, meal prep.

- **Voice commands are your friend:** your hands are busy, your voice isn't.
- **Turn up the narration volume** and use a smart speaker or phone speaker.
- **Choose conversational campaigns:** mysteries and intrigue suit this mode, and you can interrogate suspects while chopping onions.

See [Voice Commands in EchoQuest](/blog/voice-commands-in-echoquest-play-completely-hands-free) for a full guide.

## Scenario 3: Winding Down at Night

**Best for:** relaxing before sleep without bright screens.

- **Enable dark mode and turn the screen off** (or use Screen Curtain on iOS).
- **Slow the narration speed** slightly for a calmer listen.
- **Choose gentle genres:** exploration, cozy fantasy, or slow-burn mysteries rather than horror.
- **Set a stopping point:** end on a calm scene, not a cliffhanger, if you actually want to sleep.

## Scenario 4: Walking and Exercise

**Best for:** long walks, treadmill sessions, stretching.

- Keep sessions **light and exploratory**.
- Use **suggested choices** for quick decisions without stopping.
- Stay aware of your surroundings. Use one earbud or transparency mode outdoors.

## Tips for the Best Eyes-Free Experience

1. **Use good audio.** Premium narration (ElevenLabs on EchoQuest's Storyteller plan) makes long sessions much more pleasant. Read why in [ElevenLabs Premium Narration](/blog/elevenlabs-premium-narration-why-voice-quality-changes-everything).
2. **Learn the replay command** so you never lose a line of narration.
3. **Keep your character simple** at first, so there are fewer stats to track mentally.
4. **Ask for summaries** at the start of each session.
5. **Let ambience set the mood:** EchoQuest layers ambient sound under the narration. See [How Ambient Sound Design Elevates RPG Storytelling](/blog/how-ambient-sound-design-elevates-rpg-storytelling).

## Eyes-Free Doesn't Mean Shallow

People sometimes assume audio games must be simple. The opposite is often true. Without graphics, the game can be as big as the story needs: sprawling cities, political schemes, and dozens of characters all live in your imagination, the most detailed renderer there is.

## Start an Eyes-Free Adventure

Put your phone in your pocket, close your eyes, and let the story come to you.

**[Start a free audio adventure →](/library)**
`,
  },
];
