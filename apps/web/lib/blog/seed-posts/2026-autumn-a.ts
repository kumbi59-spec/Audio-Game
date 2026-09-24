import type { ScheduledSeedPost } from "./types";

// Autumn 2026 daily series, part A: 24 Sep – 3 Oct.
export const AUTUMN_2026_A: ScheduledSeedPost[] = [
  {
    publishAt: "2026-09-24",
    title: "Best AI Dungeon Alternatives in 2026: What to Look For in an AI RPG",
    excerpt: "Looking for an AI Dungeon alternative? Here's how to compare AI RPGs on game state, memory, voice narration, accessibility, and price, plus where EchoQuest fits.",
    hero: { src: "/images/worlds/shattered-reaches.svg", alt: "A fractured fantasy landscape of floating islands under a violet sky" },
    content: `# Best AI Dungeon Alternatives in 2026: What to Look For in an AI RPG

AI Dungeon showed millions of people that a language model could improvise a story with them. Since then the field has grown quickly. There are now AI storytelling apps, AI roleplay chatbots, AI-assisted visual novels, and AI Game Masters that run real campaigns with rules behind them. If you're searching for an **AI Dungeon alternative**, you're really asking which of these categories suits the way you like to play.

This guide skips the "top 10" list, because those go out of date fast. Instead it gives you the questions that separate a good AI RPG from a chatbot in costume, and then explains where EchoQuest fits.

## 1. Does It Track Real Game State?

The biggest difference between AI RPGs is whether anything sits underneath the prose. A pure text generator will happily let you lose the same sword three times, heal from zero hit points by accident, or forget that the duke died two scenes ago.

A proper AI RPG keeps a **structured game state** next to the story: hit points, inventory, conditions, quest flags, faction reputation, location, and time. The model narrates, but the state is the source of truth. When you ask "what's in my pack?", the answer comes from real data, not from the model guessing.

**What to test:** pick up a distinctive item early, then ask about it twenty turns later. If it's gone or has changed, the app isn't tracking state.

## 2. How Good Is Its Memory?

Long campaigns need long memory. Look for an app that summarises earlier events, remembers named NPCs, and brings back the consequences of your choices. The best AI Game Masters bring up threads you'd forgotten, like the smuggler you spared in the first hour turning up again in the finale.

## 3. Is There a Game Master or Just a Narrator?

A narrator describes things. A Game Master **runs a game**. That means pacing scenes, asking for rolls when the outcome is uncertain, giving meaningful consequences, and steering toward a satisfying climax instead of wandering forever. If every session with an app feels like an endless middle, you're talking to a narrator.

EchoQuest's GM, powered by Claude, is prompted specifically to act as a Game Master: it respects the world's rules, keeps NPCs consistent, and builds toward story beats. You can read how that works in [How Claude AI Powers the EchoQuest Game Master](/blog/how-claude-ai-powers-the-echoquest-game-master).

## 4. Can You Listen Instead of Read?

Most AI story apps are walls of text. That's fine on a desktop, but tiring on a phone and unusable for many blind or low-vision players. An **audio-first** AI RPG narrates every scene aloud, supports voice input, and lets you play with the screen off.

This is what EchoQuest was built around. Every scene is spoken, free players get browser text-to-speech, and Storyteller subscribers get expressive ElevenLabs narration with distinct NPC voices.

## 5. Is It Genuinely Accessible?

"Accessible" gets used loosely. Here's a practical checklist:

- Every control has a proper label for screen readers (NVDA, JAWS, VoiceOver, TalkBack)
- The whole game works with a keyboard alone, with a visible focus indicator
- New narration is announced through live regions, not just shown visually
- You can adjust speech rate, text size, contrast, and motion

If an app fails any of these, a large share of players can't use it. EchoQuest was designed accessibility-first. See [Why Audio-First Gaming Is a Revolution for Blind Players](/blog/why-audio-first-gaming-is-a-revolution-for-blind-players) for the reasoning.

## 6. Can You Bring Your Own World?

Prebuilt adventures are great for getting started. Before long, though, most players want to play in *their* setting: a homebrew D&D world, a novel they're writing, or a genre nobody else covers. Look for an app that lets you upload lore, rules, and characters and have the AI respect them.

In EchoQuest you do this with a **Game Bible** (a structured world document) or the step-by-step **World Builder Wizard**.

## 7. Is the Pricing Honest?

AI is expensive to run, so every serious AI RPG charges somewhere. What matters is transparency. Look for a real free tier, clear limits, and no dark patterns. EchoQuest's pricing is simple:

- **Free:** three official campaigns, browser narration, 60 AI turns per day, full accessibility support
- **Storyteller ($15/month):** unlimited campaigns, premium ElevenLabs narration, unlimited saves, Game Bible upload, no ads
- **Creator ($29/month):** everything above plus the World Builder Wizard, public world publishing, and creator analytics

## Quick Comparison: Types of AI Dungeon Alternatives

| Type | Strengths | Weaknesses |
| --- | --- | --- |
| Freeform AI story generators | Maximum creative freedom | Little structure, weak memory, no rules |
| AI character chat apps | Great for one-on-one roleplay | Rarely handle combat, inventory, or plot arcs |
| AI visual novels | Pretty presentation | Limited agency, often not screen-reader friendly |
| AI Game Master platforms (like EchoQuest) | Real game state, pacing, voice narration | Less anything-goes than a raw generator |

## Who Should Try EchoQuest?

EchoQuest is a strong fit if you want:

- A campaign with **stakes and structure**, not just improvised prose
- To **listen** to your adventure on a commute, while cooking, or with your eyes closed
- A game that works fully with a **screen reader or keyboard**
- To run adventures in **your own world**

If you just want to write fiction with an AI co-author and no rules, a freeform generator may suit you better, and that's fine. Different tools suit different players.

## Try It Free

The fastest way to compare is to play. Pick a campaign from the library, make a character in under a minute, and see whether an AI Game Master changes how AI storytelling feels to you.

**[Browse the Adventure Library →](/library)**
`,
  },
  {
    publishAt: "2026-09-25",
    title: "Audio Games for Blind People: 10 Genres You Can Play Entirely by Ear",
    excerpt: "A guide to audio games for blind and visually impaired players: 10 genres that work by sound alone, what makes them accessible, and where to start.",
    hero: { src: "/images/worlds/saltbound.svg", alt: "Sound-like ripples spreading across a moonlit sea" },
    content: `# Audio Games for Blind People: 10 Genres You Can Play Entirely by Ear

Audio games are games you can play fully through sound. They've been around for decades, built by small teams and passionate blind developers, and in recent years mainstream studios have started adding serious accessibility too. If you're blind, visually impaired, or supporting someone who is, this guide covers the main genres of **audio games for blind people**, what makes each one work, and how to choose.

## What Makes a Game Truly "Audio-Accessible"?

A game is audio-accessible when every piece of information you need reaches you through sound or a screen reader. In practice that means:

- **Spoken or screen-reader-readable text** for menus, dialogue, and status
- **Spatial audio cues** (left/right panning, distance, pitch) for position and movement
- **Distinct sound signatures** for different objects, enemies, and events
- **No timed visual-only prompts** such as quick-time events you can only see

Keep these in mind as you read. They're the difference between a game that's "technically playable" and one that's actually fun.

## 1. Audio RPGs and Interactive Stories

Narrative games are a natural fit because stories were spoken long before they were written down. Modern **AI-powered audio RPGs** go further than classic branching stories: you can say anything and the Game Master responds.

EchoQuest is built for this genre. Every scene is narrated aloud, you act by speaking or typing, and the interface is tested with NVDA, JAWS, VoiceOver, and TalkBack. There's no map to read and no visual puzzle to solve. The whole game lives in the story.

## 2. Text Adventures and Interactive Fiction

Classic parser games, the "go north, take lamp" style, work very well with screen readers because they are pure text. Thousands of free titles exist in the interactive fiction community. The learning curve is the command syntax, which modern AI games remove by understanding natural language. For background, see [The History of Interactive Fiction](/blog/the-history-of-interactive-fiction-and-where-ai-takes-it-next).

## 3. Audio Action and Adventure Games

Games like *A Blind Legend* showed that binaural audio alone can carry a full action adventure. You follow a guide's voice, hear enemies circling, and swing your sword toward the sound. Wear headphones: stereo positioning is how you aim.

## 4. Racing Games With Audio Assists

Racing sounds impossible without sight, but audio-cue systems that signal upcoming turns, braking points, and track edges through pitched tones have made it possible. Mainstream racing titles have added blind driving assists, and dedicated audio racing games have existed in the community for years.

## 5. Card and Board Games

Poker, blackjack, solitaire, chess, Uno-style games, and word games all translate well to screen readers because the state is discrete and easy to announce. Many accessible online chess and card platforms support keyboard play and spoken board descriptions.

## 6. Puzzle and Word Games

Anagram games, trivia, crosswords with screen-reader support, and audio memory games are great for short sessions. Word games especially reward listening skills that many screen-reader users have already developed.

## 7. Rhythm and Music Games

Rhythm games are sound-first by nature. The best accessible ones map notes to distinct pitches or stereo positions so you can play by ear rather than following a scrolling track.

## 8. MUDs and Multiplayer Text Worlds

MUDs (multi-user dungeons) are online text worlds that date back to the 1970s and are still running. They're screen-reader friendly, social, and deep, and many have large blind player communities. Expect a learning curve and lots of text.

## 9. Fighting Games

This surprises people, but some fighting games have long been popular with blind players because each character's moves have distinctive sounds. Newer releases add dedicated audio accessibility features that describe distance and positioning.

## 10. Strategy and Simulation

Turn-based strategy and management sims work when every unit, resource, and map tile can be queried by keyboard and read aloud. Audio-first strategy games exist in the community, and some mainstream titles are adding better screen-reader support.

## How to Choose Your First Audio Game

- **Want a story?** Start with an audio RPG or interactive fiction.
- **Want reflex challenges?** Try binaural action or rhythm games, and wear headphones.
- **Want something social?** Look at MUDs or accessible card games.
- **Short on time?** Word and puzzle games fit five-minute breaks.

## Tips for Getting Started

1. **Use good headphones.** Stereo matters for spatial games.
2. **Adjust speech rate.** Many experienced screen-reader users play at high speeds. Games should let you choose.
3. **Learn the shortcuts early.** Accessible games usually have a key to repeat the last message. In EchoQuest you can replay the latest narration at any time.
4. **Join a community.** Blind gaming forums and audio game communities are generous with recommendations.

## Why This Matters

Gaming is social and cultural, a shared language for millions of people. When games are built sound-first, blind players get equal access to that culture instead of being left out. It's also good design: audio-first games are excellent for sighted players who want to rest their eyes, play on a commute, or simply be immersed.

**[Start an audio adventure for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-26",
    title: "How to Play D&D Solo With an AI Dungeon Master",
    excerpt: "No group? No problem. Learn how to play D&D-style adventures solo with an AI Dungeon Master: setup, character creation, pacing, and tips for better sessions.",
    hero: { src: "/images/worlds/iron-citadel.svg", alt: "A lone adventurer approaching a mountain fortress" },
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
    hero: { src: "/images/worlds/black-vellum.svg", alt: "Glowing words spilling across an old book of dark vellum" },
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
    hero: { src: "/images/worlds/neon-precinct.svg", alt: "A glowing AI presence overlooking a neon-lit city" },
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
    excerpt: "Use this accessibility checklist to judge whether a video game will work for blind and low-vision players, covering screen readers, audio cues, text, and controls.",
    hero: { src: "/images/worlds/long-watch.svg", alt: "A lighthouse beam guiding the way across a dark coast" },
    content: `# Accessible Video Games: A Checklist for Blind and Low-Vision Gamers

Game store pages love the word "accessible", but a colour-blind filter and a subtitle toggle don't make a game playable for someone who is blind. Before you spend money or hours, it helps to know what to look for.

This checklist sets out the features that matter most for **blind and low-vision gamers**, with the questions to ask before buying.

## Part 1: Screen Reader and Speech Support

These are essential for blind players.

- [ ] **Menus are read aloud**, either by a built-in narrator or through your screen reader
- [ ] **All game text is readable**: dialogue, item descriptions, quest logs, tutorials
- [ ] **Status information is available on demand** (health, location, objectives) with a key press
- [ ] **New events are announced** automatically, not just shown on screen
- [ ] **Speech rate is adjustable** so you can listen at your preferred speed
- [ ] **A "repeat last message" command** exists

**Why it matters:** if you can't navigate the main menu, nothing else counts.

## Part 2: Audio Design

- [ ] **Spatial audio** (stereo or 3D) tells you where things are
- [ ] **Distinct sounds** for different objects, enemies, and interactions
- [ ] **Audio cues for navigation**, such as footstep surfaces, wall bumps, and pathfinding pings
- [ ] **Separate volume sliders** for speech, music, effects, and ambience
- [ ] **Mono audio option** for players with hearing differences in one ear
- [ ] **Audio description of cutscenes**, or cutscenes that can be skipped without losing the story

## Part 3: Visual Options for Low Vision

- [ ] **Scalable text and UI** (not just subtitles)
- [ ] **High-contrast mode** for key elements
- [ ] **Colour-blind modes** that don't rely on colour alone
- [ ] **Screen magnifier compatibility** or built-in zoom
- [ ] **Adjustable camera and motion**, including reduced camera shake and motion blur
- [ ] **Readable fonts**, not thin decorative typefaces

## Part 4: Controls and Timing

- [ ] **Fully remappable controls**
- [ ] **No mandatory timed visual prompts** (quick-time events you must see)
- [ ] **Adjustable game speed** or the ability to pause anywhere
- [ ] **Hold-to-press alternatives** (toggle instead of hold)
- [ ] **Keyboard-only play** on PC, with no mouse required

## Part 5: Information Design

- [ ] **No information conveyed by visuals alone**. Every visual cue has an audio or text equivalent.
- [ ] **Objectives are clearly stated** and can be re-read
- [ ] **Maps are describable**: you can ask where things are relative to you
- [ ] **Puzzles are solvable without sight**, or skippable

## Part 6: Support and Community

- [ ] **An accessibility statement** from the developer that says what's tested and supported
- [ ] **A way to report accessibility bugs**
- [ ] **Patches that fix accessibility issues**
- [ ] **An active blind gaming community** talking about the title

## How EchoQuest Scores

We built EchoQuest to pass this checklist from the start:

- Every scene is **narrated aloud**, and every control is labelled for NVDA, JAWS, VoiceOver, TalkBack, and Orca
- New narration is announced through **ARIA live regions**
- **Full keyboard navigation** with visible focus (see [Keyboard Navigation in EchoQuest](/blog/keyboard-navigation-in-echoquest-play-without-a-mouse))
- **Voice commands** for hands-free play (see [Voice Commands in EchoQuest](/blog/voice-commands-in-echoquest-play-completely-hands-free))
- Adjustable **speech rate**, text size, contrast, and **reduced motion**
- **No timed prompts**: take as long as you need on every turn
- The game world is conveyed entirely through narration, so nothing depends on sight

## How to Use This Checklist

1. **Before buying:** search the game name plus "blind accessible" and look for reviews from blind players.
2. **Check the accessibility page:** reputable developers publish one.
3. **Try a demo or free tier** when one is available.
4. **Share what you learn:** your review helps the next player.

## The Bigger Picture

Accessibility in games has improved a lot, with several major releases now shipping with extensive options. But it's still inconsistent. Checklists like this help players make informed decisions, and they tell developers what "accessible" actually means. For more context, read [Accessibility in Gaming: The State of Play in 2026](/blog/accessibility-in-gaming-the-state-of-play-in-2026).

**[Try an audio-first, fully accessible RPG for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-30",
    title: "Choose Your Own Adventure Games for Adults: Where to Start",
    excerpt: "Loved choose-your-own-adventure books as a kid? Here's how CYOA games for adults have grown up, from branching stories to AI adventures with real consequences.",
    hero: { src: "/images/worlds/verdant-wilds.svg", alt: "A forest path splitting into several trails" },
    content: `# Choose Your Own Adventure Games for Adults: Where to Start

"If you open the door, turn to page 42. If you run, turn to page 17." For many of us, choose-your-own-adventure books were our first interactive stories. We kept a finger in the previous page and cheated shamelessly. The format has grown up since then, and **choose your own adventure games for adults** now range from thoughtful branching fiction to AI-driven stories with no fixed pages at all.

## What Makes a CYOA Game "for Adults"?

"Adult" here doesn't mean explicit. It means **mature storytelling**:

- Moral dilemmas without clean answers
- Consequences that carry across the whole story
- Complex characters with conflicting motives
- Themes like grief, ambition, loyalty, and power
- Genres beyond kids' fantasy: noir, horror, political intrigue, hard sci-fi

## The Three Types of Modern CYOA Games

### 1. Classic Branching Stories

These are like the books: a set of choices at each junction leading to authored outcomes. The writing can be excellent because every path is hand-crafted. The trade-off is limited agency, because you can only choose what the author anticipated.

### 2. Stat-Driven Interactive Novels

These track hidden variables such as reputation, relationships, and skills, which change what's available later. They feel more reactive, and your choices add up to a character.

### 3. AI-Driven Adventures

This is the newest category. Instead of picking from fixed options, you can **type or say anything**, and an AI narrator responds in the context of an authored world. EchoQuest works this way, and it still offers three suggested choices each turn for when you'd rather pick than write.

| | Branching | Stat-driven | AI-driven |
| --- | --- | --- | --- |
| Choices | Fixed | Fixed, stat-gated | Unlimited |
| Replayability | Moderate | High | Very high |
| Writing polish | Highest | High | Varies with the AI and world |
| Surprise | Low on replay | Medium | High |

## Why Adults Are Rediscovering CYOA

- **Time-friendly.** A satisfying session can take 15 minutes.
- **Low barrier.** No reflexes or controller skills needed.
- **Real agency.** Your choices matter in a way passive media can't match.
- **Screen fatigue.** Audio CYOA lets you close your eyes and listen.
- **Personalisation.** AI adventures react to the specific character you bring.

## How to Choose Your First Adult CYOA Game

- **Love literary writing?** Start with hand-authored branching fiction.
- **Love character building?** Try a stat-driven interactive novel.
- **Want total freedom?** Try an AI adventure.
- **Want to listen instead of read?** Choose an audio-first platform like EchoQuest.

## Making Better Choices: Tips for CYOA Players

1. **Play in character, not to "win".** The best stories come from choices your character would make, not the ones that look optimal.
2. **Don't reload after every bad outcome.** Failure is often where the best story beats are.
3. **Explore the unusual option.** In AI games, try things the story didn't suggest.
4. **Replay with a different personality.** A cautious scholar and a reckless mercenary will get very different stories from the same world.

For more on how branching works under the hood, see [The Power of Choice: How Branching Narratives Work in AI RPGs](/blog/the-power-of-choice-how-branching-narratives-work-in-ai-rpgs). If you like hard decisions, read [Crafting Moral Dilemmas](/blog/crafting-moral-dilemmas-how-to-make-players-truly-think).

## A Sample Adult CYOA Moment

> The informant slides the ledger across the table. It proves the captain of the guard is selling weapons to the rebels, the same rebels who fed your village through the winter. The captain's daughter is waiting outside for her father.

What do you do? Expose him? Blackmail him? Warn the rebels? Burn the ledger? In an AI-driven game, every one of those is an option, along with anything else you can think of.

## Start Your Adventure

You don't need to keep a finger in page 42 anymore. Pick a world, make a character, and choose your own path out loud.

**[Start a free adventure →](/library)**
`,
  },
  {
    publishAt: "2026-10-01",
    title: "How to Write a D&D Backstory (With 10 Prompts and Examples)",
    excerpt: "Learn how to write a D&D character backstory that gives your DM hooks to use: a simple structure, common mistakes, and 10 backstory prompts with examples.",
    hero: { src: "/images/worlds/crimson-sands.svg", alt: "A traveller crossing crimson desert dunes at sunset" },
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
    hero: { src: "/images/worlds/black-vellum.svg", alt: "Glowing text lines being read from an ancient book" },
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
    hero: { src: "/images/worlds/mirewood.svg", alt: "Mist drifting through a quiet forest at dusk" },
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
