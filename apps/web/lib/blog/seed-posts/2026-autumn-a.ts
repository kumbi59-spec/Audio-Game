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
    excerpt: "No group? You can still play D&D. How to run a solo campaign with an AI Dungeon Master: setting, character hooks, companions, pacing and quick fixes.",
    content: `# How to Play D&D Solo With an AI Dungeon Master

The hardest part of Dungeons & Dragons usually isn't the rules. It's the calendar. Five adults with jobs and kids, scattered across time zones, almost never line up, and sooner or later the group chat goes quiet. That's why so many people go hunting for ways to **play D&D solo**, and it's why AI Dungeon Masters have become one of the most popular answers.

I'll own my bias up front. I built EchoQuest, an audio-first RPG where an AI Game Master narrates every scene aloud, partly so that nobody has to wait for a Friday night that never comes. So this guide is half field manual and half a record of things I learned the hard way while building one of these GMs. It explains how solo play with an AI DM works and how to set up a good session. After that come the habits that make a one-person campaign feel as full as a crowded table.

## What Is an AI Dungeon Master?

An AI Dungeon Master is a language model that's been given instructions to run a tabletop-style game. It describes the world and voices the NPCs. It asks what you do and decides how things turn out, often with dice rolled behind the scenes. It also keeps track of your character as you go.

The dice deserve a closer look, because that's where plenty of AI storytelling apps cut corners. In D&D, an ability check is refreshingly plain: you [roll a d20 and add the relevant ability modifier](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores), then compare the total to a Difficulty Class, where 10 counts as easy and 20 as hard. EchoQuest follows the same spirit. When you try something with a real chance of failing, the game itself rolls a d20 and adds your stat modifier. Then it checks the total against a difficulty somewhere between 5 (trivial) and 24 (near impossible). The GM never gets to decide you succeeded because it would make a prettier story. It narrates whatever the dice said. Since October 2, that check also resolves in the same turn, so you hear whether you cleared the gap straight away instead of waiting a whole exchange to find out.

In EchoQuest, the thinking behind the GM comes from Claude, the model Anthropic makes, and it's tied to structured game state: HP, inventory, quests, how each NPC feels about you, and the story flags that record what you've done. As a result, the world stays consistent from one turn to the next. Everything is narrated aloud too, so it feels far closer to sitting across from a real DM than scrolling through a chat log.

Honestly, keeping that state trustworthy took more work than the storytelling did. Back in May, a turn that errored halfway could leave half-applied changes behind (gold gone from your purse, say, but no sword in your pack). So I added a full rollback, and now a turn either lands completely or not at all.

## Solo D&D Options Compared

Solo play is older than most people assume, and the tools fall into three rough families:

- **Solo gamebooks and oracle systems:** you roll on tables and interpret the results yourself. The big name here is Mythic, which [introduced solo "oracle" engines back in 2003](https://www.wordmillgames.com/). You ask the oracle yes-or-no questions ("Is the guard asleep?") and the dice answer. There's also Ironsworn, whose [complete digital edition is free](https://shawn-tomkin.itch.io/ironsworn) and comes with a dedicated solo mode. Both are rewarding. Still, you're doing all the work, playing GM and hero at once.
- **Solo adventure modules:** pre-written and tidy, but the branches run out quickly. The moment you want something the author didn't plan for, the book just shrugs.
- **AI Dungeon Master:** responds to anything you try and voices every NPC. It handles the rules and the bookkeeping too.

I have real affection for oracle play. Even so, my view here is firm: an AI DM is the only option where you can simply *play* and let someone else run the game. For most of us, that's the whole point.

## Step 1: Pick a Setting That Suits Solo Play

Some adventures suit a lone hero far better than others. Good choices:

- **Investigation and mystery**, where one sharp mind is enough
- **Survival and exploration**, where isolation is part of the mood
- **Intrigue and politics**, which mostly come down to conversations
- **Heist stories**, especially if you can recruit NPC allies

Big set-piece battles against whole armies are harder alone, unless the story hands you companions. The AI can supply those. Just ask.

On EchoQuest, the prebuilt campaigns are written with a single player in mind. Three I'd point any solo player toward are **The Iron Citadel** (a steampunk thriller in a city-sized iron fortress whose Engines are about to go dark), **Neon Precinct** (cyberpunk noir, where you play a freshly decommissioned synthetic detective) and **Saltbound** (age-of-sail piracy, where your crew has just elected you captain and the navigator has vanished). Notice how each one opens on a problem that lands squarely on *you*. That's the whole solo trick in miniature.

## Step 2: Build a Character With Built-In Hooks

When you play solo, your character is the entire party, so give them handles the story can grab:

- **A goal** they can act on right away ("find my missing brother")
- **A flaw** that creates trouble ("can't resist a wager")
- **A connection** the world can use ("owes money to the harbour guild")

Hooks give the AI Dungeon Master something to chew on. A character with no goal tends to drift, and a drifting hero makes for a drifting story. Need a starting shape? Our guide to [classic RPG character archetypes](/blog/10-classic-rpg-character-archetypes-and-how-to-play-them-well) is a handy place to borrow ideas.

One small tip of my own: phrase the goal as something a stranger could help with or stand in the way of. "Find my missing brother" practically invites the GM to put a witness in the next tavern. "Be the greatest swordsman alive," on the other hand, gives nobody in the world a reason to talk to you tonight.

## Step 3: Tell the DM What You Want

Human DMs run a "session zero" before a campaign begins. In James Haeck's words on D&D Beyond, ["session 0 is a time for everyone in a D&D group to express what they want out of the campaign."](https://www.dndbeyond.com/posts/929-how-to-run-a-session-0-for-your-d-d-game) He also calls managing expectations its most important job. You're the whole group now, so do the same with your AI DM in your first message or your backstory:

- "I want a gritty tone with real danger."
- "Keep combat quick. I'm here for the mystery."
- "Give me a loyal companion NPC I can talk to."

A good AI Game Master will adapt. EchoQuest's should, anyway, because following the player's creativity instead of herding them back onto a path is written straight into its instructions.

## Step 4: Play Actively

The most common beginner mistake in solo play is waiting for the story to happen to you. It won't, or at least not well. Instead:

- **Declare intentions, not just actions.** "I search the desk *because I think the mayor is hiding letters*" gives the DM far more to work with than "I search the desk."
- **Talk to NPCs.** They're your party now. Ask their opinions and argue with them. Better still, recruit them.
- **Chase the odd detail.** A strange smell, a guard who won't meet your eye. These are hooks, and a good GM plants them on purpose.
- **Take risks.** Solo campaigns go stale fast when you play it safe.

That last point is where I changed EchoQuest's rules most recently. On October 2 I gave 0 HP some real bite. If you go down, you don't die permanently, but you don't shrug it off either. You might be captured or robbed. Someone with an agenda of their own might drag you clear, or you might wake hours later with a price to pay. I'm convinced that's the right balance for solo play. Permanent death makes people timid, and a fight with no consequences at all weighs nothing.

And if you truly fumble (a mis-tapped choice, or a voice transcript that went sideways), press U to undo your last turn. It's a single step back, not a time machine, which keeps things honest.

## Step 5: Use Companions to Replace the Party

A solo hero doesn't need to be alone. Wizards of the Coast clearly agrees. When the D&D Essentials Kit came out in 2019, D&D Beyond noted that people had been ["clamoring for one-on-one D&D adventures"](https://www.dndbeyond.com/posts/529-play-one-on-one-or-party-style-with-the-d-d) for a very long time, and the kit answered with sidekick rules built for one Dungeon Master and one player.

With an AI DM you don't even need special rules. Just ask for a companion: a sarcastic rogue, say, or a worried young cleric. A mercenary with private plans works nicely too. Good companion NPCs bring banter and a second opinion. They also give you someone to save, or someone to be betrayed by. See [Writing Compelling NPCs](/blog/writing-compelling-npcs-7-techniques-that-work) for what makes them tick.

On EchoQuest, the GM tracks how each named NPC feels about you on a scale running from sworn enemy to loyal ally, so a companion you keep letting down will notice. On the Storyteller plan, every companion gets a distinct voice as well. Getting that right was one of my more stubborn bugs, as it happens. In late May the NPC voices simply refused to switch, because the characters' dialogue wasn't being woven into the narration, so the narrator kept reading their lines for them. Once that was fixed, I matched NPC voices to each character's gender across the whole voice catalogue. When you're the only human in the room, a companion who sounds like an actual person changes the whole mood.

## Step 6: Pace Your Sessions

Solo play can run on forever, and that's a problem. With no group yawning at 1 a.m., nothing tells you to stop. A bit of structure helps:

- Aim for **one clear objective per session** (reach the tower, question the witness)
- Stop at a **cliffhanger** so you're itching to come back
- Keep a one-line **session log** so you remember what happened

EchoQuest saves your campaign state, so you can pick up exactly where you left off. It auto-saves every five turns, and there's a manual Save button for when the kettle boils mid-scene. Since October 2, your character's progress lives on the server too, which means you can start on your phone and carry on from your laptop. And if you come back after a week with a foggy memory, the Recap button reads the last three scenes aloud.

I'd still keep the one-line log, though. It takes ten seconds, and reading it back a month later is oddly satisfying. By the way, the free tier gives you 60 AI turns a day, which turns out to be a comfortable size for an evening chapter.

## Common Solo D&D Pitfalls (and Fixes)

| Problem | Fix |
| --- | --- |
| "I don't know what to do next." | Ask the DM: "What are my options?" or "What would my character notice?" On EchoQuest you can also press L to hear where you are, or S for your status. |
| Combat feels flat | Describe tactics and the environment, not just "I attack." Kick over the brazier. Fight on the stairs. |
| The story wanders | Restate your goal to the DM and ask for complications. |
| Too easy | Ask for higher difficulty and real danger. See our guide to [setting difficulty in AI RPGs](/blog/setting-difficulty-in-ai-rpgs-from-beginner-to-power-player). |
| You instantly regret a choice | Press U to undo your last turn. Only one step, mind you. Living with the rest is half the fun. |

## Is Solo D&D "Real" D&D?

Yes, and I won't hedge on it. Roleplaying games are about making choices in a shared imaginary world, and in solo play you share it with the DM. The game's own basic rules open by calling D&D a game ["about storytelling in worlds of swords and sorcery"](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/introduction), with no winning or losing in the usual sense. Nothing in that description says you need five chairs filled.

Plenty of players actually find solo campaigns more personal, since every story beat is about *your* character. Nobody else's subplot steals the spotlight, and you never sit through twenty minutes of someone else haggling over rope. For the longer argument, read [Solo RPG vs. Group Play](/blog/solo-rpg-vs-group-play-the-case-for-playing-alone).

## Start Your Solo Campaign

You don't need a group or a rulebook. You don't even need a free Friday night. Pick a world and make a character, and your AI Dungeon Master is ready when you are. So, what kind of hero are you going to be first?

**[Start playing solo for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-27",
    title: "Text Adventure Games Online: A Modern Player's Guide",
    excerpt: "How text adventure games work online today, how AI versions differ from classic parser games, where to find free ones, and tips for your first session.",
    content: `# Text Adventure Games Online: A Modern Player's Guide

Before 3D graphics, before sprites, there were words on a screen: "You are standing in an open field west of a white house." That's how Zork I greets you, and plenty of people can still tell you what comes next (a small mailbox, and yes, you should open it). Text adventures were among the very first computer games. Will Crowther wrote Adventure around a stretch of Kentucky's Mammoth Cave that he and his wife had mapped as cavers, and by May 1977 it had become [the first computer game blockbuster](https://if50.substack.com/p/1976-adventure). The genre never really left, either. It just went quiet for a few decades. Now it's having a comeback. Nostalgia helps, and text happens to work beautifully with a screen reader. The biggest push, though, comes from AI that can finally work out what a player actually means.

I've got a personal stake in this one, because EchoQuest is, at heart, a text adventure that talks. So this guide covers how **text adventure games online** work today, how AI versions differ from the classics, and how to get the most out of either. Have you ever typed GET LAMP at one in the morning? Then you're among friends.

## What Is a Text Adventure?

A text adventure (people also call it interactive fiction, or IF) is a game where the world arrives as words and you act by typing commands. There are no graphics to learn and nothing to aim. Your imagination does the rendering, and honestly, its budget beats any studio's.

Classic text adventures leaned on a **parser**, a small program that understood a short vocabulary like GO, TAKE, OPEN and EXAMINE. Crowther's game could only cope with [two words at a time, a verb and a noun](https://if50.substack.com/p/1977-zork). Zork, started at MIT in 1977, felt like sorcery by comparison, because it could follow "attack troll with sword" or "put jewels in sack". Modern AI text adventures swap the parser for a large language model, so they understand ordinary sentences, rambling asides and the odd typo included.

## Classic Parser Games vs. AI Text Adventures

| | Classic parser games | AI text adventures |
| --- | --- | --- |
| Input | Short commands ("get key") | Natural language ("I pocket the key while the guard looks away") |
| World | Hand-written and finite | An authored setting that grows as you play |
| Replay | The same puzzles every time | A different story on each run |
| Frustration | "I don't understand that." | You rarely get stuck on wording |
| Strength | Tight, clever puzzles | Open-ended freedom and real conversation, with a story that emerges from play |

Both deserve your evenings. Classic interactive fiction is a rich art form with decades of free games behind it, and I'd never tell anyone to skip it. AI text adventures offer something new, though: a world that answers *anything*.

The frustration row is the one I think about most. "I don't understand that" was the parser's polite way of saying no, and it ended a lot of evenings early. So when I wrote the instructions for EchoQuest's Game Master, I told it to handle impossible actions inside the story instead of refusing them ("The stone door doesn't give, however hard you shove"). I also told it that you can ignore the suggested choices and type or say anything at all, and it has to follow you rather than herd you back onto a path.

## Why Text Adventures Are Perfect for Accessibility

Text travels better than any other format. It works with screen readers and braille displays, and it plays just as nicely with text-to-speech and magnifiers. That's why text adventures have been popular with blind gamers for so long. AccessWorld, the American Foundation for the Blind's magazine, [reviewed Thaumistry](https://afb.org/aw/20/9/16766), a modern parser game whose designer, Bob Bates, added a text-only mode to the Windows version so screen readers like JAWS read it properly.

Still, "it's text" doesn't automatically mean "it's accessible". In early 2019 the Interactive Fiction Technology Foundation ran an [accessibility study with real players](https://accessibility.iftechfoundation.org/). NVDA was the most common screen reader among its testers. Blind testers almost universally couldn't make sense of a map drawn out of text characters, and box quotes and full-screen menus tripped up screen reader users too. The Twine game in the study fared far better than the parser one. I learned a version of that lesson myself. Back in May, EchoQuest announced the choices and moved focus to them while the narrator was still mid-sentence, so screen reader users heard two voices at once. On paper, everything was readable. In practice it was a din. Now the choices wait until the narrator has finished.

EchoQuest takes the idea a step further with **audio-first** design: every scene is narrated aloud, and you can respond by voice. It's a text adventure you can play with your eyes closed. It hasn't always been graceful, mind you. In late May, raw JSON from the GM's reply leaked into the spoken narration, so the narrator would happily read out chunks of code in the middle of a scene. Not my proudest week.

## How to Play a Text Adventure Well

### Read (or Listen) Carefully

Descriptions are your map. Details are rarely there by accident, so if the narrator mentions a loose floorboard, it matters. Good authors plant things on purpose, and I asked EchoQuest's GM to do the same: drop a small detail now and pay it off a few turns later. If a line slips past you, press R to hear it again.

### Examine Everything

In classic games, EXAMINE is the hardest-working verb you've got. In AI games, ask questions instead: "What does the inscription say?" "Does the merchant seem nervous?" You'll be surprised how often the answer hands you the next step.

### Talk to Characters

AI text adventures really come alive in conversation. You can bluff, bargain, flatter or interrogate, and NPCs react in character. In EchoQuest they also remember how you've treated them, since your standing with each named character is tracked on a scale from -100 to +100. On the Storyteller plan they even get their own voices.

### Keep Notes

A few lines about names, clues and unanswered questions help a lot on longer adventures. You don't need a notebook for everything, mind. In EchoQuest, Q opens your quest log and I lists your inventory. The character sheet also has a Lore tab that quietly collects whatever you've discovered about the world.

### Be Specific About Intent

"I attack" is fine. "I feint left, then drive my shield into his knee to knock him off the bridge" is better. An AI can reward creativity in a way a parser never could. When something's genuinely risky, EchoQuest rolls a d20, adds your stat modifier and compares it with a difficulty. Since October 2 the result lands in the same turn, so you're no longer left dangling on the bridge for a whole exchange.

## Where to Play Text Adventure Games Online

- **Classic interactive fiction archives** host thousands of free parser games you can play in a browser. The [Interactive Fiction Database](https://ifdb.org/) lists more than 15,000 games, and you can click Play Online on most of them. The [IF Archive](https://ifarchive.org/indexes/if-archive/games/) keeps the files themselves, including HTML, Twine and Ink games that run straight in a browser.
- **Annual IF competitions** showcase new short games every year. [IFComp](https://ifcomp.org/about/comp) has run annually since 1995, every entry is released free to the public, and anyone can sign up as a judge by rating at least five games.
- **AI platforms** like EchoQuest let you play narrated, open-ended adventures in fantasy, sci-fi, noir, horror and more, right in your browser with no download.

## Tips for Your First AI Text Adventure

1. **Start with a structured campaign.** An official campaign gives you clear stakes while you learn the style. Three of the nine worlds in the library are free.
2. **Don't be afraid to experiment.** Try something odd and see how the world reacts. If it goes horribly wrong, U undoes your last turn (one step back, so use it wisely).
3. **Ask the narrator for help.** "Remind me what I know about the missing ship" works. There's also a Recap button that replays your last three scenes.
4. **Replay.** The same campaign can go very differently a second time.

If you've never tried one, our [beginner's guide to your first EchoQuest adventure](/blog/how-to-play-your-first-echoquest-adventure-beginners-guide) walks through a session step by step.

## The Future of Text Adventures

Text adventures were written off as a relic once graphics arrived. It turns out words were never the limitation. Early computers just couldn't understand them very well. Now they can, and I'm convinced the genre that started gaming will be one of its most flexible futures.

I've watched that gap close from the inside. On October 2 I rewrote the GM's instructions so it talks like a seasoned person behind the screen rather than a manual. On the same day I got narration speaking while the GM's reply is still being written, so the pause between your sentence and the story's answer keeps shrinking. Crowther's cave needed two words from you. These days you can just talk. So, what's the first thing you'll type?

**[Play a text adventure online for free →](/library)**
`,
  },
  {
    publishAt: "2026-09-28",
    title: "What Is an AI Game Master? Everything You Need to Know",
    excerpt: "What an AI Game Master is, how it works under the hood, and whether it can really run a tabletop-style RPG: memory, rules, dice and narration in plain English.",
    content: `# What Is an AI Game Master? Everything You Need to Know

"AI Game Master" gets thrown around a lot these days, and it's badly misunderstood. Some people picture a chatbot spinning yarns. Others picture a robot sitting behind a D&D screen. The truth lands somewhere between those two, and it's more interesting than either.

I've spent a good chunk of this year building one, so I've got opinions. This explainer covers what an **AI Game Master** is, how it works under the hood, what it does well, and where it still trips over its own cloak.

## The Short Answer

An AI Game Master (AI GM) is software that runs a roleplaying game for you. It describes the world, plays every non-player character, decides how your actions turn out, and keeps the story moving. That's the same job a human GM or Dungeon Master does at a tabletop. The D&D basic rules call the DM [the game's lead storyteller and referee](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/introduction), and they describe play as a loop: the DM sets the scene, the players say what they do, and the DM narrates what happens. An AI GM runs that exact loop, just without needing snacks.

What separates it from a chatbot is **structure**. A good AI GM pairs a language model with real rules and persistent state. It also needs a feel for pacing. Take those away and you're left with improv that forgets what happened ten minutes ago.

## How an AI Game Master Works

### 1. The Language Model

At the core sits a large language model. In EchoQuest's case that's Claude, made by Anthropic. The model handles the stuff that's miserable to program by hand, like working out what you actually meant, or giving a sulky ferryman a voice you'd believe.

Here's a lesson I learned the hard way, though. The model copies the style of its instructions. My first GM prompt read like a technical spec, and sure enough, the narration came back sounding like one, full of tidy lists and wrap-up sentences. On October 2 I rewrote the whole thing so it talks like a seasoned person behind the screen. Now it opens on one concrete detail and ends on a direct question to you.

### 2. The World Definition

The AI needs to know which world it's running. That comes from a campaign definition, sometimes called a Game Bible, holding setting lore, factions, locations, key NPCs, tone guidelines and rules. It keeps the GM from inventing things that break the world. In EchoQuest the Game Bible is the source of truth: if your world defines its own classes or its own way of rolling stats, the GM uses those instead of falling back on generic warriors and mages. On the Storyteller plan you can write one yourself, with the World Builder Wizard or by uploading a document.

### 3. Game State

Behind the narration, the system tracks structured data:

- Character stats and hit points
- Inventory and currency
- Conditions (poisoned, exhausted, hidden)
- Quest progress and story flags
- Location and time

The AI reads this state before each response and proposes updates afterwards. That's how a potion you drank stays drunk.

In EchoQuest, the game engine writes your character's state and the world's state at the top of every turn, and the GM is told to treat those blocks as fact. Nothing you type can rewrite them, so "I suddenly have a thousand gold" won't get you far. EchoQuest's own list looks a little different from the generic one above: HP, XP and your four core stats, inventory, quests with their objectives, story flags, location and time of day, plus your standing with every named NPC. Its one condition that really bites is DOWN, which means 0 HP. Real state brings real responsibility, mind you. Back in May, a turn that errored halfway could leave changes half-applied, so I added a full rollback. A turn now lands completely or not at all.

### 4. Rules and Randomness

When the outcome of an action is uncertain (picking a lock, say, or dodging a blade), a good AI GM settles it with **dice rolls**, never mere narrative convenience. Randomness creates tension, and it makes success feel earned.

Tabletop D&D does it by having you [roll a d20, add a modifier and compare the total to a Difficulty Class](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores), on a ladder that runs from 5 for very easy up to 30 for nearly impossible. EchoQuest borrows the idea with a shorter ladder (5 trivial up to 24 near impossible). The part that matters most is who rolls. The GM isn't allowed to decide whether you succeed. It asks the game for a check, the server rolls d20 plus your stat modifier, and the GM has to narrate whatever came up. I'll confess this was broken on the web for longer than I'd like: the roll result got filtered out before the GM ever saw it. Since October 2 the check resolves in the same turn, and the dice line shows up before the narration.

### 5. Memory and Summaries

Long campaigns outgrow what any model can hold at once. Anthropic describes a model's context window as its [working memory](https://platform.claude.com/docs/en/about-claude/glossary), and even big windows have soft spots. One Stanford-led study found that models [use information in the middle of a long context noticeably worse](https://aclanthology.org/2024.tacl-1.9/) than information at the start or end. So AI GMs lean on rolling summaries and key facts, which lets earlier events resurface. The informant you betrayed can still hold a grudge ten sessions later.

In EchoQuest, the most recent turns go to the GM word for word. Once a game runs long, a smaller and quicker Claude model folds older turns, ten at a time, into a compact factual summary of decisions, NPCs, places, items and quests. That system bit me too. On October 2 I found that past a certain length, every turn re-summarised the first ten turns and never got any further. Games that weren't saved on the server had a different problem: they simply forgot their oldest turns. Both are fixed now.

### 6. Narration and Voice

Finally, the output has to reach your ears. In EchoQuest, every response is **narrated aloud**. The free tier uses your browser's speech, and the paid plans use expressive ElevenLabs voices, with a different voice for each character, chosen to match that character's gender. Getting that right took some doing. In late May, NPC voices refused to switch because the dialogue wasn't woven into the narration. Then the October rewrite made the GM talk more casually, and all those contractions exposed an old parser bug: a line like "Don't move." switched voices mid-word at the apostrophe. I fixed it in the same change. Narration now starts speaking while the GM's reply is still being written, so you're not sat in silence waiting for a whole paragraph.

## What an AI Game Master Does Well

- **Improvisation:** it can respond sensibly to almost anything you try, including the plan nobody saw coming.
- **Availability:** it's there at 2am, on a lunch break, or for ten minutes on a train.
- **Patience:** it never sighs when you spend an hour haggling with a fishmonger.
- **Consistency of effort:** every NPC gets a voice, every scene gets description, even at the end of a long night.
- **Accessibility:** it can be fully audio-driven and screen-reader friendly, which physical tabletop play often isn't.

That last one is why EchoQuest exists. A battle map and a rulebook full of tables aren't much use if you can't see them. A GM who talks, and waits for you to talk back, is.

## Where AI GMs Are Still Improving

I'd rather be straight with you: AI Game Masters aren't perfect.

- **Very long-term continuity** can drift without good summarisation. (See my summary bug above. I'm not immune.)
- **Tactical grid combat** is harder to get across in pure narration than on a battle map. EchoQuest doesn't have a grid at all. Fights play out through narration and sound cues, and S reads your status whenever you want the numbers.
- **Reading the room** at a real table, noticing that a friend is bored or upset, is a human skill. An AI can't see your face, so it needs you to say so.

The best platforms soften these with state tracking and structured campaigns, and by letting you steer ("Let's skip ahead to the city"). If the dice go badly and you just want a do-over, EchoQuest has a single-step undo on the U key. And if you hit 0 HP, nobody dies for good, though you'll get a proper setback. You might be captured, or wake hours later with a price to pay.

## AI GM vs. Human GM: Which Is Better?

They're different experiences, and I'll take a side anyway: an AI GM can't replace your group, and it shouldn't pretend to. A human GM brings friendship and years of shared history, the kind of chemistry where the whole table groans at the same terrible pun. What an AI GM must do is cover the gaps. It's on call whenever you are, and its whole story bends around you. My advice is to do both: a human-run game every other week, with AI sessions in between. See [From Tabletop to AI: How EchoQuest Reimagines D&D](/blog/from-tabletop-to-ai-how-echoquest-reimagines-dd) for more on that.

## How to Get the Best From an AI Game Master

1. **Set expectations early:** tone, difficulty and content limits. Human tables do this in a "session zero", often with free tools like Monte Cook Games' [Consent in Gaming](https://www.montecookgames.com/store/product/consent-in-gaming/) checklist or the [lines and veils approach](https://slyflourish.com/safety_tools.html) Sly Flourish describes. With an AI, a sentence in your first action does the job. EchoQuest's library also tags every world with its genre, tone and difficulty, so you know roughly what you're walking into.
2. **Be descriptive:** detailed actions get detailed responses.
3. **Ask questions:** "What do I know about this faction?"
4. **Steer when needed:** you're allowed to say "Let's move on."
5. **Give feedback:** if a scene isn't working, say so.

## Try an AI Game Master Today

Honestly, the best way to understand an AI GM is to play with one. EchoQuest's free tier includes three official campaigns with full narration and 60 free AI turns a day. Make a character, speak or type your first action, and see how it responds. What's the first thing you'd ask a Game Master who never gets tired?

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
    excerpt: "How to write a D&D backstory your Game Master can actually use: a five-part formula, common mistakes to avoid, and 10 backstory prompts with examples.",
    content: `# How to Write a D&D Backstory (With 10 Prompts and Examples)

A great backstory does more than explain where your character came from. It hands your Game Master hooks: people, debts, secrets and goals they can drag into the story. Human Dungeon Master or AI Game Master, the effect's the same. A strong backstory makes the campaign about *you*.

The rules have quietly nudged players this way for years. The D&D basic rules define bonds as [a character's connections to people, places, and events in the world](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/personality-and-background), and a flaw as anything someone else could exploit "to bring you to ruin". Read those two lines again and you'll notice something sly. They're a GM's toolkit, and you're the one handing it over.

I think about backstories more than is probably healthy, because EchoQuest's Game Master rereads yours on every single turn. So this guide gives you a simple structure for writing a **D&D backstory**, the mistakes worth dodging, and ten prompts to get you moving. Have you ever written three pages of lore and watched your DM's eyes glaze over by page two? Then this one's for you.

## The 5-Part Backstory Formula

You don't need five pages. You need five ideas. Sly Flourish, one of the most practical DM advice sites around, says to [describe your backstory in one to five sentences instead of one to five pages](https://slyflourish.com/building_great_dnd_characters.html). The same article admits its author doesn't even start filling in his own backstory until he's played an adventure and reached 2nd level, which I find oddly comforting.

1. **Origin:** where and how they grew up, in one or two sentences.
2. **Turning point:** the event that pushed them onto the adventurer's road.
3. **Goal:** what they want right now, concrete enough to act on.
4. **Flaw or fear:** what keeps getting them into trouble.
5. **Loose thread:** an unresolved person, debt or mystery the story can pick up.

The loose thread matters most, because it's the hook the GM will actually grab. As Riley Silverman wrote for D&D Beyond, bonds [help you establish roots that connect your character to the world](https://www.dndbeyond.com/posts/1462-creating-a-backstory-for-your-first-d-d-character) they live in. A loose thread is a root with a bit of frayed rope still attached. If you only have the energy for one of the five, write that one.

## Example Backstory Using the Formula

Here's one I made up to show the formula at work. Mira isn't anybody's real character, just an illustration:

> **Origin:** Mira grew up on a salt barge, the youngest of six, learning knots before letters.
> **Turning point:** When a customs cutter sank the barge, Mira was the only one who swam ashore.
> **Goal:** Find out who tipped off the customs captain.
> **Flaw:** She trusts no one in uniform, even when she should.
> **Loose thread:** Her eldest brother's body was never found.

That's five sentences, and look how much it gives a GM. There's a villain (the informant) and a faction (customs). On top of that you've got a personal mystery in the missing brother, plus a flaw that's begging to be tested the first time a well-meaning guard offers to help.

Honestly, the brother is the bit I'd bet on. A body that was never found is practically a promise that somebody turns up in the third act, probably at the worst possible moment.

## Common Backstory Mistakes

- **The finished hero.** If your character has already beaten their nemesis and mastered their craft, the story has nowhere left to go. Leave the big win for the table.
- **The orphan with no one.** Tragedy is fine, but a character with *no* living connections gives the GM nothing to use. Leave someone alive. Sly Flourish's advice to GMs is to [build relationships between characters and key NPCs](https://slyflourish.com/integrating_characters.html) ("Maybe they're old war buddies"), and you can save your GM the trouble by writing one in yourself.
- **The novel.** Ten pages of lore is hard to use. Keep it short and let the rest surface in play. I'd much rather EchoQuest's GM chew on five sharp sentences every turn than skim a family tree.
- **The lone wolf who refuses everything.** Moody is fine. Unwilling to engage is not, because a character who turns down every hook leaves the GM talking to a wall.
- **Overpowered secrets.** "Secretly the heir to the empire *and* a dragon" tends to swallow the whole campaign.

## 10 D&D Backstory Prompts

Use these as starting points. Each one has a hook built in, so pick whichever grabs you and run it through the five-part formula.

1. **The Borrowed Name.** You're travelling under the name of someone who died. Their family doesn't know yet.
2. **The Unpaid Debt.** A temple healed your dying parent. Now the priests want payment, and not in gold.
3. **The Failed Apprentice.** Your master expelled you the night before your final test, without a word of explanation. You want to know why.
4. **The Wrong Prophecy.** A seer named you as the one who will "open the last door". You've no idea what that means, but some people are very interested in you.
5. **The Deserter.** You walked away from a battle you knew would be a massacre. Your old regiment still has your name on a list.
6. **The Letter Carrier.** You've carried a sealed letter for three years, after promising a dying stranger you'd deliver it. You still haven't found the recipient.
7. **The Stolen Voice.** A curse took your singing voice, which used to be your living. The bard who has it now is famous.
8. **The Collector's Mark.** A secretive guild tattooed you as a child. Every so often, someone recognises the mark.
9. **The Second Chance.** You were hanged for a crime you really did commit, and you woke up alive. Someone saved you for a reason.
10. **The Map Fragment.** Your grandmother left you a third of a map. Two other people hold the other pieces.

To show how a prompt turns into something playable, here's a second example of my own, built from The Letter Carrier. Once again, it's an illustration I wrote, not a real player's character:

> **Origin:** Tobin is a ferryman's son from a slow brown river, more at ease with rope and tide tables than with people.
> **Turning point:** A stranger died on his ferry, pressed a sealed letter into his hands and made him swear to deliver it.
> **Goal:** Find the woman named on the envelope before the wax seal crumbles.
> **Flaw:** He keeps promises long past the point of sense.
> **Loose thread:** Two different people have offered to buy the letter, and one of them knew the stranger's name.

## How Backstory Works With an AI Game Master

When you create a character in EchoQuest, the backstory you write goes straight to the AI Game Master, which runs on Claude. It's the third step of character creation, next to a few optional fields for things like pronouns and appearance. You can skip it entirely if you'd rather find out who you are as you play. And if a world comes with its own backgrounds, they're listed right there so you can mention one.

Here's the design choice I care about most: your backstory isn't read once and then forgotten. It sits in the character block the GM reads at the top of every turn, right beside your HP and your inventory. On top of that, when I rewrote the GM's instructions on October 2, I told it to plant small details and pay them off turns later, and to bring old threads back when they hurt or help the most. In practice, the GM uses your details to:

- Introduce NPCs connected to your past
- Add complications that test your flaw
- Build toward your stated goal
- Pay off loose threads at dramatic moments

Short, concrete backstories work best. A few specific names and one clear goal beat a vague paragraph about "a troubled past" every time. So name the informant, even if it's just "a man called Pell". Anything with a name, the GM can put in a room with you. Once one of those people shows up, EchoQuest also tracks how they feel about you on a scale from -100 to +100, so a reunion can go very sweetly or very sour.

There's a darker bonus, too. Since October 2, dropping to 0 HP brings a real setback instead of a shrug, and one option the GM has is having you dragged clear by someone with an agenda. Nobody dies permanently, but a loose thread from your past makes a wonderful rescuer with strings attached.

## Quick Backstory Checklist

- [ ] Can I summarise it in five sentences?
- [ ] Does my character want something concrete *right now*?
- [ ] Is there at least one living person connected to my past?
- [ ] Is there an unresolved mystery or debt?
- [ ] Does my flaw create interesting problems rather than just blocking the story?

If you're stuck on the character concept itself, browse [10 Classic RPG Character Archetypes](/blog/10-classic-rpg-character-archetypes-and-how-to-play-them-well) for inspiration. Still blank? The same Sly Flourish article points to the "This Is Your Life" tables in Xanathar's Guide to Everything, which roll up siblings and old regrets for you. A random die roll has unstuck more characters than any amount of staring at a blank page.

## Put Your Backstory to Work

The best way to test a backstory is to play it. Create a character on EchoQuest, paste in your five sentences, and see how quickly the AI Game Master tugs on your loose thread. Three campaigns are free, so it costs you nothing but an evening. Which thread do you think it'll pull first?

**[Create your character →](/library)**
`,
  },
  {
    publishAt: "2026-10-02",
    title: "Games You Can Play With a Screen Reader: NVDA, JAWS and VoiceOver Tips",
    excerpt: "Which games work with a screen reader, plus tested settings and keystrokes for NVDA, JAWS, VoiceOver and TalkBack when you play browser, PC and mobile games.",
    content: `# Games You Can Play With a Screen Reader: NVDA, JAWS and VoiceOver Tips

Screen readers were built for documents and websites, not games. Even so, a growing pile of games works well with them, especially browser-based and text-driven ones. This guide covers which **games work with a screen reader**, and how to set up NVDA, JAWS, VoiceOver and TalkBack so playing feels smooth instead of like a fight with your own software.

A quick word on who uses what, because it shapes the advice. In WebAIM's [most recent screen reader user survey](https://webaim.org/projects/screenreadersurvey10/) (1,539 responses, gathered in December 2023 and January 2024), JAWS and NVDA ran almost neck and neck as primary desktop screen readers at 40.5% and 37.7%, with VoiceOver at 9.7%. So I've given the two Windows readers the most room. Which one is yours?

## Which Kinds of Games Work Best With Screen Readers?

Screen readers work best with games whose interface is built from **real, semantic elements** (buttons, headings, lists, live regions) instead of pixels painted onto a canvas. That gives us a handy rule of thumb:

- **Great:** browser games built with accessible HTML, text adventures, AI RPGs, card and board games, trivia, MUDs. Lichess is a lovely example: its [Blind Mode](https://lichess.org/page/blind-mode-tutorial) names NVDA, JAWS, VoiceOver and Orca, and it can lay the board out as a real HTML table. You simply type moves like "Nf3" into a command field. On the MUD side, [Alter Aeon](https://www.alteraeon.com/) offers a blind-friendly client that it says works with most screen readers.
- **Mixed:** mobile games (it depends entirely on the developer), and turn-based strategy games that let you query the board from the keyboard.
- **Hard:** canvas-rendered or engine-rendered games without a built-in narrator. These need self-voicing or dedicated audio design. It can be done, mind you. Naughty Dog shipped The Last of Us Part II with [text-to-speech narration of on-screen text plus combat and traversal audio cues](https://www.naughtydog.com/blog/the_last_of_us_part_ii_accessibility_features_detailed). That's a studio-sized effort, though, and most games don't make it.

Browser-based **AI RPGs** like EchoQuest sit near the top of the friendly list, because the whole game is text and speech. There's no map to describe and no reticle to aim.

## NVDA Tips for Gaming (Windows, Free)

NVDA is free and open source, and it's one of the most popular screen readers in the world. Every keystroke below comes from the [NVDA User Guide](https://download.nvaccess.org/documentation/userGuide.html), using the desktop layout.

- **Browse vs. focus mode:** NVDA switches to focus mode on its own when you land in a text box. In a game interface, press **NVDA+Space** to toggle between the two if your keystrokes aren't reaching the game. This one matters a lot for games with single-letter shortcuts. In browse mode, NVDA claims letters like H (next heading), L (next list) and I (list item) for itself, so EchoQuest's own H, L and I never arrive.
- **Keep browse mode, lose the letter keys:** if you'd rather keep reading with the arrows, **NVDA+Shift+Space** switches single-letter navigation off for the current page only. The guide suggests exactly this for web apps with their own one-key shortcuts.
- **One key at a time:** **NVDA+F2** passes just the next key press straight through to the page.
- **Live regions:** make sure "Report dynamic content changes" (in the Object Presentation settings, toggled with **NVDA+5**) is on, so new content gets announced as it appears.
- **Speech rate:** plenty of gamers run faster than the default. Press **NVDA+Ctrl+Left or Right Arrow** until you reach Rate in the synth settings ring, then **NVDA+Ctrl+Up or Down Arrow** to change it (add Shift on the laptop layout). If that's still too slow for you, the Speech settings also have a Rate boost option for synthesizers that support it.
- **Speech viewer:** you'll find it under Tools in the NVDA menu. It shows the text being spoken, which is handy for sighted helpers, or for working out exactly what a game announced.

## JAWS Tips for Gaming (Windows)

Freedom Scientific's own documents cover all of these, and the [JAWS keystrokes reference](https://support.freedomscientific.com/Content/Documents/Manuals/JAWS/Keystrokes.pdf) is worth keeping in a tab.

- **Virtual PC cursor:** if a game's keyboard shortcuts are being intercepted, toggle the Virtual PC cursor off with **Insert+Z**. Freedom Scientific gives the same advice for [using Gmail's own single-key commands](https://doccenter.freedomscientific.com/doccenter/archives/2021_03_18_JAWS_and_Gmail_Standard_View/Using_JAWS_with_Gmail_in_Standard_View_Resource_File.pdf), and a game with letter shortcuts works the same way. Press it again to get your reading cursor back.
- **Forms mode:** JAWS drops into forms mode when you reach an edit field. According to the [JAWS Quick Start Guide](https://support.freedomscientific.com/Content/Documents/Manuals/JAWS/JAWS-Quick-Start-Guide.pdf), Auto Forms Mode is on by default, so leave it that way. You can change it in Quick Settings (**Insert+V**), including per website under Personalize Web Settings.
- **Verbosity:** turn verbosity down during play, so JAWS spends less breath describing every control and more on the game. The JAWS Startup Wizard has a verbosity step, and you can run it again any time from the Help menu in the JAWS window (**Insert+J**, then **Alt+H**).
- **Pass-through key:** **Insert+3** on the number row (**Caps Lock+3** on the laptop layout) passes the next keystroke straight to the application.
- **Speech rate:** **Alt+Ctrl+Page Up or Page Down** nudges the rate temporarily, and adding the Windows key makes the change stick.

## VoiceOver Tips (macOS and iOS)

- **Web rotor:** on a Mac, **VO+U** [opens the rotor](https://support.apple.com/guide/voiceover/voiceover-rotor-mchlp2719/mac) so you can jump between headings, landmarks and other parts of a page.
- **Quick Nav:** this is the Mac's equivalent of browse-mode letter keys. Apple splits it in two: **VO+Q** toggles single-key Quick Nav, and **VO+Shift+Q** toggles arrow-key Quick Nav ([Apple's Quick Nav guide](https://support.apple.com/guide/voiceover/quick-nav-vo27943/mac) also covers pressing Left and Right Arrow together). Switch single-key Quick Nav off while you play a game that uses letter shortcuts, and switch arrow-key Quick Nav off while you type in an action field so the arrows behave normally.
- **iOS speech rate:** rotate two fingers like a dial to reach Speaking Rate on the [VoiceOver rotor](https://support.apple.com/guide/iphone/control-voiceover-using-the-rotor-iph3e2e3a6d/ios), then swipe up or down. If it's missing, add it under Settings, Accessibility, VoiceOver, Rotor.
- **Screen Curtain:** a [three-finger triple tap](https://support.apple.com/guide/iphone/use-voiceover-gestures-iph3e2e2281/ios) blacks out the display while everything keeps working (a quadruple tap if Zoom is on too). It saves battery on long sessions and keeps nosy neighbours on the bus out of your quest log.
- **Safari vs. Chrome:** Safari is VoiceOver's home turf on Apple devices. In the WebAIM survey above, VoiceOver with Safari was the third most common screen reader and browser pairing overall, so it's the safest place to start.

## TalkBack Tips (Android)

- **Reading controls:** TalkBack lets you [reassign most gestures](https://support.google.com/accessibility/android/answer/6151827?hl=en) (TalkBack settings, then Gestures). "Read from the next item" is one of the actions on offer, and so is "Pause or resume speech", which I'd happily give a spare gesture during play.
- **Speech rate:** set it in TalkBack settings under [Text-to-speech settings](https://support.google.com/accessibility/android/answer/6006589?hl=en). For quick changes mid-game, pick Speech rate in the [reading controls](https://support.google.com/accessibility/android/answer/6007066?hl=en) and swipe up for faster or down for slower.
- **Browser choice:** I'd start in Chrome, especially if you want to use voice input. MDN notes that browser speech recognition, which voice input relies on, [doesn't work in some widely used browsers](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). In Chrome your audio goes to a recognition server, so you'll need a connection. I learned how fragile the microphone side is on September 28, when I found the mic was blocked on EchoQuest's own pages and voice input quietly did nothing.

## Avoiding "Double Speech" in Self-Voicing Games

Some games speak aloud *and* expose their text to your screen reader, so you hear everything twice. You've got two options:

- Turn off the game's built-in narration and rely on your screen reader, **or**
- Keep the game's narration (often more expressive) and mute your screen reader during narration.

EchoQuest gives you control here, and I'll be honest that I learned this the hard way. Back in May, the game announced the choices and moved focus onto them while the narrator was still mid-sentence, so screen reader users heard two voices talking over each other. Technically accessible, practically a racket. Now the choices wait until the narrator has finished, then get announced as one summary, and focus lands on the first choice (Settings can send it to the text box instead).

Here's how the two options play out in EchoQuest today. If you keep the narrator's voice for the story, the story text stays hidden from your screen reader for as long as that voice is switched on, so you won't hear it twice. Your screen reader still handles the menus and controls, along with short announcements like damage taken or items picked up. If you'd rather hear the story in your own screen reader's voice at your own speed, drag the narrator volume to zero. The narration then becomes readable in a labelled "Story narration" region you can jump to like any other landmark. Our [technical write-up on screen readers](/blog/how-screen-readers-work-with-echoquest-a-technical-deep-dive) explains how the live regions are set up.

## What to Look for in a Screen-Reader-Friendly Game

- Clear **headings and landmarks**, so you can jump around quickly
- **Labelled buttons**, not "button, button, button"
- **Live announcements** for new content
- A **keyboard shortcut** to repeat the last message (R does it in EchoQuest)
- **No time limits** on reading
- A published **accessibility statement**

I'd add one more that people rarely mention: decent contrast for players with some sight. On October 2 I added an automated accessibility suite (Playwright plus axe) to EchoQuest's CI, and the first run was humbling. White text on the violet accent came out at 3.99:1, under the 4.5:1 minimum, and in high-contrast mode some buttons were white on yellow at 1.07:1. Both are fixed. It also caught a nasty one where, after a failed turn, the choices came back but stayed disabled, which left a keyboard player with no way to retry.

## A Quick Test You Can Run on Any Browser Game

1. Load the game and press **Tab** repeatedly. Does focus move in a logical order, and does every element get announced with a meaningful name?
2. Trigger an in-game event. Is it announced without you having to move focus?
3. Try to complete one core action (start a game, make a move) without touching a mouse.

If a game passes all three, it's probably worth your evening. Fail the first one and I wouldn't bother with the rest.

## Play EchoQuest With Your Screen Reader

EchoQuest is built from plain semantic HTML and standard ARIA, so it's meant to work with the screen reader you already use: NVDA, JAWS, VoiceOver, TalkBack, and Orca on Linux, which reads the same labels. The axe suite runs against the web app in CI, and the free tier includes three narrated campaigns. Everything works by keyboard, too. Press H at any point for the shortcuts, or [tell me](/contact-us) when something doesn't read the way it should. So, which campaign will you try first?

**[Start playing with your screen reader →](/library)**
`,
  },
  {
    publishAt: "2026-10-03",
    title: "Games You Can Play With Your Eyes Closed: Audio RPGs for Commutes, Chores and Bedtime",
    excerpt: "Audio RPGs you can play with your eyes closed, and how to fit one into a commute, the washing-up or bedtime, plus the settings that make eyes-free play easy.",
    content: `# Games You Can Play With Your Eyes Closed: Audio RPGs for Commutes, Chores and Bedtime

Most games want your eyes and your hands at once. On a packed train that's a non-starter, and with a laundry basket on your hip it isn't much better. Then there's bedtime, when another hour of screen glare is the last thing you need. **Games you can play with your eyes closed** fill that gap neatly. And the best of them aren't throwaway distractions. They're full adventures, with plots that stretch across weeks and characters who remember what you told them.

I've got a stake in this, so I'll say it plainly. I built EchoQuest audio-first, with blind and low-vision players as a first-class audience rather than an afterthought. The happy side effect is that the very same design suits anyone whose eyes happen to be busy elsewhere. Here's how I'd fit an audio RPG into an ordinary day.

## Why Eyes-Free Gaming Is Taking Off

- **Screen fatigue:** after a day of screens, lots of people want to rest their eyes and still do something absorbing. The American Optometric Association even has a name for the problem, [computer vision syndrome, also called digital eye strain](https://www.aoa.org/healthy-eyes/eye-and-vision-conditions/computer-vision-syndrome), and its advice is a 20-second break every 20 minutes to look at something 20 feet away. An audio game is a pleasant way to stretch that break out.
- **The podcast habit:** people already listen on commutes and during chores. Edison Research's latest Infinite Dial survey found that [58% of Americans aged 12 and over, around 167 million people, consumed a podcast in the last month](https://ssrs.com/insights/the-infinite-dial-2026/). Audio games simply add a way to talk back.
- **Accessibility:** eyes-free design helps blind and low-vision players, and it happens to suit everyone else too.
- **Better voice tech:** speech recognition and natural-sounding narration have come a remarkably long way. Back in 2016, Microsoft researchers announced a recognizer whose [5.9 percent error rate was about equal to that of people asked to transcribe the same conversation](https://blogs.microsoft.com/blog/2016/10/18/historic-milestone-microsoft-researchers-achieve-human-parity-conversational-speech-recognition/). Synthetic voices have grown far warmer since then as well.

## What Makes an Audio RPG Work Eyes-Free?

A game is truly eyes-free when:

1. **Everything important is spoken**: the scene and your choices, plus your status
2. **You can respond by voice** or with simple, memorable keys
3. **There's no time pressure**, so you can pause for a doorbell
4. **You can ask for a recap** when your attention drifts

EchoQuest was designed around exactly this checklist. Every scene is narrated, and the choices are read out once the narrator finishes. That "once" took me some work, by the way. Back in May I discovered the choices were being announced and focused while the narrator was still mid-sentence, so screen reader users heard two voices talking over each other. Now the choices politely wait their turn. You can speak your actions as well, and nothing in the game runs on a timer, so the story just sits there patiently while you answer the door.

For catching up, you've got a few routes. Press R (or say "replay") to hear the last scene again. L, or "where am I", tells you your location, and S, or "read status", gives you your health and where you are. The Recap button reads the last three scenes back to back. And since the Game Master answers anything, you can always just ask it, "What's happening?" (that one uses up a turn, mind you).

## Scenario 1: The Commute

**Best for:** bus, train or passenger-seat travel. (Never play anything interactive while driving. Keep your attention on the road.) I'm not being fussy about that. NHTSA counted [3,208 people killed in US crashes involving distracted drivers in 2024](https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/813790). No story is worth adding to that figure.

- **Use earbuds** with a built-in mic for voice input, or tap the suggested choices.
- **Pick scenes with natural pauses:** exploration and conversation work better than a tense fight when your stop could come up at any moment.
- **Play 10 to 20 minute chapters:** aim to reach one objective per journey.

Commutes are where the gremlins in my narration code liked to hide, honestly. In May, Chrome's built-in voice had a race condition and gave up after roughly 15 seconds, so I had to engineer around it. Then in late May I found the ambient soundtrack was completely silent on mobile, which is a fine way to make a pirate harbour sound like a library. And on September 28 the browser narrator began cutting out a few seconds into a scene. Each of those is fixed now.

More recently, on October 2, I made the narration start speaking while the GM's reply is still being written. On premium voices, the next clip is fetched while the current one plays, too. On a rattling train, trimming that dead air matters more than you'd guess. Your character's progress is also saved on the server now, so a chapter you start on the bus can finish on your laptop at home.

## Scenario 2: Chores and Cooking

**Best for:** washing up, laundry, gardening, meal prep.

- **Voice commands are your friend:** your hands are busy, but your voice isn't. Press V (or nudge the mic button with a knuckle) and say what you do. "Option two" or "pick three" takes a suggested choice, and "pause" stops the narrator when the pan starts spitting.
- **Turn up the narration volume** and play it through your phone speaker, or pair a Bluetooth speaker on the counter.
- **Choose conversational campaigns:** mysteries and intrigue suit this mode beautifully, and you can interrogate suspects while chopping onions.

When you speak a free-form action, EchoQuest reads back what it heard and sends it after a few seconds unless you hit Cancel. That way "attack the lizard" never goes out when you clearly said "wizard". Voice input also had its own embarrassing moment. In September I found the microphone was actually blocked on EchoQuest's own pages, so voice input quietly did nothing at all. That one's fixed too.

See [Voice Commands in EchoQuest](/blog/voice-commands-in-echoquest-play-completely-hands-free) for a full guide.

## Scenario 3: Winding Down at Night

**Best for:** relaxing before sleep without bright screens.

There's decent science behind putting the screen away. In a 2015 study published in PNAS, people who read on a light-emitting e-reader in the hours before bed [took longer to fall asleep and secreted less melatonin than when they read a printed book](https://www.pnas.org/doi/10.1073/pnas.1418490112), and they felt less alert the next morning. A story you only listen to sidesteps most of that, as long as the screen really does go dark.

- **Pick the dark theme, then hide the screen altogether.** EchoQuest's display settings let you choose dark or light, or follow your system. On an iPhone with VoiceOver running, [Screen Curtain turns the display off while the phone stays active](https://support.apple.com/guide/iphone/keep-the-screen-off-iph756788a12/ios) (triple-tap with three fingers). Android's TalkBack has a similar [Hide screen option](https://support.google.com/accessibility/android/answer/6006589?hl=en). I'd reach for these instead of simply locking the phone, because a web page's audio doesn't always keep going once the screen locks.
- **Slow the narration speed** slightly for a calmer listen. The [ key lowers it a notch at a time. Premium voices used to drift in pitch whenever the playback speed changed, so in May I locked the pitch in place. A slowed-down narrator now sounds relaxed instead of groggy.
- **Choose gentle genres:** exploration, cosy fantasy or slow-burn mysteries rather than horror. In the library, The Verdant Wilds (an ancient forest with a hopeful tone) is about as soothing as it gets. Personally, I'd save The Black Vellum, a creeping cosmic-horror investigation, for daylight. And if the cosy world you want doesn't exist yet, the Storyteller plan lets you build a private one with the World Builder Wizard.
- **Set a stopping point:** end on a calm scene, not a cliffhanger, if you actually want to sleep. Tell the GM you're turning in for the night and ask for a quiet moment to stop on.

## Scenario 4: Walking and Exercise

**Best for:** long walks, treadmill sessions, stretching.

- Keep sessions **light and exploratory**.
- Use **suggested choices** for quick decisions without stopping. "Pick two" is far easier to puff out mid-stride than a full sentence.
- Stay aware of your surroundings. Wear one earbud outdoors, or use something like [Transparency mode on AirPods](https://support.apple.com/en-us/108918), which lets outside sound in so you can hear what's going on around you.

Here's my unpopular opinion: on a treadmill, an audio RPG beats a podcast outright. A podcast can't ask you whether you trust the smuggler, and that one question does wonders for the last ten minutes of a run.

## Tips for the Best Eyes-Free Experience

1. **Use good audio.** Premium narration (ElevenLabs on EchoQuest's Storyteller plan) makes long sessions much gentler on the ears, and each NPC gets a voice of their own. Read why in [ElevenLabs Premium Narration](/blog/elevenlabs-premium-narration-why-voice-quality-changes-everything). On the free tier you get your browser's built-in voices, which are perfectly serviceable once you find one you like.
2. **Learn the replay command** so you never lose a line of narration. That's R on the keyboard, or "replay" spoken aloud.
3. **Keep your character simple** at first, so there are fewer stats to juggle in your head. Press S whenever you want your health read out, and C opens the full character sheet.
4. **Ask for summaries** at the start of each session. The Recap button covers the last three scenes, which is usually all you need to slip back in.
5. **Let ambience set the mood:** EchoQuest layers ambient sound under the narration. See [How Ambient Sound Design Elevates RPG Storytelling](/blog/how-ambient-sound-design-elevates-rpg-storytelling). In May I added forge, storm and underwater tracks, and made the soundtrack duck under sound cues so the important clunks cut through. Around the same time I gave the volume slider a squared curve, so the bottom of the range is properly quiet for late-night listening. On May 16 I also caught the soundtrack quietly sinking to silence after about five turns. That's precisely the kind of bug a listener notices long before a viewer does. Press M whenever you'd rather hear the narrator alone.

## Eyes-Free Doesn't Mean Shallow

People sometimes assume audio games must be simple. Often it's the reverse. Without graphics, a game can be as big as its story needs: sprawling cities and political schemes, with dozens of characters, all living in your imagination, which is the most detailed renderer there is.

Audio-only games have been proving this for years. In [A Blind Legend](https://store.steampowered.com/app/437530/A_Blind_Legend/), from the studio Dowino, you play Edward Blake, a blind knight guided by his daughter Louise through binaural 3D sound (headphones are compulsory). [The Vale: Shadow of the Crown](https://www.afb.org/aw/22/12/17800), from Falling Squirrel, casts you as a blind princess, and AccessWorld's reviewer clocked at least five hours of play. Those two are action games built on precise listening. An audio RPG like EchoQuest leans the other way, toward conversation and choice. Still, the lesson holds for both: your ears can carry an entire world. That conviction is why I put EchoQuest's audio layer first and laid the visuals on top, instead of the other way round.

## Start an Eyes-Free Adventure

Put your phone in your pocket, close your eyes and let the story come to you. Three of the nine worlds in the library are free to play, along with 60 AI turns a day. So where are you going to listen first?

**[Start a free audio adventure →](/library)**
`,
  },
];
