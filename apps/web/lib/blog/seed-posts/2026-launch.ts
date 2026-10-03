/**
 * The launch series: 30 posts seeded with a publish date counted in days from
 * 1 May 2026 (see launchPublishDate). Kept out of the seed route because a
 * Next.js route file may only export its HTTP handlers.
 */
export type LaunchSeedPost = { title: string; excerpt: string; content: string; daysFromNow: number };

export const LAUNCH_POSTS: LaunchSeedPost[] = [
  {
    daysFromNow: 1,
    title: "Welcome to EchoQuest: The AI RPG Built for Everyone",
    excerpt: "Meet EchoQuest, an audio-first AI RPG where a Game Master narrates every scene aloud. Here's who I built it for and what you can play for free.",
    content: `# Welcome to EchoQuest: The AI RPG Built for Everyone

Lots of people love the idea of a tabletop RPG and never actually get to play one. Sometimes the group falls apart after three sessions, or nobody has the energy to prep. Other times the tools are the problem: virtual tabletops built around maps and tiny token icons that a screen reader can barely make sense of. If any of that sounds familiar, I built EchoQuest for you.

The idea I started from was simple, if a little cheeky. What if a Dungeon Master lived in your pocket, never got tired and never cancelled on a Friday night? And what if that same GM felt just as much at home narrating to a sighted player on a laptop as to a blind player on a phone with a screen reader? That second question became the rule everything else had to obey. Accessibility came first. It was never going to be a patch I bolted on after launch, and honestly, it bent every other decision in a direction I didn't expect. As a result, EchoQuest looks and sounds quite unlike most AI games out there.

## What Is EchoQuest?

EchoQuest is an audio-first RPG, and its Game Master runs on Claude, the large language model made by Anthropic. You don't squint at walls of text, because every scene gets read aloud in a clear, expressive voice. You don't roll physical dice or cross-check rulebook tables either. A live AI Game Master answers exactly what you say, in plain language, and you never have to memorise special commands.

That last bit matters more than it sounds. Back in 1980, Infocom's Zork impressed people because its parser could handle [complete sentences and complex commands](https://research.cgu.edu/paul-gray-pc-museum/2024/08/30/collection-spotlight-the-text-adventures-of-infocom/), which was a real leap at the time. Still, you had to phrase things the way the game expected. Forty-odd years later, you can just talk.

There are three ways to tell the GM what you do:

- **Type your actions** with a keyboard
- **Speak them aloud** with built-in voice input
- **Pick a suggested choice** (tap it, or press its number key) when you'd rather choose a path than write one

And the story bends around *you*. There's no "wrong" answer, and you won't slam into the dead ends of a branching tree. Say "I want to climb the bell tower and look across the city," and the GM works out what you're after, then folds it into the story, even if whoever designed the campaign never gave that bell tower a second thought.

Voice input taught me a lesson or two, by the way. Speech recognition mishears people, so EchoQuest shows you the transcript to confirm before anything reaches the GM. Then in September I discovered the microphone was actually blocked on my own pages, so voice input quietly did nothing at all. That one stung. It's fixed now.

## Built for Blind and Sighted Adventurers

Most games treat accessibility as an afterthought, a checkbox somebody ticks after launch. You've probably watched the pattern play out. A studio ships something gorgeous and very visual, disabled players report that they can't play it, and months later a "high contrast mode" or a narrator toggle appears without fixing what's broken underneath. I went the other way round. The audio layer came first and the visuals sat on top of it, and that order changes everything downstream.

The audience is far bigger than people tend to assume, too. The World Health Organization estimates that [at least 2.2 billion people have a near or distance vision impairment](https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment). That's hardly a niche.

Here's what I committed to:

- **Every menu, button and piece of game text is readable by screen readers.** EchoQuest is built for NVDA, JAWS, VoiceOver and TalkBack, and an automated accessibility suite (Playwright plus axe) runs against the web app in CI. Those aren't random picks, either: in [WebAIM's latest screen reader survey](https://webaim.org/projects/screenreadersurvey10/), JAWS and NVDA were the main desktop screen readers for 40.5% and 37.7% of respondents, and VoiceOver led on mobile
- **Full keyboard navigation.** Anything a mouse user can do, you can do from the keyboard alone, with a logical tab order and visible focus rings. Single keys cover the everyday stuff: L tells you where you are, S reads your status, I lists your inventory and U undoes your last turn
- **Voice commands**, so you can play completely hands-free. That helps blind players, and it helps players with motor disabilities just as much
- **Narration speed and pitch controls**, so the voice fits how you listen. Plenty of screen reader users run speech much faster than most people would find comfortable, and the [ and ] keys let you nudge the speed mid-scene
- **Reduced-motion mode** for anyone who finds animation unpleasant
- **High-contrast and large-text modes** for low-vision players, plus a light theme if dark screens wear your eyes out

Some of my hardest lessons here were about timing rather than coverage. Back in May, I noticed EchoQuest was announcing and focusing the choices while the narrator was still talking, so screen reader users got two voices at once. Technically everything was "accessible". In practice it was a racket. Now the choices wait their turn. Around the same time, I made HP and inventory changes announce themselves, because losing six hit points in silence is no fun when you can't glance at a health bar.

So if you're blind or have low vision, or you simply like to close your eyes and listen, EchoQuest should fit the way you play. I designed it with a few people in mind. One has never managed to enjoy a story-heavy RPG on their own. Another has always depended on a family member reading the screen to them. And then there's the sighted player who listens to it like an audiobook while folding laundry. To me, every one of them is a real player, and each one shaped the design.

## A Living, Breathing AI Game Master

The heart of EchoQuest is the AI Game Master, and Claude does the thinking behind it. Older text adventures handed you a branching menu. The EchoQuest GM works differently. It:

- **Responds to anything you say**, not just preset choices
- **Remembers what happened earlier in your session**, so callbacks and consequences feel earned
- **Gives NPCs their own personalities**, and on the Storyteller plan their own voices too, so the shopkeeper doesn't sound like the city guard
- **Tracks your character's HP, inventory, quests, relationships and story flags** behind the scenes, turn by turn
- **Plays ambient sound that suits the scene**, like a storm rolling in, a forge's roar, the hush underwater or a city humming at night
- **Paces itself to the moment**, so a fight lands quick and hard and exploration gets room to breathe

None of this comes out of a lookup table. Claude reasons about your situation as it unfolds, much the way a sharp human GM would. In fact, on October 2 I rewrote the GM's instructions so it talks like a seasoned person behind the screen: it opens a scene on one concrete detail and ends on a direct question to you. Skill checks now resolve in the same turn as well, so you're not left hanging for a whole exchange to learn whether you made the jump.

The gap between an EchoQuest session and a 1980s text adventure feels like the gap between a real conversation and an automated phone menu. Have you ever yelled "operator!" at one of those? Then you know exactly what I mean.

## Three Official Worlds, Endless Possibilities

EchoQuest's prebuilt campaigns exist to show what the platform can do, so here are three of them. The Iron Citadel is a steampunk thriller set in a city-sized iron fortress perched over a volcanic fissure. The Engines that keep the lower tiers breathing will go dark by dawn. Who you trust tonight decides what the Citadel turns into. Neon Precinct is cyberpunk noir in the rain-slick megacity of Karthos-12, where you play a freshly decommissioned synthetic detective who just took a job you really shouldn't have. Saltbound drops you into age-of-sail piracy in the Stradovine Archipelago. Your crew of forty-eight has just elected you captain of the brigantine Mercy, and of course the navigator has vanished right as a Crown frigate shows up three islands east.

Those three are only a taste, though. The library holds nine prebuilt worlds in all, stretching from gothic horror and nature fantasy to a buried desert empire, a generation ship in deep space and a cosmic-horror investigation, and three of them are free to play. On top of that, members on the Creator plan can publish their own worlds to the library, so the shelves can grow in directions I'd never think of myself. A gritty western mystery? A cosy slice-of-life isekai? If someone writes it, it can go up there.

## Free to Start

EchoQuest is free to play, and you don't pay a cent to get going. Here's what the free tier includes:

- Three prebuilt campaigns
- 60 free AI turns per day (one turn uses one minute of credit), and you can buy extra AI minutes whenever you like
- Browser text-to-speech narration using your device's built-in voices
- Full keyboard access, screen reader support and voice commands

I'll be upfront that the free tier shows ads between sessions. Browser voices also have their quirks. In May, Chrome's built-in voice had a race condition and would cut off after roughly 15 seconds, so I had to engineer around it. Then in September it started stopping a few seconds into a scene, and I chased that one down too.

If you'd like unlimited play, there are two paid plans. **Storyteller** costs $15 a month or $129 a year. You get unlimited turns with no ads. On top of that, premium ElevenLabs narration gives each NPC a distinct voice, and you get one private world that you can build with the World Builder Wizard or by uploading a Game Bible. Those premium voices had their own gremlins, incidentally: they used to pitch up like chipmunks whenever you sped up playback, so I made sure the pitch holds steady now. **Creator** costs $29 a month or $239 a year and adds publishing worlds to the library, along with creator analytics. The monthly plans carry no annual commitment, and you can manage or cancel your subscription from your account page.

## How EchoQuest Compares to Other AI RPGs

You may have tried other AI storytelling apps already. In my view, most of them land in one of two camps. Some are pure chatbots in an RPG costume, with no real game state, just open-ended conversation. Others are visual novel engines with a sprinkle of AI text, and they tend to skip audio and accessibility entirely, with very little GM behaviour to speak of. EchoQuest belongs in a different category.

It keeps real game state (HP, inventory, quests, NPC relationships, story flags, location and time of day) and updates it as you play. A dedicated GM prompt keeps the narration consistent and properly paced. Skill checks roll against a real difficulty with your stat modifier added, so combat runs on rules rather than vibes, and dropping to 0 HP brings a genuine setback. Story arcs climb toward satisfying climaxes instead of meandering forever. And every single layer works without sight.

Real state brings real responsibility, however. Early on, a turn that errored halfway could leave half-applied changes behind (say, gold gone from your purse but no sword in your pack). So I added a full rollback, which means a turn either lands completely or not at all. There's single-step undo now, plus auto-save every five turns and a manual Save button. And since October your character's progress lives on the server, so you can pick up where you left off on another device.

## What's Coming

EchoQuest is under active development, and I keep a list. Please read these as plans, not promises. Multiplayer sits near the top, so you and your friends can adventure together in real time with shared narration and a proper turn order. I'd also like premium voices that keep each recurring NPC sounding like the same person in every scene. Deeper support for adaptive hardware is on there too, starting with the [Xbox Adaptive Controller](https://news.microsoft.com/announcement/xbox-adaptive-controller-unveiled/), which Microsoft designed with extensive input from gamers with disabilities and which plugs into external buttons and switches. Then there's a creator marketplace where world designers could earn money when players try their campaigns, and native iOS and Android apps with offline downloads of your favourite sessions.

Your feedback shapes that list. If something doesn't work for you, [tell me](/contact-us). Frankly, an accessibility bug report is about the most useful message I can get.

## A Word to Sighted Players

If you're sighted and reading this while wondering "is this even for me?", the answer is yes. The same choices that make EchoQuest work for blind players make it brilliant for everyone else. You can listen on your commute, or play while you cook dinner. After a long day staring at a monitor, you can rest your eyes and still get the whole story. My bet is that plenty of sighted players who try it "just to see" will leave the audio on for good.

Audio-first isn't a downgrade. It's a different way to take in a story, and I'd say a more immersive one, because your own imagination handles the set design.

## Ready to Begin?

Your first adventure is one click away. Pick a world and sketch a quick backstory for your character. The AI Game Master handles the rest. Give it five minutes and you'll be deep inside a story that reacts to you in real time.

So, which world are you going to start with?

**[Browse the Adventure Library →](/library)**

Welcome to EchoQuest. I'm really glad you're here.
`,
  },
  {
    daysFromNow: 2,
    title: "How to Play Your First EchoQuest Adventure (Beginner's Guide)",
    excerpt: "New to AI RPGs? This step-by-step guide takes you from picking a world to making your first move in EchoQuest, plus the keys and habits that help most.",
    content: `# How to Play Your First EchoQuest Adventure (Beginner's Guide)

So you've heard about EchoQuest and you're curious, but you've never played an AI RPG before. Maybe you've never touched a tabletop RPG at all. Or perhaps the only "RPG" you know is a video game stuffed with menus and damage numbers, and the thought of saying your actions out loud feels a bit odd. That's completely fine. I wrote this guide to walk you through it, from choosing your first world to making your first move, and to explain a couple of quirks that make EchoQuest feel unusual on day one.

## Before You Start: What to Expect

EchoQuest borrows from a few older kinds of fun. Think of a text adventure crossed with a tabletop RPG, then read aloud to you like an audiobook. The AI Game Master describes the world in spoken English, and you reply in whatever way is comfortable for you. The story unfolds in real time, shaped by every choice you make.

A quick aside: the audiobook part isn't a niche taste anymore. The Audio Publishers Association's latest consumer survey found that [58% of American adults have listened to an audiobook](https://www.audiopub.org/surveys). So if you've ever finished a novel through your headphones, you already understand half of how this works.

It isn't an action game, and your reflexes don't matter one bit. Nothing runs on a timer. You can pause for an hour mid-scene and come back. Missed a line? Replay it. You can even ask the GM "what just happened?" and it'll sum things up for you. It's an unhurried, thoughtful kind of play, closer to curling up with a great novel than to a shooter.

If you use a screen reader, the interface is fully labelled and built to work with NVDA, JAWS, VoiceOver and TalkBack. If you have low vision, the high-contrast and large-text options live in the Display settings. And if a mouse isn't an option for you, every action has a keyboard route. None of this was bolted on later. Accessibility has shaped the platform since the first line of code.

## Step 1: Browse the Adventure Library

When you first arrive, head to the **Adventure Library**. That's where every available world lives. There are two tabs: Official, for the prebuilt campaigns, and Community, for worlds that Creator members have published. A genre filter helps you match the shelf to your mood, and each world card carries a few tags (genre, tone, difficulty) so you know what you're getting into.

The library holds nine prebuilt worlds, and the free tier lets you play three of those campaigns. Difficulty tags run from beginner through intermediate to experienced, and every prebuilt world is tagged beginner-friendly, so you honestly can't pick wrong. Even so, a world with a clear goal makes for the gentlest start. Not every world is on the free tier, though, so check what's open to you before you get attached.

If you're not sure where to begin, I'd point you at **Iron Citadel** first. It's a steampunk thriller with a ticking clock: you've got one night to find a missing kid before the city's security chief does, and the Engines beneath your feet are failing. You always know what's at stake. Once you've finished it, try **Neon Precinct** for a cyberpunk mystery, or **Saltbound** if you'd like something looser and more exploratory, with a whole archipelago to sail.

## Step 2: Choose Your Character

Before the adventure begins, you'll make a character. Choose a name and a class (Warrior, Rogue, Mage, Ranger or Bard), then write a short backstory. Three or four sentences is plenty. Don't overthink it. The AI Game Master adapts to whoever you decide to be, and you can fill in details as you go. One wrinkle: if a world defines its own roles, the GM uses those instead of the standard classes.

Your character has a few simple stats:

- **HP** (hit points): how much punishment you can take before things turn grim
- **Class strengths**: what your class does best, like a rogue's knack for stealth and traps or a bard's silver tongue
- **Inventory**: the gear you start with (a Rogue gets lockpicks and a shadow cloak, for instance) and whatever you pick up along the way

Under the hood there are four core attributes too, namely strength, dexterity, intelligence and charisma, and they feed into skill checks. All of these shift as the story moves. You don't track any of it yourself, because the GM handles the bookkeeping. Just play the character and trust the system. If you're on a screen reader, HP and inventory changes get announced as they happen. I added that in May after realising that taking damage in silence is miserable when you can't glance at a health bar.

A classic beginner mistake is writing a flawless hero who's good at everything. Resist the urge! Interesting characters carry weaknesses and unfinished business. D&D's own basic rules make the same point: they describe a character flaw as [anything someone else could exploit to bring you to ruin](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/personality-and-background), and they nudge you toward specific traits over vague ones. So a "tired veteran coming home to find her village gone" makes a far richer starting point than "the strongest warrior in the kingdom."

## Step 3: Listen to the Opening Scene

Once your session starts, the GM narrates an opening scene. On the free tier, your browser's built-in text-to-speech voice reads it aloud through your default audio device. With a Storyteller or Creator subscription, ElevenLabs narration takes over instead. It's richer and more expressive, much closer to a professional audiobook reader, and the NPCs get voices of their own.

Getting that first line out quickly took real work, by the way. Since October, narration starts speaking while the GM's reply is still being written, and the next premium clip gets fetched while the current one plays. So you're not sitting in silence while the whole scene loads.

Take a moment to really listen. Don't rush. Notice where you are and who's around you, because the scene sets up the situation you'll respond to. Most openings also slip in two or three subtle hooks you can chase if you're curious: a traveller muttering about a rumour, a strange smell, a door left ajar, an object on the table that wasn't there yesterday. Pay attention to these. When I rewrote the GM's instructions in October, I told it to plant small details early and pay them off later, so investigating them tends to be rewarded.

Missed something? Press **R** to replay the last narration. You can also slow the narrator down in the Voice settings, or press the **[** key mid-scene. That helps if English isn't your first language, or if you simply like a calmer pace. Browsers handle speech speed on a refreshingly plain scale: according to [MDN's documentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/rate), 1 is a normal speaking rate, 2 is twice as fast and 0.5 is half as fast. Premium voices once had a funny problem here. Speed them up and everyone sounded like they'd been at the helium, so in May I made sure the pitch holds steady at any speed.

## Step 4: Take Your First Action

Once the narrator finishes, you'll hear three to five suggested choices, and one of them is always open-ended. They wait for the narration on purpose. In May I caught the choices being announced while the narrator was still talking, so screen reader users got two voices at once. Not great! Anyway, you're not limited to those suggestions. You can:

- **Click or tap a choice**, or press its number key (1 to 9)
- **Type your own action** in the text box (e.g. "I examine the door for traps"); press **T** to jump there
- **Speak your action** with the voice input button, or press **V**

Voice input asks you to confirm what it heard before anything gets sent, so one misheard word won't derail your turn.

The GM answers exactly what you say. There's no wrong answer, because the story adapts. Want to talk to an NPC? Just say "I ask Mara what she knows about the missing children." Fancy a bit of detective work? Try "I check the floorboards near the body." And if you feel like doing something strange and creative, go for it. The GM will roll with it.

In my opinion, the biggest mistake a beginner can make is sticking only to the suggested choices. They're there for inspiration, and they were never meant as the full menu. Honestly, the game opens up dramatically the moment you start writing your own actions.

## Step 5: Keep Going

Each reply from the GM pushes the story forward. Your HP and inventory update as things happen. Meanwhile, the ambient soundtrack shifts as you travel, from a forge's roar to a rolling storm or the muffled hush underwater. If a fight breaks out, the GM narrates the action and asks what you do next.

When you attempt something risky (climbing a wall, picking a lock), the game makes a skill check. It rolls a d20, adds your stat modifier and compares the total to a difficulty number, which is [the same core mechanic as D&D's ability checks](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores). The GM never decides success on a whim; the dice do. Since October, that check also resolves in the same turn, so you hear the outcome straight away. And if you drop to 0 HP, the story deals you a real setback, with a sound cue so you know. Funnily enough, before that fix nothing happened at 0 HP at all, which was its own kind of bug.

Want to hear the last narration again? Press **R** or use the replay button. Need a break? EchoQuest auto-saves every five turns, and there's a manual Save button too, so hit it before you close the tab and you can come back hours or days later. Your character's progress lives on the server as well, which means you can resume from a different device: find your save in the library and press Resume. And if a turn goes sideways, **U** undoes it.

Saving was one of those things I learned the hard way. Early on, a turn that crashed halfway could leave half-applied changes behind, so now a failed turn rolls back completely, as if it never happened.

How long does a session last? There's no fixed length. The free tier gives you 60 turns a day, which is plenty for a decent evening, and the paid plans lift that cap entirely. Short, frequent sessions suit some people, and others love a multi-hour marathon. Both are perfectly fine.

## Tips for New Players

A few lessons I'd pass on to anyone starting out:

- **Don't be shy about asking questions in character.** "I ask the innkeeper what she knows about the disappearances" is a perfectly valid action. NPCs in EchoQuest are built to be talked to, and they come with their own opinions and grudges, so a conversation is often the quickest way to move the story along.
- **Explore.** The GM rewards curiosity. Poke at objects and wander off the suggested path. Hidden details and side stories usually sit just past the obvious choices.
- **You can't break the game.** If your action doesn't fit the story, the GM handles it in character ("The stone door doesn't give, however hard you shove") and lets you try something else. Trying something weird never ends your game.
- **Use the world's lore.** Every prebuilt world comes with its own history and cast of NPCs for the GM to draw on, and custom worlds can be built from an uploaded Game Bible. If something gets mentioned by name, you can ask about it. "What do I know about the Order of the Pale?" is a valid action.
- **Take notes if you like to plan.** EchoQuest doesn't require it, but a little journal of NPC names and loose threads can deepen the experience. The **Q** key reads your quest log, which helps as well.
- **Check your stats.** Press **S** for your status, **I** for your inventory and **C** for your character sheet whenever you like. Lost your bearings? **L** tells you where you are, and **H** lists every shortcut.

## What If I Get Stuck?

You can always say "I'm stuck, what are my options?" and the GM will sum up the situation and suggest a few ways forward. That isn't cheating. It's part of the design, and human GMs do exactly the same thing at real tables. Have you ever watched a Dungeon Master drop a not-so-subtle hint when the whole table goes quiet? Same idea.

If a scene feels too hard, you still have options. There's no difficulty slider in the settings right now. Instead, you can press **U** to undo your last turn and try a different approach, or simply tell the GM you'd like to retreat and regroup. As you grow more comfortable, you might even start taking bigger risks on purpose, because that's where the best stories hide.

Your first adventure is waiting. **[Open the Library →](/library)**
`,
  },
  {
    daysFromNow: 3,
    title: "Why Audio-First Gaming Is a Revolution for Blind Players",
    excerpt: "Most RPGs shut blind and low-vision players out. Here's why audio-first design changes that, and what building EchoQuest that way taught me.",
    content: `# Why Audio-First Gaming Is a Revolution for Blind Players

Video games are enormous business. GamesBeat, reporting Newzoo's figures, says the global games market [closed 2025 at $201.6 billion](https://gamesbeat.com/global-games-revenue-breached-200b-in-2025-newzoo/), the first year it ever broke the $200 billion mark. Meanwhile, the World Health Organization counts [at least 2.2 billion people](https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment) living with a near or distance vision impairment. For those with little or no sight, most of that industry might as well not exist. Put those two numbers side by side and anyone who makes games ought to wince. Decades of accessibility advocacy later, many of today's most popular games remain close to unplayable for blind players. For plenty of blockbusters, "accessible" still boils down to a font-size slider and a colour-blind palette.

EchoQuest belongs to a small but growing wave of games that treat accessibility as the foundation for every other decision. It was never a box to tick for some publisher's compliance officer. In this post I'll make the case for audio-first gaming and walk through what it actually demands from a designer. Then I'll get to the part that excites me most: why AI is finally making properly accessible RPGs possible at scale.

## The Problem with "Accessible" Games

When accessibility gets bolted on after the fact, you can tell. The usual failures look like this:

- **Non-semantic markup**: screen readers announce random numbers and IDs instead of meaningful labels like "Open inventory" or "Cast healing spell"
- **Mouse-only interactions**: critical actions have no keyboard equivalent, so blind players literally can't trigger them. That breaks one of the web's most basic rules, since WCAG's Level A criterion asks that [all functionality be operable through a keyboard interface](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- **Visual-only feedback**: damage, status effects, inventory changes and quest progress show up as icons with no text alternative, so blind players can't tell what state the game is in
- **No narration**: the story exists only as on-screen text with no audio playback, which means even screen reader users have to sit through flat synthetic reading of every minor UI element tangled up with the dialogue
- **Time-pressured visual cues**: quick-time events, parries and dodge windows that depend on spotting a flash of colour
- **Cluttered modal dialogs**: pop-ups without focus management, so the screen reader never knows to read them

These aren't minor annoyances. They're walls. A blind player trying a typical AAA RPG will often hit one of them within the first ten minutes and bounce off the game for good. The Game Accessibility Guidelines are blunt about it, too: screen reader support or self-voicing is [essential for players with little to no residual vision](https://gameaccessibilityguidelines.com/ensure-screenreader-support-including-menus-installers/). Not "nice to have". Essential.

And I'm hardly immune to these mistakes. In May, EchoQuest announced and focused the choices while the narrator was still mid-sentence, so screen reader users heard two voices talking over each other. Every label was in place, and the moment was still a mess. That taught me accessibility is as much about timing as it is about labels. Now the choices wait until the narration finishes.

## The Long History of Audio Games

Audio-only games aren't new. Back in 1997, Kenji Eno's studio Warp released Real Sound: Kaze no Regret on the Sega Saturn, a story told entirely in sound with nothing on the screen. Eno even [brokered his Sega deal on the promise of 1,000 Saturns for blind people](https://www.nme.com/features/the-musical-legacy-of-kenji-eno-video-game-developer-and-musical-maverick-3401461), and he added 1,000 copies of the game to go with them. Later came titles like Shades of Doom, Papa Sangre and A Blind Legend. That last one used binaural audio so convincingly that a reviewer for the American Foundation for the Blind said it [sets the bar very high](https://afb.org/aw/17/3/15351) for audio game production (headphones essential). These games proved that immersive interactive entertainment can exist without graphics. Still, audio games stayed a niche category, mostly made by small teams on modest budgets, and they rarely matched the scope or polish of mainstream releases.

What's shifted in the last few years is that the technology underneath has caught up with the ambition. Modern neural text-to-speech voices, from ElevenLabs, Google, Microsoft and Apple among others, can sound remarkably close to human. Every modern browser ships with audio APIs capable of spatial sound. And, most important for story games, large language models can now act as believable Game Masters, which lifts the old ceiling of pre-scripted branches.

Browser speech still has rough edges, I'll admit. In May I had to work around a race condition in Chrome's built-in voice, which also cut off after roughly 15 seconds. Then in September the browser narrator started stopping a few seconds into a scene, and I had to chase that down as well. So the technology has caught up, but it hasn't quite finished growing up.

## What Audio-First Actually Means

Building audio-first means designing the experience for the ears before the eyes. In practice, that looks like this:

- Every scene and every line of NPC dialogue is **spoken aloud** via text-to-speech, with adjustable speed and pitch
- Every UI element carries a proper **ARIA label** so screen readers describe it accurately, and focus is handled properly when dialogs open and close
- Every action can be triggered with a **keyboard shortcut**, with no mouse or touchscreen required and a logical tab order
- **Ambient soundscapes** establish the environment so the world feels three-dimensional even without visuals: a cave's drip, a forge's roar, the hush of a throne room, cyberpunk rain on a city at night
- **Spatial audio cues** can signal direction and events around your character, so positioning comes across through sound. I'll be straight with you here: EchoQuest doesn't do positional audio yet, so for now the narration carries direction ("footsteps behind you, off to the left")
- **Sound effects for game events** (a door that won't budge, an item landing in your pack, danger closing in, a level-up chime) replace the visual feedback sighted players take for granted

Getting those layers to coexist was fiddly. My ambient soundtrack originally sat right on top of the sound cues, so I made it duck underneath them. Then duplicate cues started firing a hair apart, which just sounds like a glitch, so anything repeating within 80 milliseconds gets dropped now. On May 16 I found the ambient track quietly ratcheting itself down to silence after about five turns. And for a while ambient audio didn't play on mobile at all. None of that is glamorous work. Even so, it's the difference between a soundscape and noise.

This is what blind gamers have been asking for: a full-featured game that works the way they do, never a watered-down one. EchoQuest doesn't strip features out for blind players. It delivers the same rich experience through different senses.

## The Voice Command Layer

EchoQuest also supports **voice commands**. Instead of tabbing between choices, you can say "option two" or "pick three", ask "where am I?", or simply describe your action out loud. Your device's built-in speech recognition turns your words into text, and EchoQuest passes them to the AI GM. No hands needed at all.

Free-text actions get a short pause before they're sent, about three and a half seconds, so you can cancel if the recogniser heard "attack the lizard" when you clearly said "wizard". I added that confirmation step in May. Then in September I discovered the microphone was being blocked on EchoQuest's own pages, so voice input silently did nothing. Embarrassing! It's fixed.

For players with motor disabilities as well as visual impairments, this opens doors that used to be nailed shut. I kept people with limited hand mobility or repetitive strain injuries firmly in mind, along with anyone whose condition makes a long session on a controller exhausting. Audio-first design overlaps heavily with motor accessibility, even when that isn't the original goal.

## Why AI Changes Everything

Earlier accessible games were limited by fixed scripts. A blind player could get through the menus, yet the story itself branched along a predetermined set of paths. Even Real Sound asked you to decide only when its chimes rang. If the designer never thought of "I want to bribe the guard", that option didn't exist. That's fine for short puzzles, although it's confining for open-ended roleplay.

With an AI Game Master, nothing's predetermined. The GM responds to natural language. A blind player can say exactly what their character does, in their own words, and get a meaningful response that fits the moment. If the player improvises, the world improvises right along with them. At last the playing field levels out, in the story as well as the interface.

This matters more than it might seem. The classic complaint about branching games was that the choices felt hollow because there were so few of them. With AI, the choices feel endless because, for practical purposes, they are. Both complaints really come down to the gap between what a player means and what the game lets them say. AI closes that gap.

There's a catch I learned the hard way, however. A language model will cheerfully produce things that were never meant to be spoken. In late May, raw JSON leaked into the narration, so the narrator read curly-brace data aloud as if it were part of the story. Another bug kept NPC voices from switching, because the NPC's dialogue wasn't woven into the narration at all. Both are fixed, and NPCs now get gender-matched voices across the whole voice catalog.

## Misconceptions About Audio Games

A few myths worth busting:

**"Audio games are only for blind people."** Sighted players get a lot out of them too, for the same reasons people love audiobooks. Listening engages the imagination more vividly than scrolling through screens of text, and it works where reading isn't practical, like a commute or a sink full of dishes. Have you ever finished a whole novel without once looking at a page? Then you already get it.

**"Audio games can't have rich worlds."** EchoQuest worlds can be built from detailed Game Bibles, which you can upload as a PDF, DOCX, TXT, Markdown or JSON file. A good one holds maps described in words, faction politics, climate notes and historical timelines. The richness is identical. It just reaches you through your ears.

**"Blind players don't want challenge or complexity."** That's patronising, and it's plain wrong. Blind gamers want what every gamer wants: meaningful choices and progression that feels earned. They've been underserved, not undermotivated.

## Building a More Inclusive Gaming Future

EchoQuest isn't the end point for accessible gaming. It's a beginning. Deeper integration with assistive technology is on my list, and I'd like to learn from the blind gaming community and from groups like AbleGamers and the Game Accessibility Conference. I also write about my accessibility approach openly on this blog, mistakes included, so other developers can borrow whatever works.

I'm convinced accessibility helps everyone. Captions rescue videos in noisy rooms. Curb cuts are the classic case: in her essay on [the curb-cut effect](https://ssir.org/articles/entry/the_curb_cut_effect), Angela Glover Blackwell points out that parents with strollers, workers pushing heavy carts, travellers wheeling luggage and even skateboarders headed straight for them, and that nine out of ten "unencumbered pedestrians" go out of their way to use one. Audio-first games help anyone who'd rather listen than read, and that includes a surprisingly large number of sighted people. The open secret of accessibility design is that universal design makes products better for everyone, well beyond the people it first set out to serve.

So, are you a blind or visually impaired gamer curious to try EchoQuest? Your first session is free. The free tier includes three campaigns and 60 AI turns a day, and there's nothing to pay to get started. **[Start your adventure →](/library)**
`,
  },
  {
    daysFromNow: 4,
    title: "5 World-Building Tips That Make Great RPG Campaigns",
    excerpt: "Five world-building habits for RPG campaigns, from a central tension to sensory detail, for a Game Bible or EchoQuest's World Builder Wizard.",
    content: `# 5 World-Building Tips That Make Great RPG Campaigns

Every good RPG campaign grows out of a good world. Notice I didn't say a perfect one. I mean an *interesting* one, a place with trouble brewing and people who want things badly. The mistake I see most often in new creators is the urge to be exhaustive. They draft page after page of geography and language families, plus a pantheon or two, before a single character has walked down a single road. By the first session the writer is worn out, and the world reads like an encyclopedia instead of somewhere stories actually happen.

To be fair, there's a famous exception. Tolkien admitted that for him [the invention of languages was the foundation](https://www.tolkienestate.com/scholarship/carl-hostetter-tolkiens-invented-languages/), and the stories came afterwards to give those languages a world to live in. It worked out rather nicely for him. Then again, he spent most of his life on it, and you probably want to play on Saturday.

The five tips below flip the usual priority. Rather than describing what your world *is*, they nudge you to describe what's *happening* in it, and what might happen next depending on the choices your players make. I lean on these habits myself, and they work just as well in EchoQuest's World Builder Wizard as in a Game Bible you hand-write from scratch. Any one of them will make your world better. Use all five and you'll barely recognise it.

## 1. Give Your World a Central Tension

The fictional worlds that grab me never sit still. Something is wrong, or about to go wrong. Maybe an ancient empire is crumbling while rival factions squabble over its bones. A plague might be spreading with nobody able to name the cause. Perhaps a god has just died and the faiths that worshipped it are in freefall. Or two countries that have shared a border for a thousand years are mobilising armies for the first time, and nobody can say why.

Your players need live stakes. The central tension is the engine that keeps the story rolling even when players wander off-script. It's the reason the next tavern conversation matters and every road feels like it might lead somewhere that counts. It's also why an NPC's throwaway remark could turn out to be a clue. So before you write anything else, answer one question in a single sentence: **What is fundamentally broken about this world, and what happens if no one fixes it?** Write the answer down and pin it to the top of your Game Bible. Every scene should tie back to that sentence somehow, and so should every NPC you bother to name.

Dungeon World has a lovely tool for exactly this. Its GM chapter on fronts has you write "grim portents", and it asks you to [think about what would happen if the danger existed in the world but the PCs didn't](https://www.dwsrd.org/gm/fronts.html). At the end of that road sits an "impending doom". I'm fond of that framing, because it treats the world as something with momentum of its own. I did something similar with EchoQuest's prebuilt campaigns. In The Iron Citadel, the Engines that keep the lower tiers breathing will go dark by dawn. That one clause hands every scene a ticking clock.

Here's a quick test I'd recommend. Suppose your players ignore the main plot entirely and just wander about. Does the world still feel charged? If it does, you've got a central tension. If everything goes flat the moment they turn left, you don't. What you've actually got is a single quest dressed up as a setting.

## 2. Make Your Factions Want Incompatible Things

Conflict is the soul of drama, and it comes easiest when you have groups of people (factions) who each want something legitimate that simply can't coexist with what the others want. The trick isn't inventing villains. It's inventing reasonable, sympathetic groups whose goals refuse to fit together.

Take an old forest. The merchant guild wants open trade routes through it. The druids want it untouched. The crown wants tax money from the timber trade and would rather not upset anybody. And the forest itself, in some half-mythic way, wants to be left alone. Nobody here is purely evil. Sit any of them down for tea and they'll make a decent case. Now drop your players in the middle and watch the sparks.

Aim for three to five factions. With fewer, the world feels simple: players quickly spot a "good guys versus bad guys" axis and the moral interest collapses. With more, they lose track of who hates whom, and why. For each faction, jot down:

- **What they want**
- **What they fear**
- **What they'd never do**

The "never do" matters most, in my opinion. It tells you when a faction will bend and when it'll fight to the last person standing. When the AI Game Master improvises a scene with that faction, those answers steer every line of dialogue. It's also why the World Builder Wizard asks you to name one hard rule the GM must respect. A firm "never" gives improvisation something solid to push against.

## 3. History Leaves Ruins: Use Them

Players adore discovering things. Hand them a half-buried temple and they'll start wondering who built it and why. They get the same itch from a crumbling fort with a name on the map and no explanation, or a road that stops dead in the middle of a swamp. A graveyard where every headstone shows the same year? They'll be asking questions for an hour.

Something happened here before your players arrived. Build two or three historical events that left physical traces behind: ruins, scars, monuments, ghost towns. You don't need to explain them up front. In fact, you *shouldn't*. Let players bump into a ruin and ask. Let the mystery breathe. Some of the best RPG moments arrive when a player asks "what's that?" about something the writer never meant to be important, and the GM (human or AI) gets to spin a little thread of history on the spot.

Sly Flourish, whose Lazy Dungeon Master books are more or less the bible of doing less prep, makes a related point about secrets. He suggests keeping a list of about [ten short secrets and clues without deciding in advance where players will find them](https://slyflourish.com/sharing_secrets.html). As he puts it, "secrets aren't drivers, they're fuel." Honestly, a ruin is just a secret with stones piled on top.

One rule I really like: write at least one piece of history that nobody alive remembers correctly. Retellings and propaganda have bent the truth, or plain old time has worn it down. Real history is full of this. The ancient Celts didn't write things down, so [what we know about the druids comes from outsiders, mostly Romans](https://www.nationalgeographic.com/history/article/why-know-little-druids), who were busy conquering them and had their own reasons for the stories they told. When I gave EchoQuest's forest world, Verdant Wilds, a block of real-world texture, that was one of my favourite details to slip in: the popular picture of druids cutting mistletoe with a golden sickle leans heavily on a single passage by Pliny the Elder. Give your world a half-truth like that. When players dig up the real story, it feels like archaeology rather than exposition. The world becomes a place that *was* before they showed up, which is exactly what makes it feel real once they do.

## 4. Give NPCs Goals That Exist Without the Players

Novice world-builders make NPCs who exist purely to hand out quests. They sit in the tavern with a problem, pass it over, then vanish. Veterans make NPCs who were busy before the players turned up and will stay busy even if nobody ever says a word to them.

The blacksmith has a gambling debt she's hiding from her husband. The innkeeper is quietly gathering information for a rebel cell, and every traveller who passes through is a potential source. The captain of the city guard honestly believes he's protecting people, even when his methods slide into cruelty. And the vegetable seller by the temple is saving every copper to send her son to scribe school three cities away, so her prices reflect that ambition far more than the going rate for turnips.

Give an NPC their own agenda and three good things happen:

1. Players pick up on it within seconds. There's a kind of presence that see-through quest-givers never have.
2. The NPC stays interesting across many visits. The blacksmith doesn't just get a fresh pre-written line each scene; she has an arc the players can cross at any point.
3. When a player does something unexpected, the NPC reacts believably, because you already know what they want and what scares them.

So give every named NPC at least:

- one secret
- one ongoing problem
- one thing they'd never tell a stranger

This is close to my heart, because it's how I want EchoQuest's GM to treat its cast. When I rewrote the GM's instructions in October, I told it that NPCs hold strong opinions and say them plainly, and that they'll lie through their teeth when it suits them. An NPC with a hidden debt gives it a reason to. On the Storyteller plan, named NPCs get their own voices as well, and getting that right took some doing. At the end of May I found NPC voices stubbornly refusing to switch, because the character's dialogue wasn't woven into the narration at all. Once it was, the blacksmith finally sounded like herself.

## 5. Establish Clear Sensory Language

An AI Game Master describes your world through narration, so help it by filling your Game Bible with specific sensory language. My bet is that the biggest single predictor of whether an AI-narrated scene feels atmospheric or generic is whether the source material handed the model concrete sensory anchors to grab.

Don't write "the city is dark and gritty." That's a marketing tagline, not a description. Write something like this instead: "The city smells of tallow candles and river mud, with frying onions somewhere underneath. Cobblestones are slick from morning fog. Voices argue in three languages from upper-floor windows. Bells from the harbour ring on the half-hour, and nobody in the street seems to notice any more." Now the AI has something to riff on, and the next scene it writes will reach for those textures because you put them right in front of it.

I learned a version of this lesson the hard way. When I rewrote EchoQuest's GM instructions on October 2, it was because the old prompt read like a technical spec, and the narration came back sounding like one, full of tidy lists and stock phrases. A prompt's own style leaks into what the model writes. So I rewrote the prompt in the voice I wanted back, and I gave each of the nine prebuilt worlds a short block of real, researched detail. Saltbound now knows that time aboard ship runs on the bell, struck in pairs through a four-hour watch until eight bells ends it. The Iron Citadel knows that volcanic vents reek of rotten eggs. Your Game Bible works the same way. Feed it flat prose and you'll get flat prose back.

There's some neat science behind why concrete language lands, too. Researchers at Emory University found that [hearing a textural metaphor such as "a rough day" lit up a touch-related region of the brain](https://news.emory.edu/stories/2012/02/hearing-metaphors-activates-sensory-brain-regions). A plain sentence with the same meaning didn't. It was a tiny study, just seven students, yet it matches what storytellers have always known: sensory words make listeners feel things.

Specificity is immersion. The more concrete your world's sensory palette (what it smells like, what sounds drift past, what the light does at different hours, what people eat and wear), the more vividly the AI will render it in play. On an audio-first platform like EchoQuest, sound details count double. How does this place echo? What rhythm do footsteps make on its streets? What's the steady background hum, and what cuts through it?

The composer R. Murray Schafer had handy names for that last question. He called the constant background of a place its keynote sounds, which, in his phrase, ["are overheard but cannot be overlooked"](https://musicstudios.calarts.edu/wp-content/uploads/2016/02/Shafer-Introduction.pdf). A sound a community treasures as its own, he called a soundmark. Give each major location a keynote and maybe a soundmark, and the GM gets an easy way to make places sound different. It helps behind the curtain too. When Claude reads an uploaded Game Bible, it tags each location with an ambient mood (a tavern, a cave, the open ocean, a city at night and so on), and that tag picks the background track you hear while you play.

## Putting It All Together

These five tips aren't a checklist to tick off in order. They feed each other. A central tension breeds faction conflict, and faction conflict writes history. History leaves ruins behind. Ruins give NPCs strong opinions about the past, and strong NPCs need sensory language to come alive in narration. Keep answering all five questions for every region you build, and the world will feel layered however small you make it.

So start small. I'd bet this little kit will carry a 10-session campaign with room to spare:

- a single town with one central tension
- three factions
- two ruins
- six NPCs with secrets
- a clear sensory palette

You can always expand outward later. What you can't do is bolt depth onto a world that was designed flat. Build a small world that feels alive, and your players will fight you for more time in it. So, what's the one broken thing at the heart of yours?

---

Ready to build your world? EchoQuest's **World Builder Wizard** comes with the Storyteller plan and up. It walks you through ten questions, spoken aloud if you like, with Claude suggesting ideas at each step, and turns your answers into a playable campaign. Would you rather write it all yourself? You can [start a new world](/worlds/new) by uploading a Game Bible instead. **[See plans →](/)**
`,
  },
  {
    daysFromNow: 5,
    title: "How Claude AI Powers the EchoQuest Game Master",
    excerpt: "What happens when you type an action in EchoQuest? A plain-language look at how Claude runs the Game Master, and why it beats old text adventures.",
    content: `# How Claude AI Powers the EchoQuest Game Master

Type "I draw my sword and demand the merchant explain himself," and something rather remarkable happens. Within moments the narrator starts talking, and the scene it describes fits. It knows who this merchant is and what went down three scenes ago. It knows what your character is like, and if you haggled with him recently, it remembers the price you tried to beat him down to. Maybe he backs off. Maybe he yells for the city guard. Or maybe he recognises you and, with real fear in his voice, asks why on earth you've come back. Nobody wrote any of those replies in advance. So how does it work?

This post is a plain-language tour of what's going on under the hood when you take an action in EchoQuest. You won't need any machine-learning theory. I built the thing, so I'll show you the real moving parts, including a few that broke on me along the way. By the end you should have an accurate mental model of what the AI Game Master can and can't do, and why I put EchoQuest together the way I did.

## The Old Way: Decision Trees

Text adventures and early visual novels worked by mapping every possible input to a response somebody had already written. Type "go north" and the game checked a table and handed back the "north room" text. Type anything else and you got "I don't understand that." Designers tried to anticipate every reasonable command, and whenever a beta tester surprised them, they added more.

The granddaddy of the genre shows how tight those limits were. Will Crowther's original Colossal Cave Adventure, from 1976, greeted players with "DIRECT ME WITH COMMANDS OF 1 OR 2 WORDS", and its vocabulary table held [193 words, with every input chopped down to its first five characters](https://dhq.digitalhumanities.org/vol/1/2/000009/000009.html). Later games got cleverer about widening the parser with synonym tables, pattern matching and the dreaded "guess the verb" puzzles. The ceiling never moved, though. Every meaningful response still had to be written by a human ahead of time.

That was fine for simple puzzles, but it fell apart the moment you tried to hold a conversation, act creatively or do anything the designer hadn't foreseen. The world felt hollow because it literally was; it only held what someone had explicitly programmed. The classic gripe, "I can see the rope on the table but I can't pick it up", wasn't really bad design. It was the parser running out of pre-written content.

AI Dungeon, which arrived in late 2019, was the first big public attempt to smash that ceiling with a language model. It worked, sort of. Aaron Reed's history of text games puts the problem neatly: older games kept a world model that tracked who was where and what you carried. The language model behind AI Dungeon had ["nothing of the sort"](https://if50.substack.com/p/2019-ai-dungeon). Words went in and new words came out. As a result, state drifted, characters forgot their own names and plot threads dissolved. The next leap, the one EchoQuest stands on, is what you get when you wrap a far more capable model inside a structured game system that holds the world together.

## The New Way: Language Models

EchoQuest uses Claude, the large language model made by Anthropic, as the core of its AI Game Master. Claude doesn't consult a lookup table. It reads your input as ordinary language and writes a fitting response from scratch, every single time. It learned from an enormous amount of text (fiction and dialogue, technical writing and philosophy, jokes, recipes and cultural references of every stripe), so it has an unusually deep feel for how conversations and stories work.

In practice, that means:

- You can phrase your actions however you like. "Draw my sword", "unsheathe my blade", "ready my weapon" or even "let him know I'm not joking" all land in roughly the same place
- The GM reads intent, not keywords. It cares about *what* you're trying to achieve, not which exact verbs you picked
- Replies feel natural and varied rather than canned. Play the same situation twice and you'll get two different paragraphs of narration
- The story can wander where nobody planned. The world's author only had to set up the conditions, and the model improvises inside them

There's a catch, however. A language model on its own remembers nothing between calls and enforces no rules. Left to itself, it'll happily contradict itself. That's why the EchoQuest GM is more than Claude: it's Claude wrapped in a game engine that supplies the memory and the constraints.

## What the GM Actually Knows

Every turn, before Claude writes a word, it gets a carefully assembled package. Up front sit two fixed blocks, my GM rules and your world. After that, each of your turns opens with a fresh snapshot of the game, written by the engine, followed by what you actually did. Here's what's in there:

- **World information**: the setting, tone, locations, NPCs, factions and lore from the campaign's Game Bible. That's the same Game Bible the world's creator wrote, condensed into a tight GM briefing so Claude can keep the world consistent without burning its whole budget on backstory. The nine prebuilt worlds also carry a short block of real, researched detail, like the way a ship's bell counts out a watch
- **Your character**: name and pronouns, class or role title, HP, level and XP, your four core stats, inventory, active quests with their unfinished objectives, and your backstory. If you've dropped to 0 HP, it says so in plain words: "Condition: DOWN"
- **Current context**: where you are plus a short description of the place, the time of day, the weather, any story flags that have been set, how every named NPC currently feels about you, and the lore you've uncovered
- **Conversation history**: your recent exchanges word for word, plus a short factual summary of older events that have slid out of that window
- **Rules**: how to run skill checks, record state changes, tag NPC dialogue for the voice system, offer choices and pace a scene. These are EchoQuest's house rules, written into the GM's instructions

All of that together is the *context window*. Anthropic's documentation calls it the model's ["working memory"](https://platform.claude.com/docs/en/build-with-claude/context-windows), and it makes a point I wholeheartedly agree with: more context isn't automatically better, because accuracy and recall slip as the token count climbs. Researchers found something similar in a paper aptly titled "Lost in the Middle", where models did best when the relevant information sat [near the beginning or end of a long input, and noticeably worse when it was buried in the middle](https://aclanthology.org/2024.tacl-1.9/). So a lot of EchoQuest's engineering goes into deciding what earns a place. Ten thousand tokens of clean, scene-relevant context will beat a hundred thousand tokens of raw transcript, in my view, every time.

There's a speed angle too. The GM rules and the world block are identical on every turn, so they're marked for [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), which lets Claude resume from a stored prefix instead of chewing through it again. Old history gets trimmed ten messages at a time rather than one per turn, which keeps that prefix steady for several turns in a row. It's a small, nerdy detail. Still, it's part of why your next scene starts sooner.

And what comes back? Claude's reply is actually a structured package rather than loose prose. It carries a sound cue, a list of who speaks, the narration itself, your choices and any changes to the game state. The sound cue and the speaker list come first on purpose, so the narrator can start talking while the rest is still being written, and each NPC's voice gets picked before their first line. That order has its own war stories. At the end of May, raw JSON leaked into the spoken narration, which is about as immersion-breaking as it gets.

## Why Responses Feel Consistent

Keeping an AI Game Master consistent is one of the hardest parts of the job. The same NPC shouldn't forget your name between scenes. The laws of the world shouldn't shift on a whim. And a story flag set in chapter one had better still be set in chapter five. Here's how EchoQuest handles it:

- **Facts live outside the conversation.** HP, inventory, quests, NPC standings, discovered lore and story flags sit in a structured game state, not in the chat log. They're handed to Claude fresh every turn, and its instructions say to treat them as fact. Claude never has to "remember" how many potions you've got. And because the only part you write is your action, typing "I now have a thousand gold" won't make it so
- **Older events get summarised.** Once enough turns pile up, a smaller, quicker Claude model folds each batch of ten into a compact factual summary (decisions, NPCs, places, items, quests), so the GM gets a recap instead of a blank. I'll admit this one bit me. On October 2 I found that once a session passed 40 stored messages, every turn re-summarised turns 1 to 10 and never got any further. Now each window gets summarised exactly once. Since that same week, your character's progress also lives on the server, so you can come back on another device and carry on where you left off
- **The Game Bible is the ground truth.** The GM is told the world's Bible outranks everything for setup and mechanics, and that it must never break established facts. If your world says elves are extinct, a cheerful elven shopkeeper has no business turning up in scene fourteen. If your world defines its own classes, the GM uses those exact terms; if it defines none, it's told not to invent generic ones like warrior or mage
- **Your location rides along every turn.** The current place and its short description are part of each turn's snapshot, so spatial details stay put even after a long detour of conversation
- **Dice are real dice.** When you try something risky, Claude doesn't get to decide that you succeed. It calls a skill-check tool (Anthropic calls this [tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview): the model asks, and my code does the work). The server rolls a d20, adds your stat modifier and any bonuses, and compares the total with a difficulty running from 5 for trivial up to 24 for near impossible. Claude then narrates exactly that result in the same turn. Before October 2 this didn't actually work on the web, because the prompt put the check in one place and my code looked for it in another. Embarrassing, but fixed
- **Levels follow one rule.** The GM only hands out XP; the engine decides when you level up and announces it. That's another October lesson. I discovered the GM, the engine and the character sheet were each working from a different XP curve, so your progress bar could sail right past 100%
- **Hitting 0 HP has teeth.** The GM sees "Condition: DOWN" and has to narrate a real setback. You might be captured, or wake hours later with a debt to pay. Nobody dies permanently, but the story doesn't carry on as if nothing happened

The combined effect is a GM that feels like the same GM across hours of play. NPCs you met early greet you by the name they used last time. The kingdom's politics move in directions that fit what you've already set in motion. The world has continuity, even though, strictly speaking, every response is written from scratch.

Behind all that sits plain reliability work. Back in May, a turn that errored halfway could leave half-applied changes behind, so now a turn either lands completely or rolls back. If a reply stalls for 20 seconds, the server quietly tries again, up to twice more, before falling back to a few safe choices.

## The Human Design Behind the AI

Claude doesn't invent the rules. I do. I write the instructions that define how the GM behaves: how to pace tension, when to offer choices and when to let you freewheel, how harsh or forgiving consequences should be, how to handle goals that clash with the campaign's central tension, and when to say "yes, and" versus when to push back.

The biggest rewrite so far landed on October 2, and the reason still makes me wince. The old instructions read like a technical spec, so the narration came back sounding like one, full of tidy lists, em dashes, stock phrases and neat little wrap-ups. A prompt's own style leaks into what the model writes. So I rewrote the whole thing in the voice I wanted to hear, and I gave the GM a proper brief on sounding like a seasoned human Game Master. Here's the gist:

- **Talk like you're at the table.** The GM narrates the way you'd talk across a kitchen table at midnight: second person, present tense, contractions, plain spoken English
- **Build every scene.** Open on one concrete sensory detail. Tighten with a complication. Land on a hook. Four short paragraphs is the ceiling, and most scenes need fewer
- **End on a question.** Every scene closes with one direct question to you, and it changes from scene to scene: "Do you trust her?", "Left tunnel or right?". The choices themselves get read out separately
- **Lean over the screen, rarely.** Once a scene at most, the GM may step out of the story for a short aside, like "I'll give you this one: that lock's older than the hinges."
- **Let NPCs have opinions.** Characters speak in first person with their own rhythm and grudges. They dodge questions and lie when it suits them. The narrator, on the other hand, commits; no "perhaps" or "it seems"
- **Pick the specific word.** "Tar-black bilge water" beats "dark water". The GM is also told to borrow real crafts, tools and weather from real history, but never at the cost of being understood on first hearing
- **Skip the machine tics.** Rhythmic lists of three, stiff paired and balanced sentences, em dashes and a long list of worn-out phrases are all off limits. Any em dash that still sneaks through gets swapped for a comma or an ellipsis, so the words you hear match the words on screen

On top of that sit the practical rules. Whenever a character speaks, the GM tags the line with their name, like [Captain Voss]: "Drop your weapons." That tag is how the audio engine knows to switch voices, and I learned how much it matters the hard way. At the end of May, NPC voices refused to switch at all, because the dialogue wasn't woven into the narration. Then in October I caught the voice parser ending a quote at the first apostrophe, so a line like "Don't move." changed voices halfway through a word. Other rules are about access. Every scene has to work for a listener with their eyes closed, so anything that only shows up as a colour or a shape also gets a sound, a texture or a smell. And each world's tone (cinematic, rules-light, crunchy, horror or mystery) nudges how the GM runs things.

Think of the result as a very skilled, very fast co-author. I set the creative constraints, and Claude fills in the story within them. It's genuinely inventive and comes up with twists and turns of phrase I'd never have thought to write, yet it's always creating inside a frame I shaped. That's the secret to a GM that keeps giving you the story you signed up for instead of sliding into generic fantasy mush by hour two. And I'm far from done tuning it. Honestly, the project's commit history reads like a diary of me catching the GM doing something I didn't like, then fixing it.

## What This Means for You

When you sit down to play, you needn't think about any of this. You type or say what your character does, and the world answers. Still, knowing what's underneath helps you play to its strengths. Be specific about what your character wants. Refer back to earlier moments, because the GM really is listening. Ask NPCs questions you honestly don't know the answer to; the model is at its best when there's room to surprise you. You can also ignore the suggested choices completely, since the GM is told to honour whatever you type or say. And remember that the world has its own logic. If something feels off, ask about it in character. More often than not, what looks like a slip is a thread waiting to be pulled.

If a turn goes sideways, you've got a safety net as well: press U to undo your last turn, or R to hear the narration again. So, what's the first thing you'd say to that nervous merchant?

Ready to see it in action? **[Play a free session →](/library)**
`,
  },
  {
    daysFromNow: 6,
    title: "The Best Fantasy RPG Tropes: And When to Subvert Them",
    excerpt: "Five fantasy RPG tropes, from the chosen hero to the magic sword, with plain advice on when to play each one straight and when to twist it.",
    content: `# The Best Fantasy RPG Tropes: And When to Subvert Them

Tropes have a PR problem. People toss the word around like an insult, as if a familiar story beat proves the writer got lazy. I don't buy it. Tropes survive because they work: they're shorthand that tells players, in a heartbeat, what's at stake and where they fit. A hooded figure in the corner of a tavern? Players lean in. A king who mentions an odd rumour from some far-off province? That's a hook, and everyone at the table knows it. Think of tropes as the load-bearing walls of genre fiction. Knock them all out and the house caves in, because players can no longer read the world they're standing in.

Somebody even wrote the field guide. Diana Wynne Jones's [The Tough Guide to Fantasyland](https://www.penguinrandomhouse.com/books/295676/the-tough-guide-to-fantasyland-by-diana-wynne-jones/) treats every fantasy novel as one big tourist destination, with entries on "Evil, the Dark Lord, Stew, Boots (but not Socks)". Its publisher calls it a send-up of the genre's clichés and a handbook for writers in the same breath, which sounds about right. You laugh because you recognise every single entry.

So the real craft isn't dodging tropes. It's knowing when to play one *straight* and when to *twist* it. A campaign that subverts every cliché turns nihilistic and tiring: nothing means what it seems, so why bother paying attention? A campaign that subverts nothing reads like beige fanfiction, with each beat landing exactly where you guessed it would. The writers I admire most lean on worn tropes for emotional weight, then bend them at the precise moment the bend carries meaning. N. K. Jemisin's Broken Earth trilogy, built around people the world fears for the very power that might save it, made her the [first author to win the Hugo for Best Novel three years running](https://www.cbc.ca/books/n-k-jemisin-wins-best-novel-at-hugo-awards-for-third-year-in-a-row-1.4791635). Terry Pratchett, for his part, squeezed decades of comedy out of the gap between what a story expects and what a sensible person would actually do.

I think about this a lot because of EchoQuest. When I rewrote the AI Game Master's instructions recently so it would talk like a human GM, a good chunk of that work was deciding which familiar beats it should honour and which ones it should hold back. Below are five of the most useful fantasy tropes, with notes on getting the most out of each one in either direction.

## The Chosen Hero

**The trope:** One special person, named in a prophecy, is destined to save the world.

**Why it works:** It parks the player right at the centre of the story. Suddenly there's a reason *your character* is out on the road while everybody else stays home. The world also gets a built-in narrative engine, since events have always been bending toward this one person, and the player gets permission to feel important. RPGs are power fantasies, after all. The chosen-hero setup is the quickest way to grant that fantasy without making someone earn it through hours of rat-catching errands in the first village.

**Use it straight when:** You want a clean, motivating arc and your players are new to RPGs. For a first-timer the trope works as scaffolding, because it answers "why me?" before they even think to ask. Don't overthink it. That frame is comforting for a good reason, and plenty of the genre's best-loved campaigns play it dead straight and simply execute well.

**How to subvert it:** Make the prophecy wrong. Or make it technically correct but about someone nobody expected: the prophecy describes the players' *enemy*, who fulfils it by being defeated. Or have several people who each believe they're the chosen one, all of them partly right, so the ending demands cooperation instead of a contest. The trope gets most interesting when "being chosen" turns out to mean something other than power. A prophecy naming "the one who will end the war" doesn't have to mean the winner. It could point to whoever refuses to fight, or to whoever dies in the right place at the right moment.

One opinion from the builder's chair: a chosen one who can't lose isn't chosen so much as bubble-wrapped. In early October I gave EchoQuest a real setback at 0 HP instead of a shrug, and the prophecy-driven runs feel heavier for it. Destiny means more when failure is on the table.

## The Dark Lord

**The trope:** An ancient evil wants to smother the world in darkness. Destroy the MacGuffin and beat the villain.

**Why it works:** The stakes are plain from minute one, and so is the enemy. Players know what they're fighting for, and against, before they've finished their first tankard. The dark lord also gives a campaign gravity. There's a finish line to build toward, and every move the villain makes threatens something the players care about. No wonder the Dark Lord earns his own entry in Jones's guide.

**Use it straight when:** You want momentum. A campaign without a clear final boss can drift into a string of picaresque vignettes that never quite resolve. Sometimes you just want the cathartic crash of "we beat the dark lord and saved the kingdom." Don't apologise for it.

**How to subvert it:** Give the dark lord a legitimate grievance. Maybe the civilisation your players are defending wronged them first. Maybe their "darkness" is a necessary ecological reset that the current rulers keep suppressing. Maybe the dark lord is the heroes' former teacher, or a parent. Worse still, it might be the version of themselves they're desperate not to become. Ursula K. Le Guin went furthest with that last idea. In *A Wizard of Earthsea* (1968), the shadow hunting young Ged turns out to be bound up with Ged himself, and as she told the interviewer for the [NEA's Big Read guide to the novel](https://www.arts.gov/sites/default/files/Readers-Guide-WizardofEarthsea.pdf), "Ged has a darkness in him that he couldn't handle." A villain who makes a coherent argument is far more unsettling than one who simply wants chaos. The most disturbing dark lords are the ones you half agree with by the middle of their final speech, and your players will bring that scene up for years.

Here's a particularly nasty twist: the dark lord *is* defeated by the conventional means everyone swore would work, and the world gets worse as a result. That "darkness" was the only thing holding something else back. So, now what?

## The Ancient Ruin With a Secret

**The trope:** Players explore a crumbling structure, solve puzzles, uncover lore, fight a guardian and leave with treasure.

**Why it works:** It bundles exploration and mystery into one tidy package with a payoff at the end. Ruins are basically video-game level design ported into RPGs. The space is easy to picture, and its secrets come out one room at a time until the boss fight settles things. Players get a self-contained adventure where progress is easy to measure.

In an audio game, a ruin also lives or dies on its soundscape. Back in May I spent a while making EchoQuest's ambient soundtrack duck under sound cues, so the background hum steps aside whenever something important clicks or slams shut. A dungeon heard through headphones needs that kind of breathing room.

**Use it straight when:** Your campaign needs a breather between heavier story arcs. A clean dungeon crawl makes a lovely palate cleanser. It's also where the low-stakes character moments tend to surface: players bicker their way down corridors and crack a puzzle together. Then comes one tense, shared beat with the boss. Skip ruins entirely and the campaign can harden into a wall of dialogue.

**How to subvert it:** The ruin isn't ancient at all. It's recent, and someone faked the weathering to lure treasure-hunters into a trap. Or the "guardian" is the last survivor, not a monster, and has been waiting fifty years for a rescue; the hostility is desperation rather than malice. Or the lore inside flatly contradicts the history everyone outside believes, and the players have to choose: carry the truth out, or let a comfortable lie stand. Or, cruellest of all, the ruin's "treasure" is a sealed evil, and your villains have been counting on the players to crack it open for them.

## The Wise Old Mentor

**The trope:** A seasoned figure guides the players early on, then steps aside (or dies dramatically) so they can grow.

**Why it works:** The mentor orients new players and points them somewhere without railroading them. They also set the world's tone and stakes with real authority behind their words. Mentors are the load-bearing characters of episodic fantasy: Gandalf, Obi-Wan, Yoda, Vimes, Granny Weatherwax. They tell the audience what kind of story we're in. The figure is far older than the genre, too. That same Earthsea guide points out that Le Guin drew on what the psychologist Carl Jung called archetypal images, and "the wise old man" comes first on the list.

**Use it straight when:** You want a confident voice to set up the campaign. New players benefit most, since a mentor is a built-in tutorial NPC who can explain how the world works without anyone breaking immersion.

**How to subvert it:** The mentor is wrong. Not maliciously. Sincerely and catastrophically wrong, with total confidence, about something that matters. Players who trusted them completely learn a harsh lesson about authority, while the ones who asked awkward questions get vindicated. Or the mentor isn't who they claim to be: the friendly old wizard is the dark lord's brother, and his "guidance" has been steering the party exactly where the antagonist wants it. Or the mentor is entirely sincere and dies as the trope demands, but the lessons they left behind turn out to be useless against the problem the players actually face. The campaign's central question then becomes: how do we keep going when the wise voice we leaned on is gone, and never had the answer anyway?

This is one place where I made a deliberate call in EchoQuest's GM instructions. NPCs there are allowed to dodge questions and lie when it suits them. A mentor who is flat-out mistaken falls naturally out of that rule, and I'd much rather players learn to weigh advice than swallow it whole.

## The Magical MacGuffin

**The trope:** An object of great power must be found, then either guarded or destroyed.

**Why it works:** It creates a clear objective that can travel anywhere and pull in anyone. The Ring, the Triforce, the Crystal of Whatever: objects like these let writers hang a long story on a single goal that gives every scene a reason to happen. Players also get to physically *carry* the stakes around, which keeps them present.

The name comes from the movies. As [Quote Investigator traces it](https://quoteinvestigator.com/2018/02/28/macguffin/), Alfred Hitchcock told François Truffaut that the MacGuffin "is the term we use to cover all that sort of thing: to steal plans or documents, or discover a secret, it doesn't matter what it is." That last clause is gold for a GM. The object matters enormously to the characters, yet what it *is* matters far less than what people will do to get their hands on it.

**Use it straight when:** You want a long campaign with a clear through-line and lots of side adventures. The MacGuffin is permission to wander, and anything you stumble into on the way there or back is fair game.

**How to subvert it:** The MacGuffin doesn't work as advertised. The legendary sword that was supposed to slay the dark lord just... doesn't. Or it works perfectly, except using it demands a moral compromise nobody saw coming, because the sword feeds on its wielder's life. Or the "evil" faction trying to steal it has a better plan for it than the "good" faction guarding it, and the players have to figure out which side they were really on all along. Or the MacGuffin isn't an object at all. It's a person or a memory (sometimes just an idea), and the whole fetch-quest framing was misdirection. The reveal that the thing everyone chased was inside them all along works exactly once, and it's devastating when it does.

## The Meta-Trope: Earned Subversion

The single most important rule of trope subversion is this: a twist only works if the trope was believable first. A "the chosen one was wrong all along" reveal falls flat if the players never believed in the chosen one to begin with. The setup has to feel sincere, sometimes for a whole campaign, before the rug-pull lands. That's why first-time GMs often produce twists that feel cheap. They're winking at the audience from scene one, so there's nothing to subvert, because nothing was ever real.

So play your tropes straight long enough that the players relax into them. *Then* twist. The longer the runway, the bigger the impact. A "secret villain" reveal in scene three is a mild surprise. In scene thirty, after that villain has been everybody's favourite NPC, it can reshape the emotional arc of the entire campaign.

Honestly, this is the rule I copied most faithfully into EchoQuest's Game Master instructions. The GM is told to hold things back and plant small details early, then pay them off turns later, "because a reveal hits harder when the player half saw it coming." I didn't invent that idea. It's old tabletop wisdom, and I simply wrote it down where the AI would read it every single turn.

The best campaigns use tropes as the foundation, then surprise players with the floor they build on top. In EchoQuest, the AI Game Master can follow your lead. Give it your world's central tension and your factions' goals (in a Game Bible, or through the [World Builder Wizard](/worlds/new/wizard) on the Storyteller plan) and it will find its own moments to upend expectations. Want to test the waters first? Three of the campaigns in the [library](/library) are free to play. **[Start building your world →](/)**
`,
  },
  {
    daysFromNow: 7,
    title: "Keyboard Navigation in EchoQuest: Play Without a Mouse",
    excerpt: "EchoQuest plays fine without a mouse. Here's every keyboard shortcut, plus how to set the game up alongside your own screen reader.",
    content: `# Keyboard Navigation in EchoQuest: Play Without a Mouse

Plenty of people play EchoQuest without ever touching a mouse. Some are blind and drive everything through a screen reader; others just like the keyboard better. (And yes, sometimes the mouse simply dies ten minutes before you sit down to play.) I built the game so every feature can be reached from the keyboard and every in-game action has a shortcut. There shouldn't be a single spot, from the main menu and the world library through character creation, a live session, settings and your account page, where you're forced to grab a mouse to make progress. If you find one, that's a keyboard trap, and I treat it as a bug to fix before anything else. The W3C puts [No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html) at Level A, the most basic tier of its accessibility guidelines, and I think that's exactly where it belongs.

Part of that promise gets checked by machines, which helps me sleep. Every change to the web app runs through an automated accessibility suite: Playwright drives a real browser while axe scans each screen. Among other things, it presses Tab on the home page to confirm the skip link lands in the main content, and it plays a turn by keyboard to confirm the number keys really do pick a choice.

This post is the full reference for keyboard players. We'll start with the basics (Tab and Escape, mostly), move on to the shortcuts you'll use mid-session, then cover how screen readers fit in, and finish with a handful of power-user tricks. New to keyboard-first browsing? The first section is all you need today, and the rest will sink in over your first few sessions.

## The Core Navigation Model

EchoQuest follows standard web accessibility patterns, so if you can get around a web page by keyboard, most of this will feel familiar:

- **Tab** moves focus forward through interactive elements
- **Shift+Tab** moves focus backward
- **Enter** or **Space** activates the focused button or link
- **Escape** closes open panels and gets you out of the text box
- **Arrow keys** move inside compound widgets (tab lists, sliders, radio groups)

Focus is always visible. Whatever element is active gets a thick outline, 3 pixels wide with a small gap around it, so it's hard to lose. The W3C's [Focus Visible criterion](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) only asks that some focus indicator be visible, and version 2.2 added a stricter, optional criterion (Focus Appearance, Level AAA) about its size and shape. Some sighted keyboard users find bold focus rings ugly. I made ours loud on purpose anyway, because players with a little residual vision, and players with motor disabilities who move slowly through a page, should never have to hunt for where they are. If the default still isn't enough, Settings also offers a high-contrast theme and a large-text option.

The tab order follows the logic of the page, not merely its looks. Within a section, focus travels top to bottom and left to right, then moves on to the next section. My rule is never to use CSS tricks that rearrange content visually without rearranging the underlying page, because that pulls the tab order out of sync with what's on screen. The W3C even lists ["changing the meaning of content by positioning information with CSS"](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html) as a documented failure. So if the tab order ever seems wrong somewhere, it's a bug. Please tell me about it.

## In-Game Shortcuts

During a play session, these keys let you act quickly without reaching for anything else:

| Key | Action |
|-----|--------|
| **1 to 9** | Pick the matching numbered choice |
| **T** | Jump to the text box to type your own action |
| **Enter** | Submit your action |
| **V** | Start voice input |
| **R** | Replay the last narration |
| **Space** or **P** | Pause or resume narration |
| **[** and **]** | Slow speech down or speed it up |
| **M** | Turn the ambient soundtrack on or off |
| **L** | Hear where you are |
| **S** | Hear your character's status |
| **I** | Open or close your inventory |
| **Q** | Open or close the quest log |
| **C** | Open or close the character sheet |
| **U** | Undo the last turn |
| **H** | Open or close Help |
| **Esc** | Close an open panel or leave the text box |

A few notes on the thinking behind these.

Choices sit on the number keys because the game reads them to you in order, so "option two" is simply the 2 key, and you get up to nine of them. T is a single letter on purpose: switch users, who often map one switch to "type", can open the text box in a single action. R earns its one-key slot too. Re-listening to a line of narration is the audio version of rereading a paragraph, and I'd bet it ends up being the key you press most. Every time you nudge the speed with [ or ], the game tells you the new value out loud, so you're never guessing.

There's one wrinkle with Space, though. If a choice button has focus (which is where focus lands after each turn by default), Space presses that button, the way it does anywhere on the web. So P is the safer pause key. Also, while you're typing in the text box, the single-letter shortcuts switch themselves off, which means you can type "I search the chest" without your inventory popping open halfway through. Press Escape to step out of the box and the shortcuts come right back.

H is your safety net. Press it at any point in a session and the Help panel opens as a labelled dialog, then press H again (or use its Close button) to put it away. New players also hear a short reminder about H when their first session begins, so nobody has to discover it by accident.

## Screen Reader Compatibility

EchoQuest sticks to plain semantic HTML and standard ARIA, so it's meant to work with the screen reader you already use, be it NVDA, JAWS, VoiceOver, TalkBack or Orca. That matters, because no single reader rules the field. In WebAIM's [most recent screen reader user survey](https://webaim.org/projects/screenreadersurvey10/) (1,539 responses, collected in December 2023 and January 2024), JAWS and NVDA ran neck and neck as primary desktop readers at 40.5% and 37.7%, with VoiceOver at 9.7%. I won't pretend every combination is flawless. Here's what the game does:

- All game text is real HTML text, never images, so your screen reader can read it natively
- When new choices arrive, they're announced as a group ("3 options available...") and focus moves to the first one, but only once the narrator has stopped talking
- Each choice button carries its own text in its label ("Option 2: Follow the smuggler"), plus a note when a choice advances an active quest, so you hear exactly what a sighted player sees
- Status changes (damage taken, health recovered, items gained or lost) go to a screen-reader-only live region set to polite, so they never trample the narration; hitting zero health or levelling up is announced straight away
- Scene transitions get announced too, and the game screen is split into labelled regions (the story, the available choices, the game controls) that you can jump between
- Form fields have visible or programmatically associated labels, never placeholder text on its own

That "only once the narrator has stopped" rule came out of a mistake. Back in May I realised choices were being announced and focused while the narrator was still mid-sentence, so screen reader users got two voices talking over each other. Now the game simply waits for the narration to finish. Funny thing is, it's a bug you can only hear and never see, which is exactly why audio-first testing matters so much to me.

The result: a screen reader user playing EchoQuest hears the story and knows when their health changes. They hear which choices are on the table and act on them, all without leaving their own screen-reader rhythm.

## The Skip Link

At the very top of every page, before any navigation, sits a hidden link that appears the moment it gets focus: **"Skip to main content."** It lets keyboard and screen reader users jump straight past the navigation bar instead of tabbing through it on every page load. Right behind it are two more, "Skip to audio controls" and "Skip to action input", which really pay off during a session. The W3C's [Bypass Blocks criterion](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) names a link like this, placed at the top of each page, as one way to meet its Level A requirement. For repeat visitors it's the single most useful accessibility feature on the site, and once you know it's there, you'll reach for it constantly.

If you're sighted and have never noticed the skip link, that's by design. It stays off-screen until it receives focus, then pops into view at the top-left. Press Tab once after any EchoQuest page loads and it's the very first thing you'll hit.

## Setting Up Your Preferred Voice

If you use a system screen reader alongside EchoQuest's built-in narrator, you'll probably want to silence the narrator so you don't get double narration. Go to **Settings → Voice** and slide the narration **Volume** down to zero. That's the switch that counts. Whenever the narrator is audible, I hide the spoken narration from screen readers so you don't hear every line twice; the moment you mute it, the story text opens back up to your screen reader. You then read each scene in the "Story narration" region with your own voice, at the rate your ears are already trained to. Spoken prompts elsewhere, such as the step-by-step questions in the World Builder Wizard, move over to your screen reader's live region as well. Honestly, I think this is the best setup for anyone fluent with NVDA or JAWS, because the game then sounds just like the rest of their computer.

If you're not using a system screen reader, the built-in narrator handles everything: ElevenLabs premium voices on the Storyteller and Creator plans, and a clean browser voice on the free plan. Either way, narration speed runs from 0.5× to 2.0×. The settings slider moves in fine steps, while the [ and ] keys nudge it by 0.1 at a time. Here's the setup I'd suggest for seasoned screen reader users, though: mute EchoQuest's narration so your own reader handles the text, and keep the ambient soundtrack running on its own for atmosphere. M toggles that soundtrack mid-game, and there's an ambient switch on the same Voice settings page.

## Tips for Power Users

- Keep the game in its **own browser tab** and hop back with your browser's tab shortcuts (Ctrl+Tab on Windows and Linux, Cmd+Option+arrow on a Mac). Browsers normally remember which element had focus, so you land back where you left off.
- Use **browser zoom** (Ctrl+plus, or Cmd+plus on a Mac) to enlarge text. The interface is sized in relative units, so zooming scales the text instead of chopping it off, and the **Large text** setting stacks on top. If anything breaks at 200% zoom, that's a bug I want to hear about.
- The text box supports **standard editing shortcuts**: Home and End, Ctrl+A, Ctrl+Backspace to delete the previous word, and Ctrl+Z to undo your typing. (That Ctrl+Z only touches your text. The **U** key, pressed outside the box, undoes the whole last turn.) If you write long custom actions, these save real time.
- On NVDA or JAWS, mind **browse mode**. There, the screen reader keeps single letters and numbers for its own quick navigation (in NVDA, [H jumps to the next heading and 1 to 6 jump by heading level](https://webaim.org/resources/shortcuts/nvda)), so EchoQuest never sees those keys. Switch to focus mode with NVDA+Space, or pass one key through with NVDA+F2. JAWS has its own pass-through command too.
- Use **landmark and heading navigation** to get around a busy page. D jumps between regions in NVDA, and the rotor does the same job in VoiceOver. On the game screen, the story, the choices and the controls are each a labelled region.
- The **R key replays the last narration**. It's the audio equivalent of rereading a sentence, and it's the one key I'd tell any new player to learn first.
- Lost the thread after a break? The **Catch up** button in the game controls recaps the last three scenes.
- Prefer typing to picking? Open the audio controls during a session and change **"After each turn, focus"** from the first choice to the action input. That saves you a Tab on every single turn.
- If a session feels stuck, **Tab through the game area** to find the focused choice or text field. After a slow network response, focus can occasionally land somewhere unexpected.

## Reporting Issues

If something doesn't work for you with the keyboard or your screen reader, please tell me. Accessibility reports go straight to the top of my list. The quickest route is the [Contact page](/contact-us), linked from the site footer. Tell me which browser and screen reader you were using, and describe the exact action you were trying to take; with those details I can usually reproduce the problem on the first attempt.

EchoQuest rests on one belief: accessibility isn't a separate experience. It's the same game, whichever input suits you. Keyboard-only play isn't a "lite" edition, either. It's the same world and the same AI Game Master, just reached through different keys. So why not try a free campaign with your hands on the keyboard tonight? **[Start playing →](/library)**
`,
  },
  {
    daysFromNow: 8,
    title: "ElevenLabs Premium Narration: Why Voice Quality Changes Everything",
    excerpt: "Browser voices read words; premium voices perform them. What changes when you switch EchoQuest to ElevenLabs narration, and when the free voice is enough.",
    content: `# ElevenLabs Premium Narration: Why Voice Quality Changes Everything

Computers have been talking for longer than most people think. Back in 1961, a team at Bell Labs in New Jersey got a computer to sing "Daisy Bell", and the Library of Congress later [added that recording to the National Recording Registry](https://www.loc.gov/static/programs/national-recording-preservation-board/documents/DaisyBell.pdf). For decades afterwards, though, synthetic speech sounded robotic. It was flat and monotone, it mangled every proper noun, and it chopped long sentences into chunks that broke in all the wrong places. Those voices were useful rather than enjoyable. The screen-reading voice in your operating system belonged to the same family as the one in your GPS (and the one that read spam emails aloud), and most of us quietly accepted that "computer voice" meant "put up with it." That era is over.

EchoQuest's premium narration runs on ElevenLabs, and to my ear it's a genuine leap in what an AI voice can do. The narration starts to disappear, the way a great audiobook narrator's performance disappears: you're inside the world instead of being aware that someone is reading to you. That's what I want from the premium tier, and it's why I spent a good chunk of May and early October on the plumbing behind it. This post walks through what actually changes when you switch from browser speech to premium voices (and what's still imperfect), then helps you pick between the two for the way you play.

## The Difference Is Emotional Expressiveness

Browser speech reads words. ElevenLabs voices *perform* them.

When the AI Game Master describes a tense confrontation, a good premium voice tends to drop a little in pitch, slow down and leave a half-beat of silence before the line that lands. During a chase the pace quickens, the breath gets shorter and the words start running together, much as a real reader would handle it. A frightened NPC sounds tight, with the pitch creeping upward. An amused one has a smile in the voice that you can hear without seeing it. I don't program any of those micro-variations. They come from the model reading the emotional register of the text, roughly the way a human narrator absorbs tone from context.

ElevenLabs says as much in its own [best-practices guide](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices): the models pick up emotion from narrative context or from explicit dialogue tags, and the explicit route gives more predictable results. That lines up with a lesson from late May. NPC voices in EchoQuest refused to switch, and the cause turned out to be that an NPC's lines weren't woven into the narration at all. Once the dialogue sat right next to the words describing how it was said, the voices had something to perform.

For an audio-first game, none of this is cosmetic. It's the gap between reading a stage direction and watching a performance. "She crossed her arms and waited" is, in plain browser speech, just a row of syllables. With premium narration it gets rhythm: a beat of arrival on "crossed", a slight stretch on "waited" that hints at the silence afterwards. The text the AI generates is identical either way. Receiving it feels completely different.

## Handling Fantasy Proper Nouns

Proper nouns are a perennial headache for speech engines in RPGs. Generic voices mangle invented names constantly: a character called Aeryndel comes out "Ay-ren-del" one minute and "Air-in-DELL" the next, and that inconsistency alone is enough to break immersion. Place names are even worse. A common browser-voice habit is reading "Eldarath" three different ways in a single session, which is the audio equivalent of a typo on every page.

ElevenLabs voices handle this better than any browser voice I've heard. Fantasy naming patterns (the Tolkien-flavoured and Welsh-derived kind especially, with a fair bit of Old Norse in the mix) seem well covered by what these models learned from. They're also more consistent: once a voice settles on a pronunciation for an odd name, it usually keeps it for the rest of the passage. You'll still hear the occasional slip, especially on one-of-a-kind names with unusual letter combinations, but those slips are rare and tend to repeat the same way each time.

What about names you really care about? I'll be straight with you: EchoQuest has no dedicated pronunciation setting today. What works is consistency on the writing side. In your Game Bible, spell each name exactly the way you want it used and add a quick phonetic note beside it (the [Game Bible template](/blog/how-to-write-a-game-bible-the-world-builders-template) has an optional section for exactly this). That keeps the GM's spelling steady from scene to scene, and a steady spelling is what the voice ends up reading. If a name still comes out wrong, borrow a trick from ElevenLabs' docs, which recommend an alias: a substitute spelling the model already pronounces correctly. Get the spelling right before the first scene and it tends to carry through the whole campaign.

## Choosing Your Voice

Storyteller and Creator subscribers choose from a curated set of ElevenLabs voices, each with its own personality. You pick one for the narrator and one for your own character, then decide which voices go into the pool for NPCs. Since late May, NPCs get gender-matched voices from that pool across the whole catalog, so the gruff harbourmaster doesn't suddenly sound like his niece. Here's roughly how the voices break down by mood:

- **Deep and theatrical**: Josh, or Arnold if you want gravel in it. Made for dark fantasy and horror, and handy for grim political thrillers. It reaches for gravitas without being asked.
- **Warm and conversational**: Rachel, the default narrator. A friendly, mid-range voice for adventure and comedy, and the closest thing here to a contemporary audiobook reader.
- **Measured and cool**: Antoni (measured, authoritative) or Adam (neutral, journalistic). Crisp and articulate, ideal for mystery and intrigue or hard sci-fi. It never oversells.
- **Bright and energetic**: Elli, or Domi for something more confident. A livelier pick for action-heavy campaigns that relishes a dramatic moment.
- **Soft and reflective**: Bella. A gentle, contemplative voice for slice-of-life campaigns and dream-logic stories, and lovely in emotionally raw scenes.

You can preview every voice and switch whenever you like in **Settings → Voice**. I'd suggest listening to a few minutes of each on the world you're about to play, because the right voice for a noir cyberpunk campaign is rarely the right one for cosy fantasy. There's also a lot to be said for choosing one voice per campaign and sticking with it, the way you'd follow a favourite audiobook narrator across a whole series.

One bit of behind-the-scenes detail, since people sometimes ask why premium narration doesn't stutter: I batch each speaker's lines into a single voice request, and since early October the next clip is fetched while the current one is still playing. So by the time the narrator finishes a sentence, the innkeeper's reply is usually already waiting.

## Speed and Pitch Controls

Premium narration supports speed adjustment, so you decide how fast the story comes at you. Maybe you like a quicker clip for action scenes and a slower, more deliberate read when the fog rolls in. Either way, you can change it mid-session without restarting anything: the [ and ] keys nudge it, and the speed control in the game toolbar works too.

Speed is the setting most people touch. The default is tuned for a fresh listener, clear and unhurried. Once you've played for a few hours and the narration starts to feel slow, push it up to 1.2× or 1.4×. If you're used to a fast screen reader, you can go all the way to 2.0×.

Here's some plumbing I learned the hard way. According to the same ElevenLabs guide, its voices only accept speeds between 0.7 and 1.2. Anything beyond that, EchoQuest handles by speeding up playback in the browser, and the first time I tried that, in May, every premium voice pitched up into a chipmunk. The fix was telling the browser to preserve pitch while it changes speed, so a fast narrator now sounds like a fast talker instead of a cartoon.

Pitch works differently. Browser voices get a pitch slider, and a small downshift can make any voice feel weightier without changing its character, which is handy when you want to lean darker for a single scene. On ElevenLabs voices, pitch is fixed. Each one is a recorded performance with its own natural register, and frankly I'd rather you pick a deeper voice than bend a lighter one out of shape.

## Is Free TTS Good Enough?

Yes. I've put real work into making browser narration as good as it can be, and free players get narration that clearly communicates everything in the scene. Most of that work was invisible bug-hunting. Chrome's built-in voice has a long-standing habit, documented in a [Chromium bug report](https://issues.chromium.org/issues/41346274), of failing on long text without warning. In practice it cut narration off roughly 15 seconds in, and in May I had to work around that (along with a nasty race condition). It came back to bite me in late September, when the browser narrator started dropping out a few seconds into a scene, so I fixed it again. Since early October, narration also starts speaking while the GM's reply is still being written, which trims real waiting time off every turn on every plan.

One thing worth knowing: the free narrator uses whatever voices your own device provides. The browser can only offer [the voices available on the current device](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices), so two free players can hear quite different narrators. Try a few in Settings → Voice before you judge. The gap between browser speech and premium is real, but it isn't the gap between playable and unplayable. Free players get the full game.

If you mainly use a screen reader with your own preferred voice, the built-in narration may matter less to you than the quality of the game text itself. In that case, mute EchoQuest's narration and let NVDA, JAWS or VoiceOver handle the words at whatever rate you're used to; the [keyboard guide](/blog/keyboard-navigation-in-echoquest-play-without-a-mouse) explains the setup. For you, EchoQuest's value lives in the AI Game Master and the worlds it runs, not in the voice I ship. I respect that completely, and I made sure the game is just as complete without my narrator.

## When Premium Really Shines

Two situations show the gap between free and premium most clearly. The first is **first-time emotional moments**. Think of the first time an NPC you like dies, or the first time someone you trusted turns on you; a painful confession from your own character lands the same way. Premium voices commit to the moment in a way browser speech doesn't, and the difference can be a lump in your throat versus a piece of information drifting past.

The second is **long sessions**. Browser speech is fine for ten minutes. After two hours, though, its unchanging cadence becomes draining, and you start tuning out, which means you start missing details. Premium narration's natural variation keeps your attention for far longer. If you tend to play in long stretches, that's the best reason I know to upgrade.

And if neither applies? If you mostly play in short bursts and don't need the theatrics, free is genuinely fine, and I want you on it. EchoQuest's free tier isn't a hobbled trial. It's a complete game: three campaigns from the [library](/library) and 60 AI turns every day, with full keyboard and voice controls on top.

Premium narration comes with the Storyteller plan ($15 a month or $129 a year) and the Creator plan ($29 a month or $239 a year). **[Compare plans →](/)**
`,
  },
  {
    daysFromNow: 9,
    title: "10 Classic RPG Character Archetypes (And How to Play Them Well)",
    excerpt: "Ten classic RPG character archetypes, from the reluctant hero to the haunted survivor, what makes each one work, and one tip for making it yours.",
    content: `# 10 Classic RPG Character Archetypes (And How to Play Them Well)

Archetypes exist in RPGs for the same reason they exist in books: they've been tested to destruction. They hand players an emotional way in and a set of instincts to act from, and they set up a relationship with the world that keeps throwing off interesting choices. The brooding rogue and the idealistic paladin aren't lazy shortcuts, and neither is the haunted scholar. They're patterns storytellers have polished for thousands of years because they reliably create dramatic friction. When the mythologist Joseph Campbell published The Hero with a Thousand Faces in 1949, he argued that heroic tales across cultures share [one underlying pattern he called the monomyth](https://www.jcf.org/learn/joseph-campbell-heros-journey). You don't have to swallow his whole theory to notice the same faces turning up again and again. A character who fits squarely into one of these archetypes will *always* have something to do in a scene, because the archetype arrives with built-in attitudes and a contradiction or two.

The mistake new players make is picking an archetype and stopping there. They scribble "brooding rogue" on the character sheet and assume that's plenty. It isn't. An archetype is a starting point, a chassis. What makes a character memorable is the *specificity* you bolt on top: the particular wound, say, or a lost person with an actual name, or the exact moral line they refuse to cross. D&D's basic rules push in the same direction, by the way. Alongside ideals and flaws, they ask for bonds, which tie your character to [specific people and places in the world](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/personality-and-background).

I care about this more than you might expect, because of a decision I made about EchoQuest's character creator. If a world's Game Bible doesn't define classes, you won't get a menu of warriors and mages. You type whatever role or title you fancy (the placeholder suggests things like Relic Diver or Court Attaché), and the GM is told flat out not to invent generic classes for you. That puts the archetype, and all the specifics, squarely in your hands. So it's worth knowing how to use them. Below are ten archetypes that turn up in nearly every RPG genre. For each, I'll explain what makes it tick and give you one concrete tip for making it yours.

## 1. The Reluctant Hero
*"I just want to go home."*

They didn't ask for any of this. The world dragged them in regardless. This archetype works because the inner tug of war, safety against doing what's right, produces constant tension. Every choice turns into a small re-decision: stay involved, or walk away? Campbell even gave this moment its own stage in the hero's journey, the Refusal of the Call, and stories have leaned on it ever since. It also hands the AI Game Master something to riff on. The world can keep inventing ways to make leaving impossible, and each one feels personal.

**Play it well by:** giving them a specific thing to get back to, not just "normal life". Make it a person, or a promise. "I want to go home to my sister, who's waiting at our farm in the eastern valley, and I told her I'd be back before the harvest" beats "I just want to go home" by a mile. Specificity gives the GM something to weaponise. When home gets harder to reach, the loss is concrete, and when the hero finally chooses to stay involved, the cost is real. I wrote a line into EchoQuest's GM instructions telling it to bring old threads back "when it hurts or helps the most". A sister waiting on the harvest is exactly the kind of thread it can tug.

## 2. The Disgraced Noble
*"I used to have everything."*

Status gone, reputation in tatters, yet the manners and instincts of privilege remain. That mix gives you comedy and tragedy in one package, plus some lovely friction with less privileged party members. The disgraced noble can lecture a king on table etiquette while sleeping under a bridge. The gap between what they know and what they have drives every good scene they're in.

**Play it well by:** letting them stay genuinely competent in courtly situations, because the disgrace shouldn't wipe out their skills. Decide why they fell. A scandal? A coup? A bet they really shouldn't have lost? Some other humiliation entirely? Then decide whether they want their station back. A noble who's *trying* to climb back up plays very differently from one who has accepted the fall and quietly enjoys the freedom of obscurity. Both are great, so pick one early. If you go for the climb, it helps to know that EchoQuest's GM tracks your standing with every named NPC on a scale from -100 to +100, so clawing your way back into a duke's good graces can be quite literal.

## 3. The True Believer
*"The cause is worth any price."*

Here's a character whose faith, in a god, say, or in a cause, shapes every choice they make. It works best when that faith gets tested. The interesting question for a true believer is never "will they do the right thing?" It's "what does the *cause* say is right when the situation is honestly murky?"

**Play it well by:** spelling out what the faith demands in concrete terms, so that when it clashes with other values, the dilemma actually bites. "She believes in justice" means nothing. "She believes the goddess of justice requires every sworn oath to be kept, even when keeping it causes suffering" generates scenes all by itself. A true believer should also have one specific moment from their past when they were tested and held the line. That moment is the GM's crowbar for prying them open later.

## 4. The Cynical Veteran
*"I've seen how this ends."*

They've seen too much and trust nobody, so they get by on instinct. It's a dark fantasy staple. The veteran's value to a party is pattern recognition: they've watched factions like this one rise and fall before, and they know exactly what's coming. Their weakness is inertia. They assume the worst, and sometimes the worst really is happening. Sometimes it isn't.

**Play it well by:** showing what they *were* before the cynicism set in, through one relationship or value they haven't abandoned. A veteran who still writes to their dead commander's widow every winter is far more interesting than one who's bitter all the way through. That remnant of their old self is what other characters can connect to, and it's what eventually drags them back into caring.

## 5. The Eager Apprentice
*"Teach me everything."*

Bursting with enthusiasm and a touch reckless, the apprentice learns on the job. They shine brightest when there's a mentor in the story. The apprentice gives you permission to ask questions you honestly don't know the answer to, so everyone at the table (the GM included) can think out loud through them. In a solo EchoQuest game that mentor will usually be an NPC, and the GM gets to decide just how patient they are.

**Play it well by:** having them make one particular kind of mistake again and again until a pivotal moment forces real growth. The apprentice who keeps trying to fix every problem with their newest spell sticks in the memory far better than a generic eager learner. When they finally realise the answer to the climactic problem doesn't involve magic at all, the arc lands. So pick one mistake pattern early. Let it cost them, and then let it stop costing them at the moment that matters.

## 6. The Outsider
*"Your customs are strange to me."*

This is a character from elsewhere: another culture, or sometimes another world entirely. The outsider gives you a lens for examining everything the world takes for granted. Through them you can ask, in character, all the questions a player wants to ask out of character. Why does this kingdom worship that god? And why has this conversation suddenly gone so awkward?

Writers have pulled this trick for centuries. In 1721 Montesquieu published Persian Letters, in which two Persians on their first trip to Europe write home about what they see, and the result is [a satirical portrait of French and particularly Parisian civilization](https://www.britannica.com/topic/Persian-Letters). The visitors' bafflement does all the heavy lifting.

**Play it well by:** rooting their outsider view somewhere specific instead of in generic naivety. An outsider from a strict matriarchal society who's bewildered by the kingdom's male-only knighthood is interesting. One who's simply confused by everything is annoying. Decide what the *home* culture assumes, then let those assumptions colour every reaction. Through them, the home culture becomes a character in its own right.

## 7. The Reluctant Monster
*"I am what I am. It doesn't define me."*

Here's someone with a monstrous nature (a curse, maybe, or a bloodline nobody would envy) who's trying to live differently. The drama lies in the daily refusal. Every morning they choose, again, not to be what everyone assumes they are.

**Play it well by:** letting the monstrous side surface in useful, even heroic ways. The archetype gets far more interesting when the "curse" becomes a tool. A vampire who refuses to feed on humans is fine. A vampire who has learned to use just enough of their nature to save someone, at a personal cost, is unforgettable. Nor should the reluctant monster loathe every part of themselves. They should be selectively, surgically self-controlled, with one clear thing they absolutely will not do.

## 8. The Con Artist with a Heart
*"I only steal from people who deserve it."*

Charming and wildly untrustworthy, yet oddly principled. The con artist gives every social scene a buzz of "what are they really up to?", and they let you improvise lies and schemes the GM has to react to on the spot. In EchoQuest that's charisma territory, since deception and persuasion both roll on charisma when a skill check comes up. A real d20 decides whether the mark buys it.

**Play it well by:** making their real moral line crystal clear, the thing they won't do however big the payoff. It could be any of these:

- They won't cheat children
- They won't betray a partner mid-job
- They'll steal from anyone, but they won't cause physical harm

The line is what makes the archetype dramatic instead of unpleasant. Without it, they're just a thief. With it, they're a thief with a code, which is one of the most durable character types in storytelling. Funnily enough, even Robin Hood didn't start out with a tidy code. The University of Rochester's Robin Hood Project points out that the earliest ballads show [a violent yeoman who steals from the dishonest and helps those whom he pleases](https://d.lib.rochester.edu/robin-hood/text/chandler-robin-hood-development-of-a-popular-hero.html). The robbing-the-rich-to-help-the-poor version arrived later, and I'd argue the code is what made him the hero people still remember.

## 9. The Scholar Out of Their Depth
*"Theoretically, I know how this works."*

Brilliant in their own field, hopeless out in the actual field. The scholar's gap between competence and incompetence is endlessly entertaining, and it gives the rest of the party a clear job: keep this person alive long enough to reach the place where their knowledge actually solves the problem.

**Play it well by:** letting their expertise save the group in one key moment nobody saw coming. Decide what their specialty is, perhaps pre-imperial languages or the medicinal botany of marsh plants, and trust the GM to set up a moment where exactly that knowledge is needed. The reveal where the scholar finally gets to *be* useful, after a whole campaign of being plainly the least dangerous member of the group, is one of the best payoffs in tabletop tradition. Mechanically, lore and investigation checks in EchoQuest roll on intelligence, and whenever you uncover a significant piece of lore, the GM files it in your codex. Find five and you earn the lore-keeper achievement, which feels about right for a scholar.

## 10. The Haunted Survivor
*"I should have died. Others did."*

Survivor's guilt, pushed forward by ghosts. It isn't just a literary device, either. Clinicians describe it in people who have been exposed to death and stayed alive, and it [has been reported in a wide range of traumatised groups](https://pmc.ncbi.nlm.nih.gov/articles/PMC7611691/), so it deserves a little care at the table. The haunted survivor has more inner motion than any other archetype, since they're forever arguing with people who aren't there. Good GMs will have those people turn up in dreams, or in a stranger on the road who happens to have the dead man's laugh.

**Play it well by:** naming the people they lost. Give each one a name and a memory, and add the thing they wish they'd said before the end. "She lost her unit in the war" is generic. Compare it with this: "She lost Captain Hessen, who taught her to ride. She lost Tomas, who laughed at every one of her jokes, even the bad ones. And she lost Ela, who was three months from the end of her contract and a trip home to her village in the south." That's heartbreaking, and now the GM has three threads to pull whenever the world wants to test her. Specificity is empathy you can write down. (Small aside: EchoQuest has an achievement for dropping to 1 HP or less and pulling through, and its internal name is literally second_chance. For a haunted survivor, that might cut a little close to the bone.)

## Mixing Archetypes

Once you've got one of these ten in mind, you can layer a second on top for extra texture. A Disgraced Noble who is also a True Believer beats either one alone. Their fall happened because they refused to compromise their faith, and now they're clinging to that faith in poverty. Here are two more pairings I like:

- A Con Artist with a Heart who is also a Haunted Survivor started stealing because they couldn't save the people they were trying to support
- An Eager Apprentice who is also an Outsider is learning a new culture's magic while still flinching at half of its assumptions

Legends mix them too. Over the centuries, retellings turned Robin Hood from that violent yeoman into a dispossessed nobleman who robs the rich. That's an outlaw with a code and a disgraced noble rolled into one.

Don't stack more than two, though. Beyond that, the character starts to read like a checklist. I'm convinced that two distinct archetype lenses with one specific wound underneath is the most reliable recipe for a character your AI Game Master will treat as the protagonist of a story rather than a generic adventurer.

Pick one of these for your next EchoQuest session. Character creation has an optional backstory step, and whatever you write there travels with your character into every single turn, so the GM never loses it. Give the AI Game Master a sentence or two about your archetype, named specifics included, and listen to how the story bends around who you are. Which one are you going to try first? **[Create your character →](/library)**
`,
  },
  {
    daysFromNow: 10,
    title: "How to Write a Game Bible: The World-Builder's Template",
    excerpt: "A fill-in Game Bible template for your RPG world (overview, conflict, factions, tone, rules and opening scene) that you can upload to EchoQuest.",
    content: `# How to Write a Game Bible: The World-Builder's Template

A Game Bible is the one document that defines your world. It's what the AI Game Master reads before your first session begins, and it's what the GM leans on when a player asks something nobody saw coming, thirty hours into a campaign. A great Game Bible gives you consistent, immersive storytelling. A vague one gives you the Generic Fantasy Experience™, where worlds blur into one another and every scene drifts toward the bland middle of everything the model has ever read. Even the NPCs start to sound alike.

This post is a practical template you can fill in as you go. By the end, you'll either have a complete draft or a clear picture of what's still missing. It works for a brand-new world, and just as well for one you've been quietly incubating for years. I'll also tell you what actually happens to your document when you upload it to EchoQuest, because once you know that, you write differently.

It's short on purpose. A great Bible can be six to ten pages; you don't need a hundred. The AI doesn't read better with more text. It reads better with denser text. There's a hard practical reason too. When you upload a Bible, Claude reads up to 80,000 characters of it (somewhere around 13,000 words), and anything past that gets cut off. It then condenses what it read into a GM briefing of 200 to 400 words, plus tidy lists of the places and people that matter. Every line you write is competing for a spot in that briefing, so make each one earn it.

## What Goes in a Game Bible

Think of your Game Bible as the answers to six questions:

1. **What kind of world is this?**
2. **What's wrong with it right now?**
3. **Who are the major players?**
4. **What does it feel like to be here?**
5. **What are the rules?**
6. **Where does the story start?**

If your draft answers all six clearly and specifically, you've got a playable world. If any answer is vague, the AI GM will plug the gap with the most generic version of that thing in fantasy fiction. I can point to the exact reason in my own code. When Claude extracts a world from an uploaded Bible, it's told to take only what the document actually says and not to invent lore, and a missing field falls back to a bland default such as "unknown" for tone. I'd make that choice again, because it's the honest behaviour. Still, it means blanks stay blank. The whole point of a Bible is to crowd out the generic with your specific.

## Section 1: World Overview (1–2 paragraphs)

Name your world. Describe its scope: one city, a continent, several realms? Give the feel of its historical period: medieval, Renaissance, post-apocalyptic, a secondary-world modern day, or somewhere in the near or far future. State the dominant tone, too: gritty realism, high fantasy, cosmic horror, political thriller, fairy tale or slice-of-life. Then pin down the geography just enough that the AI knows the shape of the map without needing every contour.

*Example: "Valdenmoor is a decaying empire in its third century of slow collapse. Think late Roman Empire crossed with the Venetian Republic: bureaucratic rot and mercenary armies, with gods that are slowly fading. The capital is a port city built on the ruins of three older cities, layered like sediment. Travel between provinces is by river or road, or, for those who can afford it, by airship. The tone is dark and political, with occasional moments of unexpected grace. Magic exists but is rare and slow, and people treat it with suspicion."*

Naming real-world analogues matters a lot. "Late Roman Empire" hands the AI a coherent texture to draw on in a way that "ancient kingdom" never will. Don't be shy about citing influences. The AI recognises them and uses them as scaffolding. I leaned on the same idea myself in October, when I gave each of EchoQuest's nine prebuilt worlds a short block of true, researched detail. The pirate world learned how a ship's bell counts out a watch, and the steampunk one learned how glowing rivets were tossed from the heater to the catcher before being hammered home. Real texture beats invented texture nearly every time.

## Section 2: The Central Conflict

What's the one tension that defines this moment in your world? It should be specific and active, something happening right now rather than ancient history. The conflict is the engine. Without it, your world is a museum.

*Example: "The Emperor has just died without an heir. Three Archduchies are mobilising armies. A fourth is secretly negotiating with a foreign power. The Church has declared it will name the next emperor from among the clergy. Civil war is two weeks away. No major faction is ready, but none can afford to wait."*

History got there first, by the way. After Nero's death in AD 68, Rome lived through the [Year of the Four Emperors](https://www.worldhistory.org/article/1724/the-year-of-the-four-emperors--the-demise-of-four/): Galba, Otho, Vitellius and Vespasian all held power within a single year, and rival legions fought a civil war over the throne. If you need a model for a succession crisis, it's hard to beat.

Notice the time pressure in "two weeks away". It gives the world a clock, and the AI will use that clock. Scenes will refer to it without you having to remind anyone, so the pressure stays on with no extra effort from you. In EchoQuest, a conflict like this also belongs in that short GM briefing, which sits at the top of every single turn Claude plays. Spend your sharpest sentences here.

## Section 3: Factions (3–5)

For each faction, write two or three sentences on who they are and what they want, and on what they're willing to do to get it. Skip the histories. Write current agendas.

Here's a faction template that works well:
- **Name** (and what people call them informally)
- **Public goal** (what they say they want)
- **Real goal** (what they actually want, if it's different)
- **Willing to do** (what's on the table: bribery, assassination, an alliance with a hated rival, a public scandal)
- **Won't do** (the line that defines them)
- **Internal weakness** (the crack that could split them apart)

Three to five factions is the sweet spot. Two feels binary; six feels like homework. Each faction should have at least one other faction it treats as an enemy and one it treats as a complicated ally. Never simple goodwill, and never simple hatred either.

Here's something worth knowing before you write pages about each one. When EchoQuest reads your Bible, every faction boils down to a name, a short description and a disposition toward the player (friendly, hostile, neutral or unknown). That's a small box. So I'd make sure the "won't do" line survives by putting it in plain words near the top, instead of burying it in paragraph four. The same goes for the important NPCs inside each faction. Each one's personality gets trimmed to about 120 characters in the GM's briefing, so lead with the thing that matters most about them.

## Section 4: Tone & Sensory Language

Give the GM a list of sensory details specific to your world. What does the capital smell like? What sounds fill a tavern? What does magic look like when someone casts it? How do the rich and poor districts differ in smell and sound, not just in looks? What does the dominant religion's incense smell like, and what's underfoot in the marketplace?

Details like these separate generic narration from immersive storytelling. The AI is excellent at picking up sensory cues from source material and weaving them naturally into descriptions, but only if you supply them. Three sentences of sensory detail per major location go a remarkably long way.

Smell deserves special attention, I'd argue. Harvard neuroscientist Venkatesh Murthy explains that [odour signals get to the limbic system very quickly](https://news.harvard.edu/gazette/story/2020/02/how-scent-emotion-and-memory-are-intertwined-and-exploited/), reaching the amygdala and hippocampus, which deal with emotion and memory. In an audio game, where nobody sees a single pixel of your world, a well-chosen smell does much of the work a picture would.

A good habit: write one sentence that captures each location's "first ten seconds", meaning whatever a visitor notices first. "The Spice Quarter announces itself at fifty paces with the smell of cardamom and dried fish, cut with burning sandalwood; under that, the constant clatter of small handcarts on cobbles." That sentence will shape every scene set there. It also maps neatly onto how EchoQuest stores places. Each location gets a short line of 8 to 12 words that rides along in the GM's snapshot whenever you're there, plus a fuller description you hear when you press L to ask where you are. Claude also tags each place with an ambient mood, which picks the background track, so a line about harbour bells or dripping moss pulls its weight twice.

## Section 5: Rules & Constraints

What can't happen in your world? Where are the hard limits? Some examples:
- "Magic is rare and feared: nobody casts spells openly"
- "This world has no elves or dwarves; every character is human"
- "Death is permanent and treated with gravitas: there's no resurrection magic"
- "Technology is roughly that of 1200s Europe: no gunpowder weapons yet"
- "There are no gods, but there are ancient creatures people sometimes mistake for gods"
- "Travel between continents takes weeks; teleportation doesn't exist"

About that gunpowder line: choose your century with care, because history moved faster than people tend to think. Brass cannons were [being cast in Florence in 1326](https://www.worldhistory.org/article/1231/artillery-in-medieval-europe/), and an English manuscript from that same year already shows one. Write "1400s Europe, no gunpowder" and a well-read GM (or player) would be entitled to raise an eyebrow.

The GM will respect these constraints throughout your campaign. In EchoQuest, Claude is told to capture every mechanical rule from your Bible, and those notes go into the GM's briefing whole instead of being squeezed into the short summary. The GM's own instructions also say the world's Bible is the source of truth for setup and mechanics. If your Bible spells out stat limits, like a maximum per stat or a pool of points to spend, character creation enforces those as well. Constraints clarify. They make the AI's improvisation tighter, because it has fewer easy outs. That's why the World Builder Wizard asks you for exactly one: "Name one hard rule of this world the game master must respect."

The most powerful constraint is usually a "no". A "no resurrection" rule means deaths matter. A "no gunpowder" rule gives battles a particular shape. With "no telepathy", news travels at the speed of horses. And a "no writing" rule turns every oath into a matter of witnesses and memory. Each one ripples outward into interesting consequences in play. What's the "no" at the heart of your world?

## Section 6: Opening Scenario

Describe the first scene in two or three sentences. Where is the player character? What's happening right now? What's the first decision they have to make?

*Example: "You're a junior aide in the Imperial Chancery on the night the Emperor dies. The chamber is in chaos. A high-ranking official has just handed you a sealed letter and asked you to deliver it to the Archduke of the Northern Reach, without telling anyone. You don't know what's in the letter, but you can see the official is sweating, and a guard captain is pushing through the crowd toward you."*

The opening should drop the player into immediate, mid-stakes action with a specific choice. It shouldn't begin with "you wake up in a tavern". Anything-but-a-tavern is a handy rule of thumb. Storytellers have known this for a couple of thousand years: Horace praised the "immediate interest" of starting [in medias res](https://www.britannica.com/art/in-medias-res-literature), in the middle of things, instead of *ab ovo*, from the egg. I took the same advice for EchoQuest. Since October, the GM opens every new game cold, already mid-moment, and the Wizard asks you to describe your opening scene in just one or two sentences for exactly that reason.

## Section 7 (Optional): Pronunciation Notes

If your world has invented names with non-obvious pronunciations, list them with a phonetic guide. "Aeryndel: pronounced AIR-in-del. Tovaryn: TOH-vah-rin. The capital, Khel-im-Karras: KEHL-im-CAR-ras." Notes like these help the GM keep its narration consistent, and they help any human who reads your Bible.

Here's an honest caveat, though, from someone whose game is spoken aloud from start to finish. A speech engine reads the letters it's given. There's a whole W3C standard, the [Pronunciation Lexicon Specification](https://www.w3.org/TR/pronunciation-lexicon/), that exists purely to tell speech engines how to say tricky words, which tells you how often they guess wrong. EchoQuest doesn't use pronunciation dictionaries, so the most dependable fix is a spelling that says itself. If "Aeryndel" keeps coming out mangled, ask yourself whether "Airindel" would serve your world just as well. Then listen to your names in play, with the browser voice and, if you have it, a premium voice too.

## Uploading Your Bible

EchoQuest accepts Game Bibles as PDF, DOCX, plain text, Markdown or JSON files, up to 10 MB each. Claude reads your document (it takes about fifteen seconds, and the page announces each stage as it goes, which screen reader users will appreciate), pulls out the world data and builds a playable campaign from it. That includes locations and NPCs, factions and campaign hooks, important items, and any classes, backgrounds or stat rules you defined. Plain text or Markdown is the safest bet, since there's no layout to untangle, although a well-formatted PDF works fine too.

Once it's built, you can jump straight in with "Play Your World Now". Then pay attention to the world's synopsis, the short summary Claude writes to introduce it. That's a quick test of what Claude took from your document. If it sounds vague, your Bible probably is too, so tighten the weak section and upload again. On the Storyteller plan you get one private world, so delete the old version from My Worlds before re-uploading. The Creator plan lifts that limit and lets you publish finished worlds to the [library](/library), where other players can find them.

Storyteller plan and above includes Bible upload access. **[See plans →](/)**
`,
  },
  {
    daysFromNow: 11,
    title: "Accessibility in Gaming: The State of Play in 2026",
    excerpt: "Where gaming accessibility stands in 2026: what studios fixed, where blind and low-vision players still get shut out, and why I built EchoQuest audio-first.",
    content: `# Accessibility in Gaming: The State of Play in 2026

Ten years ago, getting a mainstream game to talk to a screen reader usually meant hunting down a volunteer modder. Fans built text-injectors and screen-reader patches, plus mouse-replacement utilities held together with duct tape. Now the big studios publish accessibility trailers and hire leads whose entire job is this stuff. Some even give it a dedicated QA stream. The progress is real. So are the gaps. What follows is my honest read on the industry in 2026: what has genuinely been solved, and where players who don't see a screen the way most people do are still being left behind.

I'm writing from a slightly unusual seat. I built EchoQuest, an audio-first AI RPG where a Game Master narrates every scene aloud, and blind and low-vision players are the people I design for first. I hold my own game to the standards I'd use on anybody else's, and I'll admit it hasn't always met them. So this isn't an attack on the industry. Plenty of the largest studios have made sincere, remarkable progress. It's no victory lap, though.

## What's Improved

**Subtitle and caption standards** have climbed a long way. Most major releases now label who's talking and describe the important non-speech sounds, instead of pasting a bare dialogue transcript on screen. Some go further and tell you which direction a sound is coming from. In other words, captions grew from "the script, on screen" into a genuine second channel of information. The 2020s also turned customisable subtitle styling into a baseline expectation rather than a bonus. Changing the size and the background is normal now, and decent contrast and font options usually come along for the ride.

**Colorblind modes** show up in nearly every AAA title. Separate profiles for the common types of colour blindness (deuteranopia, protanopia and tritanopia) are standard, and many studios add custom colour swaps and high-contrast modes for low-vision players on top. Remember the red-versus-green health bars in competitive shooters? That problem defined a whole generation of accessibility complaints, and it's largely gone.

**Controller remapping** is simply expected now. Players with motor disabilities can map any button to any input and adjust timing windows. Many play with single-switch or eye-tracking setups. Hardware moved forward as well, and in lasting ways. Microsoft [announced the Xbox Adaptive Controller in May 2018](https://blogs.windows.com/windowsexperience/2018/05/16/announcing-the-xbox-adaptive-controller-for-accessible-gaming/), and Sony's [Access controller for PS5 launched worldwide on December 6, 2023](https://blog.playstation.com/2023/07/13/access-controller-for-ps5-launches-globally-on-december-6/) with four 3.5mm ports for plugging in third-party switches and accessories. Console-level support for switch input matters a lot here. Even games without first-class accessibility settings often become playable through remapping at the system level.

**Cognitive accessibility options**, like simplified interfaces and difficulty presets, have spread widely, and objective markers that nudge you onward are now common. The landmark is still *The Last of Us Part II*. Before launch, Naughty Dog laid out [more than 60 accessibility settings on the PlayStation Blog](https://blog.playstation.com/2020/06/09/the-last-of-us-part-ii-accessibility-features-detailed/), spanning vision, hearing, motor and cognitive needs. That list included text-to-speech for on-screen text and extra audio cues for traversal and combat. Then *Forza Motorsport* went somewhere I never expected a racing sim to go. Its [Blind Driving Assists](https://news.xbox.com/en-us/2023/04/27/forza-motorsport-accessibility-features-blind-driving/) are supplemental audio cues that tell low- and no-vision players where they sit on the track and how they're getting through each turn, and Turn 10 built them with direct feedback from blind accessibility consultant Brandon Cole. *Hogwarts Legacy*, for its part, shipped a high-contrast gameplay mode that paints important characters and objects in vivid colour. Pattern by pattern, the AAA market has built up a real practice.

**Industry awareness** has shifted too. Accessibility conferences are fixtures on the calendar now, and major publishers pay outside consultants to review their games. The UK charity SpecialEffect, which has spent years helping physically disabled people play, also advises studios and even put together a [DevKit that teaches developers about motor accessibility](https://www.gamedeveloper.com/design/uk-charity-creates-devkit-to-teach-game-devs-about-motor-accessibility). There's a shared vocabulary as well. Words like "co-design" and "lived experience leads" barely existed in studio meetings a decade ago.

## Where Significant Gaps Remain

**Blind and low-vision players** are still badly underserved. Visual UI and map navigation lock them out, and so do inventory screens and most combat systems. Screen reader support is rare, and when it exists it's often broken, with buttons that do nothing and menus that read in a scrambled order. Worse, status changes often happen without a word. The share of mainstream games a totally blind player can finish from start to end, unaided, is tiny. And that isn't because the design is impossible. It's because audio-first design has never been treated as a commercial priority.

The exceptions prove the rule. *A Hero's Call* and *Frequency Missing*, along with a handful of others, show that fully audio gameplay works and can hit hard emotionally. My favourite example is [*The Vale: Shadow of the Crown*](https://en.wikipedia.org/wiki/The_Vale:_Shadow_of_the_Crown) from Falling Squirrel, released in 2021. You play Alexandra, a blind princess stuck at a remote keep just as war breaks out, and the game is built almost entirely from sound. None of these titles had a AAA budget behind them.

**Audio description**, meaning spoken descriptions of cutscenes and visual story moments, is almost absent from games. Film and TV built it into their workflows decades ago, and regulators keep pushing it further. In the US, the FCC's [2023 order](https://docs.fcc.gov/public/attachments/DOC-397321A1.pdf) phases audio description rules into ten more TV markets every year until all 210 are covered in 2035. Games, meanwhile, still treat it as an afterthought. So a blind player who reaches the cinematic ending of a forty-hour story often gets the dialogue and nothing else, with no clue what's happening on screen. How is that still acceptable in 2026?

**Accessible documentation** is scarce. Tutorials and strategy guides seldom arrive in formats a screen reader can handle, and fan wikis are worse, with dense visual layouts that screen readers trip over. YouTube guides assume you can see. Even official documentation leans on annotated screenshots. Here's the odd part: a blind player trying to look up how to beat a boss often has fewer resources today than in 1995, when plain-text GameFAQs walkthroughs were the norm.

**Small and indie studios** don't have the budgets the giants poured into accessibility tooling and testing, and the gap between AAA and indie is enormous and still growing. An accessibility lead and outside consultants cost real money, and so does a dedicated QA pass. Most indie teams know this matters and feel terrible that they can't afford to do it well. I understand that feeling. The missing piece is free accessibility tooling that drops easily into common engines, and that's a structural hole the industry still hasn't filled.

**Multiplayer accessibility** trails single-player by years. Voice chat without transcription keeps disabled players out of competitive scenes, and so do twitch reaction windows with no configurable assists. Visual-only callouts make it worse. Some games have improved here (Microsoft's automatic chat transcription is a genuine step), but the picture is patchy.

## Why EchoQuest Takes a Different Approach

Instead of retrofitting accessibility onto a visual system, EchoQuest starts from the other end. Everything is audio and text first. Images and interface design sit on top of a game that already works without them. I don't have a "blind mode." I have one mode, designed from the ground up to work for sighted and blind players alike.

And that decision reaches right down into the architecture. A screen reader going through EchoQuest's HTML gets clean, meaningful labels, because I wrote them with screen readers in mind from day one. Keyboard users get a logical tab order, since the layout was planned for keyboard traversal first and arranged visually second. Every action has a key, too: Space or P pauses the narration, R replays it, the number keys pick a choice and L tells you where you are. Voice players get commands that map to real game actions, because I picked verbs that are easy to say out loud. The audio description "problem" never comes up at all, because the narration describes every scene by default. The visual layer never displaced audio as the source of truth.

Am I done? Not even close, and I'd rather talk about the bugs I ship by accident, because hiding them helps nobody. Back in May I found that choices were being announced and focused while the narrator was still talking, so screen reader users heard two voices at once. Now the choices wait until the narration ends. That same month I added screen reader announcements for HP and inventory changes, which honestly should have been there from the start. Then in late September I discovered the microphone was blocked on EchoQuest's own pages, so voice input quietly didn't work until I fixed it.

I think the best thing I can do for accessible gaming at large is prove that audio-first design can pay its own way and still be creatively rich. Then the industry might see it as an investment instead of charity. Audio-first isn't a downgrade. It's a different way to experience a story, and in many ways a more immersive one. I want to make that case loudly enough to shift the conversation.

## What You Can Do

If you're a player who cares about accessibility, the most useful move is to spend your money with studios that take it seriously. Buy from publishers who put out accessibility trailers. Write reviews that name the specific features that worked or failed you. And tell developers when something locks you out, because many of them genuinely don't know.

If you're a developer, the cheapest first step is to play your own game with a screen reader for an hour. Just one hour. It'll hand you enough findings to keep you busy for a month. After that, talk to disabled players directly. The disability advocacy community in games is generous and well organised, and its feedback transforms products. So what would you find if you tried it tonight?

**[Try EchoQuest free: no account needed for your first session →](/library)**
`,
  },
  {
    daysFromNow: 12,
    title: "How Ambient Sound Design Elevates RPG Storytelling",
    excerpt: "Why background sound makes RPG scenes feel real: the research on audio and presence, the layers of a good soundscape, and how EchoQuest builds its own.",
    content: `# How Ambient Sound Design Elevates RPG Storytelling

Close your eyes for a second and put yourself in a stone dungeon corridor. Now add the slow drip of water bouncing off the walls and, somewhere far off, the scrape of something moving. Throw in a faint whiff of torch smoke. You're there already, aren't you? Now strip all that away and keep only the sentence "you walk down a dungeon corridor." Same words, yet the place has gone flat. That's the job ambient sound does. It closes the gap between being told about a place and actually standing in it.

In an audio-first game like EchoQuest, ambient sound isn't decoration. It's a primary information channel, second only to the narration in how much of the world it carries. When the soundscape is right, players stop hearing it and start hearing through it. Think of rain. Ten minutes after it starts you no longer notice it, but everything you do afterwards is shaped by the fact that it's still coming down. So let me walk you through how ambient sound design works and which layers make a good soundscape. Then I'll show you how EchoQuest stitches those layers together live as your story unfolds.

## The Neuroscience of Audio Immersion

Researchers who study presence (that feeling of "being there") keep finding that sound pulls a lot of weight. Back in 1996, Claudia Hendrix and Woodrow Barfield found that [adding spatialized sound to a virtual environment significantly increased people's sense of presence](https://experts.umn.edu/en/publications/the-sense-of-presence-within-auditory-virtual-environments/). A much newer study by Angelika Kern and Wolfgang Ellermeier went further and tested a background soundscape on its own. Their [2020 experiments in Frontiers in Robotics and AI](https://pmc.ncbi.nlm.nih.gov/articles/PMC7805954/) showed that the soundscape raised both presence and perceived realism, and, interestingly, it was the ambience alone that increased involvement and reduced distraction. When your ears get information that fits "underground stone corridor," your threat assessment and spatial reasoning shift to match, and so does your mood. Even your posture changes, with or without a picture on the screen. The brain uses sound as a map, and it can't really switch that mapping off.

That's why a horror film's soundtrack can scare you without a single jump-scare image. Biologist Daniel Blumstein and his colleagues looked at this and found that [horror soundtracks contain more noisy, scream-like sounds](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein_etal_2010_BiolLett.pdf) than you'd expect by chance, echoing the harsh, broken calls animals make when they're in distress. It's also why ASMR works at all, and why guided meditation lands better with the right environmental track underneath. We're auditory creatures whose eyes just happen to hog our conscious attention. Take vision out of the picture and the ear is still a sophisticated instrument, one that has spent hundreds of thousands of years keeping us alive in three-dimensional space.

For blind and visually impaired players, this goes beyond immersion. It's orientation. Ambient sound tells you where you are and what kind of space surrounds you, with a precision that text alone struggles to match. A narrow corridor sounds different from a vast chamber, because the reverb gives it away. A riverbank sounds different from deep forest, too, since the whole tonal colour shifts. And the brain takes this seriously. When Lore Thaler's team scanned blind echolocation experts, they found that [processing click-echoes recruited brain regions usually devoted to vision](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0020162), and that echoes can carry the position, distance, size, shape and texture of objects. So when the sound design does its job, a player listening alone can place themselves in a fictional room with surprising accuracy.

Sighted players feel the effect too, more subtly. Ambient sound is the difference between reading a scene and being inside it. I'm convinced of it: the same narration with the bed muted reads like a script, and with the bed on it feels like a place.

## How EchoQuest's Soundscapes Work

Every location in an EchoQuest world can carry an ambient tag. Today there are seventeen beds, including tavern, dungeon, cave, ocean, market and throne room, plus world-flavoured ones such as desert, cyberpunk rain, space station and cosmic void. Back in May I added forge, storm and underwater, because I decided a smithy or a sunken wreck deserved its own sound instead of a borrowed one. When the AI Game Master moves you somewhere new, the old bed fades out over about a second, and the new one fades in over a second and a half. That blend is deliberate. A hard cut feels jarring, whereas a slow handover mirrors the way your ear adjusts when you walk into a different space.

Here's the plumbing, if you're curious. Each GM reply comes back as structured data, and when you change places it includes the ID of your new location. The client looks up that location's ambient tag and starts the matching loop, with no button press from you. If a location has no tag, EchoQuest guesses one from its name and description ("smithy" or "anvil" points to the forge, "crypt" points to the dungeon). It can also read the narration itself, although I made that part sticky on purpose. A new bed has to beat the current one clearly before it takes over, so a forest scene that briefly mentions "the tavern's owner" doesn't suddenly fill your ears with clinking mugs. In practice, you type something like "I push through the heavy doors into the courtyard," and the hall fades down as the open air fades up. You never told the game to change the sound. It noticed the location change and updated the world.

Tabletop GMs have always wanted this kind of continuity for their tables. A few devoted ones run laptops stuffed with sound effect playlists, frantically clicking between tracks whenever the scene shifts. EchoQuest does it automatically, and the AI itself decides which scene you're in.

## The Layers of a Good Soundscape

Good ambient sound is rarely one loop. Usually it has three layers:

**Base layer:** The constant environmental drone, such as rain, wind, cave echo, crowd murmur or the low rumble of a working harbour. It runs nonstop and defines the space. Your ear adapts to it and stops consciously noticing it within half a minute, yet it's doing the most work to keep the scene anchored. Pull it out and the room goes flat at once.

**Mid layer:** Periodic sounds that turn up every few seconds, like a fire popping, distant church bells, an owl calling, a dog barking down the street or a glass clinking in a tavern. These keep the base from going stale and add the rhythm of "things happening" that makes a place feel lived in. The mid layer is also where a world's identity lives. A medieval European village has different mid-layer textures from a desert oasis, and the same handful of sounds spaced differently can change a scene's whole emotional register.

**Event layer:** Triggered sounds tied to specific story moments, like a door swinging open or a crowd falling suddenly quiet. A sword clearing its scabbard belongs here too. These are the goosebump sounds. Event sounds feel dramatic precisely because they break the established pattern. It's the moment the soundscape stops being background and turns into action.

In EchoQuest the base and mid layers run on their own. Every bed is synthesized live in your browser rather than played from a recording, and several of them scatter extra sounds at random intervals: bubbles drifting up in the underwater bed, or a stray ping every so often on the space station. The event layer belongs to the GM. With each reply it can pick one sound cue, things like a door opening, a locked door, a spell being cast, danger closing in or treasure being found. Each cue gets a tiny random pitch shift so it never sounds copy-pasted. I keep growing the cue catalogue based on the moments the GM most often wants to punctuate.

I also learned the hard way that cues need manners. Early on, the soundtrack sat right on top of them, so now the bed ducks underneath each cue for a fraction of a second. And when the same cue fired twice within 80 milliseconds, it just sounded like a glitch, so those duplicates get dropped.

## The Power of Silence

Silence is the most underused tool in soundscape design. If a scene has carried a rich ambient texture for ten minutes and then drops to nothing for a single beat, that beat lands harder than any scream. Silence focuses attention. It tells the listener that something just changed and whatever comes next deserves their full attention. There's even neuroscience behind it. A Stanford team led by Devarajan Sridharan and Vinod Menon played symphonies to 18 volunteers and found that [peak brain activity came during the short silences between movements](https://med.stanford.edu/news/all-news/2007/07/music-moves-brain-to-pay-attention-stanford-study-finds.html), when seemingly nothing was happening. Used sparingly, silence is the most dramatic transition audio storytelling has.

I'll be straight with you: EchoQuest doesn't have a dedicated "silence" cue yet. Where silence shows up today is in the storytelling. The horror tone I give the GM literally includes the instruction "Let silence speak," and every scene is meant to stop on its hook instead of padding past it. Ironically, the first silence I shipped was the wrong kind. On May 16 I noticed the ambient bed was quietly ratcheting itself down to nothing after about five turns, because two bits of code were fighting over the same volume control. Nobody wants that sort of dramatic pause, so I split them apart. Later that month I found the bed was silent on phones altogether, because mobile browsers hold audio back until your first tap. That one's fixed too.

## Volume Control

Ambient sound can drown out narration if it's too loud. That's a real problem for players using hearing aids, which process sound differently, and for anyone on a device with a narrow dynamic range. So EchoQuest lets you set ambient volume separately from the narration, or switch ambient sound off entirely without touching the voice. Ducking is built in as well. While the GM is speaking, the bed automatically drops to under half its level, then comes back once the line ends. Sound cues have their own on and off switch, too. And because a plain linear slider feels lopsided to human ears, the main volume control follows a squared curve, so the halfway point actually sounds like halfway.

You'll find the ambient toggle and its slider in Settings → Voice, and again in the in-game audio controls. Does something sound off, maybe too loud or too quiet, or simply wrong for the scene? Tell me. The soundscape catalogue is something I keep expanding, and player feedback is how I decide what comes next. **[Play your first session →](/library)**
`,
  },
  {
    daysFromNow: 13,
    title: "From Tabletop to AI: How EchoQuest Reimagines D&D",
    excerpt: "What EchoQuest borrows from fifty years of D&D, the tabletop problems an AI Game Master can fix, and the moments only a human GM can still deliver.",
    content: `# From Tabletop to AI: How EchoQuest Reimagines D&D

Dungeons & Dragons turned fifty in 2024. Over that half-century it more or less defined what a role-playing game is: a human Game Master, a set of rules, a handful of dice and a table full of players deciding what their characters do. The beginnings were modest. The [original 1974 set](https://en.wikipedia.org/wiki/Dungeons_%26_Dragons_(1974)) was three digest-sized booklets in a brown wood-grain box, produced on a budget of about $2,000 for a thousand copies. Wizards of the Coast likes to say it all began ["out of a small cobbler's home in Lake Geneva, Wisconsin"](https://www.prnewswire.com/news-releases/dungeons--dragons-celebrates-50th-anniversary-in-2024-with-more-than-50-million-fans-302059661.html) (Gary Gygax was working as a cobbler back then), and by the anniversary the same announcement counted more than 50 million fans. Along the way D&D turned into a mainstream reference point in films and TV, and it lit the fuse for a whole industry of tabletop and video games, audio games included. That formula, one Game Master narrating a world while the players build the story together, proved so gripping that it spawned everything after it. EchoQuest included.

EchoQuest sits squarely in that tradition. I don't see it as competing with tabletop D&D. I see it as the latest answer to a question D&D players have been asking for decades: *can we have this experience without herding five busy adults into a room every Wednesday night?* Below, I'll go through what tabletop nailed and what it never managed to fix. Then I'll get into where EchoQuest's AI Game Master follows the form and where it breaks away.

## What D&D Got Right

**The open action system.** In D&D you can try anything, and the GM rules on it. There's no menu of options or locked skill tree, and there's no list of approved verbs either. If you can describe an action, you can attempt it. Want to climb the chandelier and drop onto the orc? Roll for it. The same goes for bribing the captain of the guard with a story that's only half true, or composing a song to soothe an angry mob. That freedom is what makes tabletop feel alive next to video games with fixed option sets. It's the difference between a story you're telling and a story you're merely being walked through.

**The collaborative story.** The best D&D sessions are co-authored. The GM sets up the world and reacts to the players. They, in turn, do things nobody saw coming, and the GM adapts. The story becomes something nobody planned, and those surprises are the best parts. A great GM doesn't carry a script; they carry a world and a willingness to follow wherever the players take it. A great player doesn't try to read the GM's mind; they take risks the GM has to honour. Honestly, that back-and-forth is the single most addictive thing about tabletop, and no single-player video game has quite managed to copy it.

**The persistent character.** Your character grows over time. They gain abilities and form relationships, and they carry the weight of earlier choices. The hero in the final session isn't the one who walked into the first. Their scars count, and so do their friendships and their reputation. All that accumulated history is why the emotional highs hit so hard: by the time something matters to your character, you've spent dozens of hours getting attached to them.

EchoQuest keeps all three. The action system is fully open, so you can type or speak any action, however odd, and the AI GM will rule on it. When something risky is at stake, it calls for a d20 roll plus your modifier, and since an update in early October the check resolves in the same turn instead of making you wait. The story is genuinely collaborative, too, because the GM improvises in response to your actual choices instead of walking down a tree someone wrote in advance. And your character persists. Each session picks up where the last one ended, with your inventory and quests intact, along with how every named NPC currently feels about you.

## What Tabletop Couldn't Solve

**Scheduling.** Getting five adults into the same room at the same time, every week, indefinitely, is really hard. I'd bet it's the number one reason D&D campaigns die. Session one is thrilling. By session twelve, two players have new jobs and one has a baby, and another is on a different continent for three months. The campaign quietly stops without anyone ever formally ending it. As CBR put it in [a piece on why there are always fewer DMs than players](https://www.cbr.com/dnd-more-players-than-dms/), "jobs, school, personal emergencies, or celebrations" will always collide with a weekly game. Online tools like Roll20 and Foundry help (Roll20 alone [passed 5 million users in March 2020](https://bloghub.roll20.net/posts/5-million-users-roll20-finds-critical-success/)), but they don't fix scheduling. They just make gathering slightly easier. EchoQuest, on the other hand, is there whenever you are. Got twenty minutes between meetings? Play. An hour before bed works too, and so does a long weekend. The campaign waits and carries on exactly where you left it. I cared about this enough that one of my early October changes moved character progress onto the server, so now you can pick the same adventure back up from a different device.

**The GM burden.** Running a good tabletop game takes an enormous amount of preparation. GMs write NPCs and build encounters, then improvise for hours on end. Between sessions they patch plot holes after the fact, design maps and stat custom monsters. At the table they also have to remember everyone's character details and referee rules disputes. CBR notes that sessions often run "three to four hours" a week, and the GM shoulders most of the prep on top of that. Most people who want to play don't want that load (or can't carry it), which is why so many groups live with a chronic GM shortage. There are usually five people keen to play and one who reluctantly volunteers to run things. EchoQuest's AI GM takes the whole job on, so you're free to just be a player.

**The social anxiety barrier.** Tabletop RPGs ask you to perform in front of people. You improvise dialogue and make decisions out loud, sometimes voicing characters nothing like yourself, all while your peers watch. For many players that's exciting and a core part of the appeal. For plenty of others, though, it's a wall that keeps them out of a hobby they'd otherwise love. That's especially true for introverts and neurodivergent players, for anxious people, and for anyone simply new to RPGs. EchoQuest is a private space. You can try the most outlandish character you never had the nerve to play at a table. Nobody's watching, and nobody's judging. Your only audience is the AI, and it will play along sincerely. If a move comes out wrong, the U key undoes your last turn. And when you speak a free-form action, EchoQuest tells you what it heard and gives you a few seconds to cancel before sending it. I added that because I decided a misheard sentence shouldn't get to steer your story.

**Accessibility.** As I've written elsewhere on this blog, tabletop RPGs are deeply visual. There are maps, character sheets and books, and then come dice, miniatures, battle grids and illustrated handouts. The hobby has a real and growing accessible-tabletop community. The nonprofit [DOTS RPG Project](https://www.dotsrpg.org/about), for example, designs braille dice and provides rulebooks and character sheets in braille. Even so, playing still takes substantial adaptation work. EchoQuest replaces all of it with audio and keyboard-accessible text. A blind player can play the same campaign as a sighted player, with no special accommodations and no second-class experience.

**Cost.** A real tabletop campaign means books and dice, often miniatures, frequently a paid subscription to an online tabletop tool, and sometimes a professional GM. You can spend hundreds of dollars before a single session has been played. EchoQuest's free tier, by contrast, gives you three full prebuilt campaigns and 60 AI turns a day, narrated by your browser's built-in voice, with voice commands and full keyboard access included.

## What's Different About AI as GM

A human GM makes judgment calls drawing on years of creative experience and a knack for reading the table. They also genuinely care about the story. An AI GM makes judgment calls based on its training and a carefully designed system prompt. EchoQuest's GM runs on Anthropic's Claude, and in early October I rewrote its instructions so it talks like a seasoned human Game Master at a kitchen table instead of a polite assistant. Still, those two things aren't the same, and pretending they were would be insulting to human GMs and to honest software design alike.

The AI doesn't get tired. It doesn't play favourites. It doesn't railroad you toward a story arc it happens to prefer; its instructions literally tell it to follow your creativity instead of forcing you back onto a path. It doesn't have bad nights. It'll improvise patiently for hours without any of the "are we wrapping up soon?" body language a human GM starts giving off around hour four. Want to spend twenty minutes deciding what to say to a single NPC? The AI will wait. Feel like playing at three in the morning? It's there.

However, the AI lacks the spark of genuine human creativity. It won't land the unexpected callback to a joke from session two, or turn a player's slip of the tongue into ten minutes of the whole table laughing together. Nor will it get misty-eyed when its longest-running player finally lets a character grieve. AI GMs in 2026 are remarkably good at sustained, consistent, atmospheric narration. They can't yet produce the very best moments a great human GM can, and I'd rather say that plainly.

What an AI GM does uniquely well is *availability*. Great human GMs are rare and busy. A good AI GM is always around. For a player who wants regular RPG sessions and can't reliably gather a tabletop group, that availability is the difference between playing and not playing at all.

## The Hybrid Future

I don't think EchoQuest should replace your table. It works best sitting next to one. You might run a Wednesday-night D&D group with friends and a Saturday-morning solo EchoQuest campaign with a different character, for instance. The two scratch different itches. Tabletop gives you the social joy of co-creating with people you love. EchoQuest gives you the solo pleasure of a story that moves at exactly your rhythm, exactly when you want it.

So EchoQuest isn't a substitute for a great human GM and a great group. It's something different: a solo or intimate experience, available any time, that captures enough of what makes tabletop magical to bring real joy. If you've never managed to find a group, this could be your way in. And if you've had one for years, it might keep you playing during the weeks your table can't meet. Which camp are you in?

**[Start your first adventure →](/library)**
`,
  },
  {
    daysFromNow: 14,
    title: "Writing Compelling NPCs: 7 Techniques That Work",
    excerpt: "Seven practical techniques for writing NPCs players remember, from a specific want to a line they won't cross, with a full Game Bible example to copy.",
    content: `# Writing Compelling NPCs: 7 Techniques That Work

NPCs are the human heartbeat of any RPG world. They're the people your players talk to, trust, fight, fall for, betray and mourn. A flat NPC is a vending machine. It dispenses information and then vanishes from memory, and you couldn't tell it apart from the next one if you tried. The novelist E. M. Forster had a name for this back in the 1920s. Flat characters, he wrote, are ["constructed round a single idea or quality,"](https://kenyonreview.org/2018/08/in-defense-of-flat-characters/) and only round ones are capable of surprising us in a convincing way. A real NPC, on the other hand, changes how players feel about the world they're in, sometimes for an entire campaign and sometimes for years afterwards. Veteran tabletop players still bring up the bartender they met in session two of some long-dead campaign. That character had three lines of dialogue and a very particular limp. That's the bar.

The seven techniques below are the patterns that keep turning up in NPCs people actually remember. They work for human GMs at a physical table. I'd argue they work even better as Game Bible entries an AI GM leans on across many sessions, because an AI's real strength is consistency, and characters built on these patterns are easy to keep consistent. Use them as a checklist when you write your roster. If an NPC ticks all seven boxes, they'll be unforgettable. If they tick one or two, you've built a vending machine.

## 1. Give Them One Specific Want

Skip the vague motivation and go for a specific, current desire. Not "she wants power," but "she wants a seat on the city council before her rival gets one, and she has three weeks." Kurt Vonnegut used to tell his writing students that ["every character should want something, even if it is only a glass of water,"](https://lithub.com/kurt-vonneguts-greatest-writing-advice/) and he was right about NPCs too. Specificity creates urgency. Urgency creates drama. That three-week window gives the GM something to escalate against, and it gives the player a reason to make decisions that ripple beyond their own goals.

The want should be something the player could plausibly help with, or get in the way of. "She wants to reach enlightenment over the next forty years" is a perfectly fine human desire and a useless NPC desire. "She wants to find her sister, who vanished into the eastern provinces last winter," on the other hand, is something a single session can push forward.

## 2. Give Them One Thing They Won't Do

Every character has a line they won't cross. That line defines who they really are, more accurately than their stated values or their public reputation. A mercenary who'll take any job except killing children is more interesting than one with no limits at all. The same is true of a scholar who'll lie about anything except what a primary source actually says. The line is what creates the dilemma, because sooner or later the players will land in a situation where getting what the NPC wants means crossing it. That's where character shows itself.

The line also gives the NPC a clean way to refuse. When the NPC says "I won't help you with this," the player knows they're dealing with a person, not a stat block.

## 3. Let Them Want Something From the Players Specifically

The most engaging NPCs aren't neutral. They want something from *these* characters, for *this* reason, that they wouldn't want from any random adventurers who wandered in. The blacksmith doesn't just sell weapons. She's been watching the party, and she wants to hire them for a job she's too scared to do herself, because the way they treated her apprentice yesterday told her they're the right people. Interest runs both ways.

Honestly, this one technique fixes more bad RPG dialogue than any other. NPCs who are interested in the players become interesting to the players. Meanwhile, NPCs who treat the party as one more group passing through fade into the wallpaper, however cleverly they're written.

## 4. Give Them a Physical Habit or Mannerism

Pick one specific, repeatable behaviour that the AI GM (or you, at the table) can bring out again and again. Not "she's nervous," but "she always straightens the objects on a table while she's thinking." Not "he's intimidating," but "he stops talking mid-sentence whenever someone walks into the room." The mannerism becomes a signal that players learn to read. When she starts squaring up the cutlery during a negotiation, they'll sit up. When he goes quiet, they'll know someone just came in.

The trick is to choose mannerisms that can be seen, or at least described, in narration. Internal moods are hard for an AI to render consistently, whereas physical habits are easy. Mike Shea at Sly Flourish has a shortcut I like here: [borrow an archetype from a film or TV character you love](https://slyflourish.com/method_npcs.html) and you get a ready-made set of mannerisms and a voice. (He also suggests giving every NPC a name that starts with a different letter, so players can keep them straight. It's a small thing, and it really helps when people are listening instead of reading.) Either way, the mannerism becomes the character's signature, and the AI can use it confidently in every scene.

## 5. Make Them Competent at Something Unrelated to Their Role

The innkeeper is also a retired sailor who can navigate by the stars, and the wizard's apprentice turns out to be a remarkably gifted liar. My personal favourite is the gruff guard captain who writes poetry on his evenings off. Competence in an unexpected area makes a character feel three-dimensional, because now they exist beyond their job title. It also hands the GM a useful tool. When the players need help with something the obvious NPC can't handle, the surprising one can step in.

That unrelated skill has to be specific enough to actually use. The D&D basic rules make the same point about player characters: ["I'm smart" is a weak trait because it describes a lot of characters](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/personality-and-background), whereas "I've read every book in Candlekeep" tells you something real. So "she's good with horses" is generic. "She can name the breed of any horse from its hoof print" is something you can build a whole scene around.

## 6. Let Them Be Partly Wrong

Characters who are right about everything are boring. Worse, GMs tend to use them as exposition delivery vehicles, and players learn to distrust anyone who's suspiciously confident. So give your NPCs a mistaken belief they hold with total confidence. It shouldn't be a flaw that makes them unlikeable, just one specific thing they've got wrong that will matter eventually. Maybe the mentor misreads what the enemy actually wants, or an ally trusts exactly the wrong person. Or the shopkeeper is certain a regular customer is innocent of a crime that customer absolutely committed.

Real people are wrong about things. They hold those wrong beliefs alongside plenty of right ones, and the wrongness rarely turns them into villains. NPCs should work the same way. When the players finally uncover the mistake, the NPC's reaction (denial, embarrassment, recalibration or doubling down) turns into a character-defining moment.

## 7. Let Them Change

The NPCs players meet at the start of a campaign shouldn't be the exact same people by the end, at least not if the players have genuinely dealt with them. An NPC who trusted the party and got betrayed should grow more guarded, and one who saw the party act heroically should grow more hopeful. And if someone was forced into a hard choice in a scene with the party, they should carry its weight into every later appearance. Change is what separates a character from a fixture.

Of all seven, this is the hardest to enforce at a tabletop and the easiest to enforce with an AI GM, because the game can keep a structured record of what you've done to whom. In EchoQuest, every named NPC carries a standing toward you on a scale from -100 (sworn enemy) to +100 (loyal ally). The GM adjusts it whenever you meaningfully help, harm, persuade or offend someone, and it jots a short note explaining why. Those standings get handed back to the GM on every turn, so it can't quietly forget that you robbed the ferryman. By your tenth session, the people you've treated well should treat you very differently from the ones you've wronged. The world remembers.

I learned how much the little mechanics matter here, too. In late May I noticed NPCs weren't switching to their own voices at all. The cause was that their dialogue wasn't woven into the narration, so the audio engine just read every line in the narrator's voice and the whole cast collapsed into one person. Now every spoken line is tagged with the speaker's name, and on the premium voice tier each NPC gets a gender-matched voice that sticks with them from session to session. Then, in early October, I rewrote the GM's instructions so NPCs talk in the first person with their own rhythm and grudges. They hold strong opinions and say them plainly. They also dodge questions and lie when it suits them. All seven techniques get easier to land once the character literally sounds like somebody.

## A Worked Example

Here's a Game Bible entry that uses all seven:

> **Sera Volant**: A retired city guardswoman in her mid-fifties who runs a stew kitchen near the river docks. (1) **Wants:** to track down the bandit captain who killed her old patrol partner two years ago; she's been quietly questioning travellers ever since. (2) **Won't:** turn anyone over to the current city watch, who covered up the original killing. (3) **Wants from the party:** they look like people who can travel out of the city, and she wants information about one particular roadside inn. (4) **Mannerism:** drums her fingers on the counter when she's listening to a lie. (5) **Unexpected competence:** keeps a bee garden on the roof; her honey is the best in the district, and she barters it for information. (6) **Wrong about:** she believes her old captain was clean; he wasn't. (7) **Will change:** if the party brings her real information about the bandit, she'll start to relax for the first time in two years.

That's one NPC who could carry a campaign on her own. Wouldn't you want to sit at her counter?

In EchoQuest, the AI Game Master builds its NPCs from your Game Bible. When you upload one (PDF, DOCX, TXT, MD and JSON all work), each named character is distilled into a role, a short personality sketch and a note on how they speak. So dense, specific sentences like Sera's survive that trip far better than pages of loose backstory, and the more concrete your descriptions are, the more consistently the AI can hold onto them across dozens of sessions. One more tip: don't write an NPC for every villager. Pick the dozen or so who matter and give each of them all seven. If you'd like a template to start from, my guide on [how to write a Game Bible](/blog/how-to-write-a-game-bible-the-world-builders-template) walks through the whole structure. A private world of your own comes with the Storyteller plan. **[Build your world →](/)**
`,
  },
  {
    daysFromNow: 15,
    title: "The Power of Choice: How Branching Narratives Work in AI RPGs",
    excerpt: "How branching stories work, from Choose Your Own Adventure books to AI Game Masters, and an honest look at where AI choice still falls short.",
    content: `# The Power of Choice: How Branching Narratives Work in AI RPGs

Choice is what separates a game from a book. When you choose, you create. And when your choice genuinely changes what happens next, you're invested in a way no passive story can match. The whole appeal of role-playing games rests on one lopsided fact: in a book you witness, and in an RPG you decide. I'm convinced that's why an hour spent steering a story sticks in the memory so much longer than an hour watching a film. You were doing something the whole time.

There's research pointing the same way. In a set of studies on why video games pull us in, a team led by psychologist Richard Ryan found that [perceived in-game autonomy and competence go hand in hand with how much people enjoy a game](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf). Autonomy, in plain English, is the feeling that your choices are really yours.

Building choice has always been a headache for game makers, though. You could tell much of the history of game design as the story of designers trying to give players meaningful choice without writing a separate game for every decision. Each era's answer hit its own ceiling. Below, I'll walk through the old models and show how an AI Game Master pushes past those ceilings. I'll also be straight with you about the new limits that tag along for the ride.

## The Old Model: Choose Your Own Adventure

Traditional branching narratives, video game dialogue trees included, work by pre-writing every possible branch. The classic *Choose Your Own Adventure* paperbacks had you flip to page 47 or page 53 depending on a single decision, and they were a phenomenon: the series grew to [230 titles in more than 40 languages and sold over 250 million copies](https://www.publishersweekly.com/pw/by-topic/childrens/childrens-authors/article/64786-obituary-r-a-montgomery.html). *Mass Effect*'s celebrated dialogue wheel was the same idea with voice acting and 3D graphics. The maths is brutal, though. With five decision points and three options at each, you need 243 unique story paths to cover every combination (that's three multiplied by itself five times). Real games never write 243 paths. They write a few, then quietly funnel divergent decisions back to the same trunk a few scenes later.

The game writer Sam Kabo Ashwell has a name for that funnel. In his catalogue of choice-based structures he calls it "branch and bottleneck": [the game branches, but the branches regularly rejoin](https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/), usually around events common to every version of the story. It's a perfectly sensible design. It's also why so many choices end up feeling smaller than they looked.

The result is the illusion of choice: a handful of pre-written responses dressed up as a vast decision space. Players learn fast that most choices don't matter, and the few that do lead to the same small set of outcomes. Savvy players start gaming the system, picking dialogue options because they're chasing the "good" ending rather than because the line fits their character. At that point the story stops being a story. It becomes a flowchart with prose attached.

There were heroic attempts to break out. Tabletop RPGs solved branching by putting a human GM in charge of improvisation, so the GM became the engine that turns endless player choices into fitting responses. Some video games (the Telltale and Quantic Dream catalogues spring to mind) leaned hard on "consequences will follow" framing, yet in my view they quietly hid the same trunk-and-funnel structure underneath. Quantic Dream's *Detroit: Become Human* even made the flowchart literal. At the end of each scene it [shows you a flowchart of the route you took](https://blog.playstation.com/archive/2018/04/23/7-things-youll-notice-in-your-first-30-minutes-of-detroit-become-human), along with the branches you could have taken. I find that rather charming, and refreshingly honest, because it shows you exactly where the walls are. All the same, the underlying problem of finite, hand-written content never went away.

## The AI Model: Responsive Generation

In EchoQuest, the AI Game Master doesn't pre-write branches. It reads your action, whatever you say or type, and generates the next story beat in response. The story gets built on the fly. It's constrained by your world's rules and the current context, but it's never picked from a list of ready-made options.

That means:

- **Any action is valid.** There's no "I don't understand that" for sensible in-world actions. If you can describe it, the GM can adjudicate it. Want to bribe the dragon? That's probably a charisma check, and a real d20 roll decides it. Want to teach the dragon a song? Same deal. And if you try something truly impossible, the GM is told to handle it in character ("The stone door doesn't give, however hard you shove") instead of throwing an error at you
- **Choices compound.** What you did in scene 3 can still be shaping scene 47, because the GM carries recent context and the structured game state records explicit decisions as story flags. I even wrote a line into the GM's instructions telling it to bring old threads back "when it hurts or helps the most"
- **Side paths are real.** If you'd rather investigate the merchant guild than follow the main quest, the GM follows you there and builds something out. The "main quest" is a direction the world leans in, not a rail. In fact, the GM's instructions say, word for word, to "follow the player's creativity instead of forcing them back onto a path". Stepping off the rail doesn't break the game
- **Failure produces story.** In a pre-written branching game, the only response to "you fail your check" is whatever the writer prepared. In an AI RPG, failure is a creative moment, because the GM improvises a consequence that fits your exact situation instead of a stock fail-state. I learned how much this matters in October. Until then, dropping to 0 HP in EchoQuest did, well, nothing at all. Now the GM sees that you're down and has to narrate a real setback, like being captured or waking up hours later with a price to pay

You still get suggested choices, mind you. Each scene ends with three to five of them, read aloud and mapped to the number keys, and one is always an open-ended option for doing something else entirely. The GM is told never to repeat a choice from the previous turn and to skip limp stoppers like "Wait and observe". They're only suggestions, though. Type anything you like, or press V and say it. Getting even this part right took some fiddling. On May 16 I realised the choices were being announced and focused while the narrator was still talking, so screen reader users heard two voices at once. Now the choices wait their turn.

## The Texture of Meaningful Choice

What makes a choice feel meaningful isn't only that it changes the plot. It's that it reveals character, namely yours. Sparing a villain says something about who you are. So does negotiating before fighting, or asking a bystander's name before they matter to the story, or tipping the ferryman more than he asked. Insisting on a slower, less efficient route through a city because you want to see it counts too. These choices don't change the plot dramatically, but they pile up into a portrait of who your character is.

Pre-written branching almost never honours them. Nobody has the development time to write a warm version and a sarcastic version of "I ask the bartender what his name is". There just isn't time. So pre-written games either leave such choices out or render them with the same canned text regardless of intent.

EchoQuest's GM is built to honour exactly this kind of choice. When you do something unexpected but true to your character, the GM responds in kind: NPCs remember, and situations reflect back what you've done. Under the hood, every named NPC carries a standing with you from -100 (sworn enemy) to +100 (loyal ally), and whenever it shifts, the GM jots down a note of fifteen words or fewer explaining why. "Convinced to let us pass" is the example in its instructions. So a character who's been polite to every shopkeeper in town will find the town treats them very differently from a character who's been brusque, even if both made the "same" major plot choices. The plot is identical. The story is not.

There are achievements for this style of play as well, such as one for resolving a hostile encounter without violence. Frankly, I like that they reward who you are rather than how hard you hit.

## What Choice Reveals About Story

Here's a pattern I think most long-time roleplayers will recognise. People start out making choices because they're trying to "win", or to find the canonical path. Then, gradually, they start choosing because the choice fits who their character is becoming. The game stops being a tree to optimise and turns into a person to inhabit. I'd bet that shift, when it happens, is the single biggest reason anyone sticks with an RPG for months.

The shift happens because the GM keeps honouring character-driven choices over plot-driven ones. Stay true to your character's flaws and the world responds. Betray your character's principles for a tactical edge and the world responds to that, too. There's no global "right answer" the AI is nudging you toward. There's just a world reacting to who you are. Isn't that what you secretly wanted from those paperbacks as a kid?

## The Limits of AI Choice

AI narrative isn't perfect, and I'd rather be honest about the gaps than oversell. Long-term consequence tracking is harder than short-term. A choice you made twenty sessions ago won't be remembered as precisely as one from two scenes back. Here's how it works in EchoQuest today. Your recent turns travel to the GM word for word, up to a generous budget of roughly 40,000 tokens. Older turns get folded, ten at a time, into a factual summary of 100 to 200 words. Key facts about your choices, faction reputations and NPC standings are stored explicitly in the game state instead of living only in the conversation. Even so, the texture of older moments fades. The GM may remember *that* you spared the villain in chapter four, but not the exact words you used.

On top of that, the AI doesn't experience your choices emotionally the way a human GM might. It won't be visibly moved by a sacrifice or caught off guard by a twist the way a person is. The performance of being moved is there in the narration; the actual being-moved isn't. For some players that doesn't matter at all. For others it's a real absence, and I think that's a perfectly fair thing to miss.

There's also a particular failure mode where the AI, faced with a genuinely ambiguous choice, writes text that hedges in both directions instead of committing. My hunch is that it's a side effect of training models to avoid being wrong, and in narrative terms it produces mush. I push against it directly. Since my October rewrite, the GM's instructions say the narrator commits: no "perhaps", no "it seems", no "you sense that maybe". If something really is uncertain, a character gets to be unsure out loud instead. The result is far stronger than an AI left to its own habits, although the odd hedge still slips through.

Still, the AI never gets tired, and it never runs out of patience. Within a session, its responsiveness is remarkable. Plenty of people greet any new game by trying to break it, making absurd choices and attempting impossible things, and I fully expect EchoQuest to get the same treatment. Go ahead. The GM will keep answering in character, and if you regret a move, pressing U undoes your last turn. My bet is that after a while, breaking it stops being interesting and you start making the choices your character would actually make. That's the moment EchoQuest becomes the kind of RPG that ruins other games for you.

**[See the difference for yourself →](/library)**
`,
  },
  {
    daysFromNow: 16,
    title: "How to Create Your First Custom World on EchoQuest",
    excerpt: "Build your own EchoQuest world by uploading a Game Bible or answering the World Builder Wizard. Steps for both, plus the beginner mistakes to skip.",
    content: `# How to Create Your First Custom World on EchoQuest

The official campaigns are a fine way to learn EchoQuest, and I mean that. I built the flagship ones to show off what the platform can do. Iron Citadel and Neon Precinct make good training grounds for a new player, and Saltbound teaches you how to keep a restless pirate crew on side. Still, sooner or later most people get an itch. Maybe there's a setting you've always wanted to play in, or a story you've been meaning to tell for years. Maybe it's a flavour of fiction nobody seems to be writing right now. Once a world like that is rattling around in your head, it's time to build it yourself. Custom worlds are where EchoQuest stops being "an interesting AI game" and turns into "the place I tell my own stories."

There are two main routes to a custom world: **uploading a Game Bible** and the **World Builder Wizard**. Either one gives you a fully playable campaign, run by the same AI Game Master, and you can rework and rebuild it later. Which one suits you depends on where you're starting from. If you've already got a document, upload it. If you're staring at a blank page, the Wizard was made for exactly that. (The same screen also offers a four-question Quick Build and an importer for old session notes, but I'll stick to the big two here.) Below I'll walk through both paths, tell you how I'd pick between them, and flag the mistakes first-time world-builders tend to make so you can sidestep them.

One bit of housekeeping before we start. Both paths unlock on the Storyteller plan ($15 a month or $129 a year), and that plan holds one private world. Creator ($29 a month or $239 a year) is the one you'll want later if you'd like to publish your world to the [library](/library) for other people to play.

## Path 1: Upload a Game Bible (Storyteller Plan)

If you already have a document describing your world, even scrappy notes, the Game Bible upload is the quickest way in. It's the option for anyone whose world has been gathering dust in an old notebook or a half-finished novel draft for years. You don't have to retype a single line of it.

**Step 1:** Write your world document. EchoQuest takes PDF, DOCX, TXT, Markdown and JSON, so a Word file works, and so does a Google Doc exported as .docx. Cover the basics: setting, tone, factions, major NPCs and an opening scenario. My [Game Bible template post](/blog/how-to-write-a-game-bible-the-world-builders-template) goes through all of it in detail. The format is forgiving. Section headings help the AI pick out the structure, although plain prose works too.

**Step 2:** Open **My Worlds** and choose **Upload a World**. (You can also go through **Create New World** and pick **Upload a Game Bible**; both land on the same page.)

**Step 3:** Select your file. The limit is 10 MB, which is a lot of words. EchoQuest's AI then reads your document and pulls out the world's structure: places, characters, lore and rules. A progress panel tells you what's happening as it goes, from receiving the file to extracting the text, then the AI reading your world (the screen says that part takes about fifteen seconds) and finally building it. Big documents can take a little longer, so go put the kettle on.

**Step 4:** Review what came out. You'll get a summary of what the AI extracted before you play, and this step matters more than it looks. The AI sometimes mistakes one colourful sentence for an entire faction, or misses a constraint you implied instead of stating outright. Two minutes spent checking here can save you real frustration later. If something's off, fix it at the source: tighten that paragraph in your document and upload it again. (Storyteller holds one private world at a time, so delete the old version from My Worlds first.) There's also a **Re-analyse** button on My Worlds that gives the AI a fresh read of the same text, which can help when the first pass missed something.

**Step 5:** Play. Your world is ready straight away, and the page hands you a button to start your adventure.

I'd pick uploading if you have an existing setting lying around, maybe from a long-running tabletop campaign or a novel you never finished. It's also the better fit if you'd rather draft in a word processor you already know than in a web form, or if you want full control over the exact source text the AI reads.

## Path 2: World Builder Wizard (Storyteller Plan and Up)

Like uploads, the Wizard comes with the Storyteller plan. Creator is the plan that adds publishing.

The World Builder Wizard walks you through building a world from scratch, one question at a time, with no document needed. It asks ten questions in all, and on the open-ended ones Claude offers suggestions you're free to borrow from or ignore. Honestly, it feels closer to a conversation than a form. You sketch an idea and Claude offers a few ways to flesh it out. Then you keep the bits you like.

It's also built to be heard. Each question is read aloud as you reach it, R repeats the question, V lets you speak your answer, and the arrow keys move you back and forth. In May I brought the phone version of the wizard up to the same standard as the web one, with a button to re-read the question and a pulsing ring on the mic button while it listens (it holds still if you've switched on reduced motion). I wanted a blind player to be able to build a world by ear and by voice, without ever reaching for a mouse.

**Step 1:** Name your world and write a one-sentence pitch. ("A crumbling empire where three noble houses compete to fill a power vacuum.") The pitch is the seed for everything that follows, so be specific. "A fantasy world" gives the AI nothing to grip. "A late-medieval merchant republic where a sea-god has just stopped answering prayers" sets a mood the wizard can actually build on.

**Step 2:** Choose your genre, style and content rating. Genre is broad, and you type it in your own words: dark fantasy, sci-fi noir, cozy mystery, whatever fits. Next you pick how the GM should run scenes, from cinematic and vivid to rules-light, crunchy, mystery, horror, political intrigue or fast-moving adventure. The content rating sets the limits the AI will respect, from Family up through Teen to Mature. Then you describe the narrator's tone in three words of your own ("hushed and watchful", say, or "brash and witty"). Treat these settings as guard rails rather than a cage. Inside them, you can play whatever you want.

**Step 3:** Decide where and when it happens, and who's fighting over it. The wizard asks for your setting (a region and an era, or just one memorable spot), and this is where your factions earn their keep. There's no separate faction screen, so I'd sketch three to five of them on paper first, each with a goal and a line it won't cross, then weave the important ones into your pitch and setting answers. Fewer than three and the politics feel thin. More than five and nobody can keep track. If you want a full faction roster with names and secrets, that's a strong argument for the Game Bible path instead.

**Step 4:** Build your opening scene. Where does the story begin, and what's at stake right now? The wizard asks for it in a sentence or two and offers some drafts based on your pitch. Don't be shy about rejecting them. If none of the suggestions feel right, write your own, or step back a question and return for a fresh batch.

**Step 5:** Set your hard rule. What can't happen in this world? Constraints sharpen everything else. "No resurrection magic", "no firearms", "no telepathy", "the gods are silent": each one nudges the stories in a particular direction. The wizard asks for one rule the GM must never break, so choose the one that shapes your world most. There's actual research behind this instinct, by the way. In [two experiments by psychologist Catrinel Haught-Tromp](https://doi.org/10.1037/aca0000061), people wrote more creative rhymes when they were handed a word they had to include, and she named the effect after *Green Eggs and Ham*, the Dr. Seuss bestseller written with just 50 different words.

**Step 6:** Generate and play. The last question asks your character's name, and you can add a cover image link if you have one. Hit finish, and the Wizard compiles your answers into a playable world and takes you straight to character creation, then into your first scene.

The wizard makes more sense if you're starting from a hazy idea instead of an existing document, or if you'd like Claude to pitch in while you shape the world. It's also kind to newcomers, because the questions make sure you've covered the essentials.

## Tips for First-Time World Builders

**Start smaller than you think.** A single city with three factions and one crisis is enough for ten sessions, and you can always expand later. New world-builders almost always overshoot. They draft continents and pantheons before any character has set foot in a tavern. A small, dense world plays better than a large, vague one, so keep your first world to a single region. Experienced GMs swear by this too. Sly Flourish's [spiral approach to campaign building](https://slyflourish.com/spiral_campaign_building.html) skips the gods and cosmology entirely and starts with one small town, because, as he puts it, the larger world is interesting "only in small pieces revealed to the characters as they explore the world around them."

**Don't over-explain magic.** The AI GM will work out rules for you as it goes. Write about how magic *feels* in your world, and leave the system mechanics alone. "Magic is rare and feared, takes hours to cast and always leaves the caster physically drained" does far more work than three pages of mana-cost tables. Mechanics belong in a tabletop rulebook; feelings belong in a Game Bible. Brandon Sanderson's [First Law of magic](https://www.brandonsanderson.com/blogs/blog/sandersons-first-law) explains why this works: a writer's ability to solve conflict with magic is directly proportional to how well the reader understands it. Mysterious magic is wonderful, as long as it creates problems instead of solving them. And frankly, that's exactly the kind of magic an AI narrator handles best.

**Name your starting NPC.** Give the first character the player meets a specific name, a personality, a mannerism and one secret. This person anchors the whole early game. What's more, a fully realised first NPC hands the AI a model to follow when it invents everyone who comes after.

**Write the opening scene yourself.** The most valuable 200 words you'll write are the first scene. The AI takes its cue for everything afterwards from what it sees in scene one. If you want a tense political thriller, open on a tense political moment, not "you wake up at an inn." Whatever your opening looks like, the campaign will lean into it. Tabletop GMs call this a [strong start](https://slyflourish.com/eight_steps_2023.html), and the rule of thumb is simply that "something happens": an ambush, a long-lost friend at the door, a festival spilling into the streets or a sinkhole opening in the road. I'll admit this tip is close to my heart. On October 2 I rewrote the GM's own instructions so it opens every scene on one concrete detail and ends on a direct question to you, because a scene that starts limp rarely recovers.

**Iterate.** Your first world will have weak spots you only notice after a few sessions in it. That's fine, and it's normal. Revise your Game Bible and upload it again, or run the Wizard a second time with sharper answers. World-builders who treat their first attempt as a draft and not a finished product end up with much better second worlds. So, what's the first world you're going to build?

**[Create your world →](/worlds/new)**
`,
  },
  {
    daysFromNow: 17,
    title: "Voice Commands in EchoQuest: Play Completely Hands-Free",
    excerpt: "How to play EchoQuest by voice: setting up the mic, the exact phrases it understands, tips for cleaner recognition and pairing it with a screen reader.",
    content: `# Voice Commands in EchoQuest: Play Completely Hands-Free

Plenty of people can't use a keyboard or mouse comfortably. A motor disability can do it, and so can a repetitive strain injury or a few weeks of recovery after surgery. Sometimes it's simply that your hands are covered in bread dough. EchoQuest's voice commands are for all of them. Once you're in a game, you can play turn after turn by speech alone: pick choices, ask where you are, pause the narrator, save, and tell the Game Master what you do in your own words. Getting from the front page into a game still means a few clicks or key presses, and later on I'll explain how your computer's own voice control can cover those too.

This is a big group of people, by the way. The World Health Organization estimates that [1.3 billion people, about 1 in 6 of us, live with a significant disability](https://www.who.int/news-room/fact-sheets/detail/disability-and-health). So I treat voice as a core way to play, not a party trick.

What follows is my complete guide to voice play. I'll cover how the system works under the hood and how to set it up for the best accuracy. After that come the commands that go beyond submitting actions, and how voice teams up with other accessibility tools so you can play with your hands and eyes both free. If you're new to voice control, or you doubt it can carry a full RPG session, the walkthrough below should settle most of your worries.

## How It Works

EchoQuest uses the browser's Web Speech API to turn your spoken words into text as you talk. Your voice doesn't go to EchoQuest for transcription. The browser handles it, and in Chrome that means a speech service run by the browser maker: as [MDN's guide to the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) explains, "your audio is sent to a web service for recognition processing, so it won't work offline." Any web page can call it through a standard interface, which is exactly what I do. When you switch voice input on (with the microphone button or the V key), you speak and the browser transcribes. Then EchoQuest works out what you meant.

That last step is where most of my recent work went. Every finished transcript lands in one of three buckets:

- **A choice.** "Choose option three", "pick two", "number one", or simply "three" selects that suggested choice on the spot. If you ask for option seven and there are only four, it tells you so instead of guessing
- **A command.** Short phrases such as "pause", "where am I" or "save game" run instantly, with no AI involved
- **An action.** Everything else goes to the AI Game Master, exactly as if you'd typed it

There's no special syntax for actions. Just talk normally: *"I ask the guard where the prisoner was taken"*, say, or *"I try to pick the lock on the chest."* *"I look around the room for anything out of place"* works just as well. The GM gets your words as you said them, so there's no vocabulary to learn and nothing to memorise.

One decision I'm quite pleased with: a command only counts when it's the whole phrase. Say "stop" and the narrator pauses. Say "stop the guard" and your character tries to stop the guard. I didn't want the game hijacking a perfectly good sentence just because it happened to contain a command word, and matching whole phrases solves that neatly. I also taught it that "to" and "too" usually mean "two", and that "for" usually means "four", because speech recognisers hear numbers in some creative ways.

Voice follows the same rule as the rest of EchoQuest's accessibility design. It's another way to give the same commands, and it isn't a stripped-down "voice mode". Anything you can do by typing an action, you can do by saying it, and the GM responds identically.

## Setting Up Voice Input

1. Open EchoQuest in Chrome if you can. Browser support for speech recognition is patchy: [Can I use](https://caniuse.com/speech-recognition) lists only partial support in Chrome and Safari. Firefox keeps it switched off by default, and Edge isn't counted as supported either. If the game tells you voice input isn't supported in your browser, that's the reason, and Chrome is the fix
2. When the browser asks, allow microphone access. EchoQuest only listens after you've switched voice input on. Nothing is always listening. (Fun fact: in September I discovered that my own security settings blocked the microphone on every EchoQuest page, so voice input couldn't start at all. Now the mic is allowed on EchoQuest's own pages only, and ads and other embedded content still can't touch it.)
3. During a game, click the microphone button or press **V**. If the narrator is mid-sentence, it pauses while the mic listens, so it doesn't talk over you or into your microphone. If you end up saying nothing, it carries on where it stopped
4. Speak your action clearly. A live transcript appears as you talk, so you can see what's being captured
5. Pause when you're done. Choices and commands fire right away. A free-text action gets read back to you ("Heard: I draw my sword") and sends itself after about three and a half seconds. Press **Send** to fire it off at once, or **Cancel** to throw it away

That short wait exists because of one very specific word. The reason I added confirmation back in May was that "attack the wizard" could come out as "attack the lizard". Firing that straight to the GM would cost you an AI turn, and on top of that it would drop a reptile you never meant to fight into your story. A few seconds of grace is a fair price for not wrestling lizards.

If you use a screen reader, the microphone button is a proper toggle that reports whether it's on, and you can reach it from the keyboard. When listening starts you'll hear "Listening… speak your action," and the read-back with its Send and Cancel buttons is announced too.

## Navigation Voice Commands

Beyond submitting actions, you can run the game itself by voice:

| Say | Action |
|-----|--------|
| "Option two", "choose option 3", "pick two" or just "three" | Select a suggested choice |
| "Replay" or "Read last" | Repeat the last narration |
| "Pause" or "Stop" / "Continue" | Pause or resume narration |
| "Where am I" or "Current location" | Hear where you are and what the place is like |
| "My status" or "Read status" | Hear your name, health, location and turn number |
| "Open inventory" or "Show inventory" | Open the character inventory panel |
| "Open quest log" or "Show quests" | Open your quests |
| "Save game" | Save your progress right now |

You can even tack a "please" onto commands like "save game". I'm not going to make anyone choose between good manners and a working game.

Once the browser has transcribed them, these commands are handled right there on your device. They don't need the AI, so they take effect immediately and don't use up turns. Actions, by contrast, go through the AI GM and come back as narration. For anything that isn't on the list, the keyboard has you covered, and H opens a help panel with every shortcut. And while a free-text action is waiting to send, the Cancel button is how you call it back.

Here's a pattern I like: mix commands and actions in the same breath of play. "Option two" picks the second suggested choice. Next, "I draw my sword and step toward the door" goes off as a custom action. Then "replay" if you'd like the answer read again. The game keeps up the whole way, and your hands can stay wherever they happen to be.

What about the menus outside a game, like signing in or browsing the library? That's where your operating system's own voice control earns its keep. On a Mac, Apple's Voice Control lets you say ["Show numbers"](https://support.apple.com/guide/mac-help/use-voice-control-commands-mh40719/mac) to label every clickable thing on screen, then "Click 5" to press one. On Windows 11, [Voice Access](https://support.microsoft.com/en-us/accessibility/windows/voice-access/set-up-voice-access) can drive your whole PC by voice, and it even works without an internet connection once it's set up. EchoQuest's pages use real buttons and links with proper labels, so both tools can find them.

## Tips for Best Accuracy

- **Use a headset or a directional microphone.** Background noise is the biggest enemy of clean transcription. A built-in laptop mic works, although it's noticeably less reliable than even a cheap USB headset
- **Speak at a moderate pace.** Recognition copes best with conversational speed, and much worse with very fast or very slow speech. If you're a natural speed-talker, easing off just a little often clears up a surprising number of errors
- **Help it with unusual names.** Fantasy names trip up recognisers. Try saying a name phonetically the first time, and keep a little crib sheet of character names handy during the first scene so you're not fumbling for pronunciations
- **Rephrase if needed.** If a transcript comes out wrong, hit Cancel during the read-back and say it again. And if a mangled one slips through anyway, simply speak the correction. The AI GM shrugs off small slips and will handle "I meant to say I draw the dagger, not the dragon" as smoothly as a perfectly transcribed action
- **Quiet rooms help.** Even an expensive mic struggles with the TV blaring in the background. Voice play works best in the same conditions that make any phone call easier
- **Check your microphone level.** Too high and your voice distorts; too low and words drop out. Most operating systems have a microphone test in their sound settings, so spend two minutes calibrating before a long session

## Combining Voice and Screen Reader

If you use a screen reader alongside voice input, the two fit together well. EchoQuest narrates every scene aloud, and the important changes are announced too, like losing HP or picking up an item. The result is a fully hands-free, eyes-free loop. You speak your action, the game responds, the narration reads it aloud, and you answer again. Honestly, the rhythm is a lot like a phone call with an endlessly patient and wildly imaginative friend.

Getting the timing right took me a few goes. In May I found that EchoQuest was announcing the choices while the narrator was still speaking, so screen reader users heard two voices at once. Now the choices wait their turn. The new mic behaviour comes from the same instinct: when you switch the mic on, the narrator pauses and lets you speak.

This is the use case that matters most to me: a complete RPG for players with both visual and motor disabilities. If that's you, please [get in touch](/contact-us). Your feedback teaches me the most, and I want to know every time something doesn't work.

## Beyond Disability: Why Sighted Players Use Voice

Voice isn't only for people who need it. I suspect lots of players will choose it simply because they like it better, and I can see why. Playing by voice feels different from typing. The session gets the cadence of spoken storytelling, and for a moment your character's voice and your own are the same voice. That's a kind of immersion typed play never quite reaches.

You can mix and match, too. You might speak your actions and use the keyboard for everything else. You could play while you cook, since the game waits patiently until you say something. Or you might switch to voice halfway through a long session to give your wrists a rest. There's no wrong combination, and you can switch in and out whenever you like. Voice commands come with the free tier, so why not try a few the next time you play?

**[Try voice commands in a free session →](/library)**
`,
  },
  {
    daysFromNow: 18,
    title: "The Science of Immersion: Why Audio Storytelling Is So Powerful",
    excerpt: "What brain research says about why a story told aloud feels so vivid, and how that science shaped EchoQuest's narration, voices and ambient sound.",
    content: `# The Science of Immersion: Why Audio Storytelling Is So Powerful

Ask someone to describe a book they loved and they'll tell you about pictures: the colour of a room, say, or a face they can still see clearly years later. Then ask where those pictures came from, and watch them pause. The pictures were never in the book. The author wrote sentences, and the reader's mind filled in everything else. Most of what people remember loving wasn't on the page at all. It was in them.

That's the quiet magic of narrative immersion, and audio storytelling happens to be especially good at setting it off. Think of the podcasts people return to every week for years, or the audiobook someone swears got them through a rotten winter. I'd argue they work so well precisely because sound slips past some of the bottlenecks other media put in the way. So this post is a tour of the research behind audio's particular pull. It's also an honest account of why I built EchoQuest the way I did, because a lot of my design decisions trace straight back to these findings.

## What Happens in Your Brain During a Story

Brain imaging has turned up something remarkable. When we follow a story, parts of the brain we use for real experience join in. In a [2009 fMRI study at Washington University in St. Louis](https://dcl.wustl.edu/items/reading-stories-activates-neural-representations-of-perceptual-and-motor-experiences/), Nicole Speer and her colleagues found that as readers moved through a story, different brain regions tracked different parts of it, like where a character was or what they were trying to do. Some of those regions mirror the ones that light up when people carry out similar actions in real life, or merely picture them. Smell works the same way. Another team showed that [simply reading words like "cinnamon" or "garlic"](https://pubmed.ncbi.nlm.nih.gov/16651007/) activated primary olfactory cortex. And touch gets in on it too: at Emory, people who [heard sentences with texture metaphors](https://news.emory.edu/stories/2012/02/hearing-metaphors-activates-sensory-brain-regions) such as "she had a rough day" showed activity in a region we use to feel texture with our fingers, which the plain "she had a bad day" didn't trigger.

So the brain doesn't merely understand stories. It simulates them. Those simulations are partial and patchy, sure, but they're real, and they produce real emotional responses.

That's what's going on underneath the everyday feeling of being "lost in a book." You aren't really lost. You're running a model. And that model runs on genuine machinery: the parts that handle emotion and plan movement, and sometimes even the circuits that deal with people in your actual life. In a very real sense, stories *happen to you*, even when nobody's moving and nothing's on a screen.

All narrative works like this. Still, I'm convinced it's strongest when the story reaches you through your ears, because listening leaves the simulation engine with more room to run. Let me explain why I think that.

## Reading vs. Listening

Here's a finding that surprises people. When Fatma Deniz and her colleagues at UC Berkeley scanned people [listening to stories and then reading the same stories](https://www.jneurosci.org/content/39/39/7722), the maps of meaning across the brain came out almost identical. Your brain understands the words about equally well either way.

So the difference isn't comprehension. It's what else your senses are busy with. When you read, your eyes and visual system are hard at work decoding marks on a page. Skilled readers do this astonishingly fast, of course. Even so, the job of picturing the room has to share space with the job of recognising the shape of the word "room." When you listen, your eyes are off duty. Close them and that whole visual system is free to build the scene the narrator describes. That's my reading of the evidence, and I'll happily stand behind it.

There's some striking data on the emotional side, too. In a study at University College London, [102 people listened to audiobook scenes and watched film and TV versions](https://www.ucl.ac.uk/news/2018/jun/audiobooks-more-engaging-films-or-television) of the same stories, from *A Game of Thrones* to *The Silence of the Lambs*. Afterwards, people *said* the videos had gripped them more. Their bodies disagreed. Heart rates ran higher while they listened, and so did skin conductance, a classic marker of emotional arousal. The researchers read that as a busier imagination and deeper emotional involvement. In fairness, Audible commissioned that study, so take it with a grain of salt. Even so, it fits everything else we know about simulation.

That's why radio dramas and podcasts build such vivid inner worlds, and why a narrated game can reach a kind of immersion visual games often struggle to match. A visual game gives you the picture and asks you to react. An audio game hands you a seed and lets your imagination grow it. And what grows is yours in a way a rendered image never quite manages to be.

## The Role of Voice Performance

How something is spoken changes how it's experienced. Read a sentence slowly, with a small pause before the key word, and you create anticipation that the same sentence on a page simply doesn't have. Vocal performance carries emotional context through rhythm, pitch, pace and silence, and a silent reader has to supply all of that themselves. Take the line "she said his name." Spoken aloud it might land as devastating or as casual. It could drip with sarcasm or shake with fear. The reader has to guess which. The listener is told.

There's evidence that voices carry feelings remarkably well on their own. Across five experiments with 1,772 participants, Yale psychologist Michael Kraus found that people [read others' emotions more accurately from voice alone](https://www.apa.org/news/press/releases/2017/10/emotions-listen) than from voice plus video. Other researchers have since argued that the edge is small. Still, the fact that a voice on its own holds up at all against a voice with a face attached tells you how much feeling it carries.

So a good performance hands you emotional context for free. A reader has to infer that a scene is tense from the prose. A listener simply hears the tension in the voice, without spending any effort to extract it. That spare effort flows back into imagination, and in my view that's a big part of why listeners feel so drawn in.

That's why I spend so much time on narration quality. The ElevenLabs voices on the Storyteller plan aren't just reading text aloud. They're performing it and giving the story room to breathe, something flat text-to-speech can't do. Strip out the performance and much of audio's advantage shrinks. Put it back and you get the full effect.

Getting there was humbling, to be honest. In May I discovered that the premium voices pitched up like chipmunks whenever you sped up playback, so I had to make sure the pitch held steady. Later that month, NPC voices refused to switch at all, because the characters' dialogue wasn't being woven into the narration. Once I fixed that, I matched NPC voices to each character's gender across the whole voice catalogue. And then there was the worst immersion-breaker of all: raw JSON leaking into the spoken narration. Nothing snaps you out of a haunted crypt quite like a narrator reading out curly brackets. That one's fixed too.

## Ambient Sound as Cognitive Scaffolding

In EchoQuest, sound does more than accompany the story. It sets the stage before the words arrive. When the low, echoing hum of a cave comes up under the narrator, your brain has already started building the place. The narration then fills a space the ambience has sketched. By the time the GM says "the corridor opens into a vast chamber," your imagination has been warming up for that chamber, and the picture snaps into focus faster and lands harder.

Film composers have used the same trick for a century: music tells you how to feel about what you're about to see. Psychologist Marilyn Boltz showed this neatly in a [2001 study](https://scholarship.haverford.edu/psychology_facpubs/20/). She paired ambiguous film clips with either upbeat or ominous music, and showed a control group the same clips with no music. The soundtrack bent how viewers interpreted the scene, and even what they remembered of it afterwards, in the direction of the music's mood. Ambient sound works on the same principle. It tells you where you are before you hear what's happening there, and I'd say it's one of the cheapest and most effective immersion tools available. In EchoQuest the beds are synthesised right in your browser, so they cost almost nothing to deliver.

I learned how fragile that scaffolding is, mind you. Back in May I added a forge and a storm to the ambient library, plus an underwater bed, and I taught the ambience to duck politely under sound cues so a sword clash doesn't fight the wind. I also started dropping duplicate cues that fire within 80 milliseconds of each other, because a doubled thunderclap sounds like a glitch, not a storm. Then on May 16 I found the ambient soundtrack was quietly ratcheting itself down to silence after about five turns. A cave that goes dead quiet halfway through a scene feels wrong, even if you can't say why. A couple of weeks later I found it was silent on mobile as well. Both are fixed, and the lesson stuck: the ambience only works if it's always there.

## Why This Matters for Blind Players

For sighted players, audio immersion is a choice, a different mode they can opt into. For blind and visually impaired players it's simply how things work. Many bring exactly the skills audio storytelling rewards: close attention to sound and years of building complete worlds from partial information. On top of that, they're used to tracking several sound sources at once and reading emotion in a voice. Lots of blind people have been doing all this every day of their lives.

There's hard evidence for some of it. Researchers in Germany note that people with vision loss [can learn to understand speech at up to about 22 syllables per second](https://pmc.ncbi.nlm.nih.gov/articles/PMC3847124/), while sighted listeners top out around 8. Their brain scans showed parts of the visual cortex pitching in to process that ultra-fast speech. It's also why I think the [ and ] keys, which let you push narration speed up or down mid-scene, matter so much: plenty of experienced listeners want the narrator far faster than any default.

Far from being a compromise, then, I believe audio-first gaming may be the format that plays to blind players' strengths. That's what I designed for. My goal was an RPG where a blind player starts with no disadvantage at all compared to a sighted one, and possibly with an edge. Visualisation skills built over a lifetime of listening transfer directly. So does a sharp ear for tone, and the patience to build a world from sound instead of a glance at a screen.

That goal is why the small timing bugs bother me so much. In May I noticed the choices were being announced while the narrator was still talking, so screen reader users heard two voices at once. Now the choices wait. And since October 2, narration starts speaking while the GM's reply is still being written, and the next premium clip loads while the current one plays. Dead air is the enemy of immersion, and nobody notices it faster than someone who's listening closely.

## Why This Matters for Sighted Players

The flip side holds too. I'd bet sighted players who give audio-first play a real go will find abilities they didn't know they had. Visualisation gets sharper with practice, and your ear for emotion in a voice grows subtler. The mental muscles audio play uses are there in sighted brains as well. They're just underused, because most media aimed at sighted people never asks for them. My hunch is that after a few months of regular listening, audiobooks and radio dramas start to feel richer, because your attention has been retuned. Have you ever noticed a podcast getting more vivid once you closed your eyes? That's the same muscle.

None of this means audio is "better" than visuals. They're different, and each one can deliver a powerful experience. For narrative immersion specifically, though, audio has built-in advantages that the science supports, and I designed EchoQuest to squeeze every drop out of them.

**[Experience it for yourself →](/library)**
`,
  },
  {
    daysFromNow: 19,
    title: "Setting Difficulty in AI RPGs: From Beginner to Power Player",
    excerpt: "How hard should your AI RPG be? A guide to tuning combat danger, puzzle help and story consequences in EchoQuest, plus exactly what to tell the GM.",
    content: `# Setting Difficulty in AI RPGs: From Beginner to Power Player

Difficulty is one of the most personal things about an RPG. Some players want to feel like heroes, capable and effective, carried along by a story that rewards them. Others want to be tested and humbled, forced to weigh every decision. Then it gets fiddly. You might love lethal combat but want the story to forgive your blunders. Your friend might want the exact opposite: gentle fights and a plot that never lets a mistake go. Someone else wants both turned up to brutal. And with puzzles, one player will happily chew on a riddle for an hour while another just wants a nudge when they're stuck. Every one of those is a legitimate way to play, and squashing them onto a single Easy/Normal/Hard slider sells short how deep RPG difficulty really goes.

Game designers have known this for a while. Jenova Chen, who later made *Journey*, wrote in his [2006 thesis on flow in games](https://www.jenovachen.com/flowingames/Flow_in_games_final.pdf) that when a challenge outstrips your ability you get anxious, and when it falls short you get bored. His best line, though, is that "like fingerprints, different people have different skills and Flow Zones." I couldn't agree more.

EchoQuest is designed to serve all of those preferences. The AI GM listens to how you say you want to play, and it can shift mid-campaign when your taste does. So in this post I'll treat difficulty as several dials rather than one slider. I'll also give you the actual words to use when telling the GM what you want, and help you find the setup that fits your own idea of fun.

## The Three Dials of Difficulty

In a traditional video game, difficulty is one setting: Easy, Normal or Hard. A few studios have started breaking that apart. *The Last of Us Part II*, for instance, lets you [tune five separate sliders](https://www.naughtydog.com/blog/the_last_of_us_part_ii_accessibility_features_detailed) for your own character, enemies, allies, stealth and resources, as part of more than 60 accessibility settings. An AI RPG can go further still, because there's a storyteller on the other end who understands plain English. I think of it as three separate dimensions, each independent of the others. (Tabletop fans will notice they line up loosely with D&D's [three pillars of play](https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game): combat, exploration and social interaction. That's no accident.)

**1. Combat lethality.** How quickly does your HP drain, and how often do fights leave lasting marks? Does a missed parry mean a sprained wrist or a severed hand? With high lethality, every fight matters and retreat becomes a real option. You'll think hard about whether to engage at all, and tactical details like positioning and timing start to count. With low lethality, you can charge in and bounce back quickly, so combat stays lively and rarely threatens the whole campaign.

One thing doesn't bend, mind you: the dice. When you try something risky, EchoQuest rolls a d20, adds your stat modifier and checks it against a target number that runs from 5 for trivial up to 24 for near impossible. The GM narrates whatever the dice decide. Since October 2 that roll resolves in the same turn, so you're never left dangling to learn whether you made the jump. What your preferences change is how the GM frames danger and how hard the consequences land.

**2. Puzzle and mystery difficulty.** Does the GM drop hints, or confirm you're on the right track? Will it point out a detail the player would spot even if the character might not? Lower difficulty means more guidance, with the GM gently steering you toward the next clue when you've been stuck a while. Higher difficulty means the world won't hold your hand. You might miss a vital detail altogether, and then you live with a messy, imperfect solution.

**3. Narrative consequence weight.** Do your choices leave lasting marks that the GM tracks carefully? Or is the story more forgiving, letting you change direction without permanent fallout? With heavy consequences, a betrayal in chapter two still shapes every social scene in chapter ten. With light consequences, the world welcomes course corrections, and the GM will happily smooth over inconsistencies if that makes a better story. Under the hood, EchoQuest tracks your standing with every named NPC on a scale from -100 (sworn enemy) to +100 (loyal ally), so a world that remembers isn't a figure of speech here.

You can set these dials independently. One player might want heavy narrative consequences (their decisions matter forever) with low combat lethality (fights are fun but rarely deadly). Another might want high lethality (every wound is a genuine threat) alongside easy puzzles (they'd like help when stuck). The GM works with any mix you throw at it.

## How to Communicate Difficulty to Your AI GM

The clearest way to set expectations is in your opening message or your character's backstory. Here are some examples you can borrow:

- *"I'm new to RPGs. Please give me guidance when I seem stuck, and go easy on me in fights."*
- *"I want a gritty, realistic experience. Injuries should matter and bad decisions should cost me."*
- *"I prefer narrative immersion over mechanical challenge. Focus on story quality over difficulty."*
- *"Play this like a hard-mode dungeon crawl. No hints, no safety net, permanent consequences."*
- *"I want low-lethality combat but high social stakes. Fights should be exciting but not deadly, and lying to NPCs should have lasting consequences."*
- *"This is a tragedy. Make hard things hard. Don't soften the blows. I want to feel my character's losses."*

The GM reads instructions like these and adjusts. The more specific you are, the better it can tune things. You can also change course mid-session by saying what you want outright. "Let's make things more dangerous from here on" is a perfectly valid thing to type or say, and the GM will start raising the stakes from the next scene.

A habit that works well: state your preferences early, and state them once. They become part of your story's history, so you don't need to keep repeating yourself, and if the tone ever seems to drift, a one-line reminder puts it back. If you're dying too often, say so. If you're winning every fight without breaking a sweat, say that too. The GM treats these as honest calibration. Nobody's going to think less of you for asking.

## The Beginner Experience

If you're new to RPGs, EchoQuest's prebuilt campaigns are designed to ease you in. Every world in the library is tagged as beginner-friendly right now, and here's what that means in practice:

- The opening scenarios are clear and focused, so there's always an obvious first move and you're never staring at a blank prompt wondering where to begin
- Every scene ends with three to five suggested choices, and at least one of them moves the main story forward. If you're stuck, the way on is usually sitting right there
- Risky choices are labelled with the stat they'll test, like "[DEX check]", so you know a roll is coming before you commit
- Fights are survivable even when you make poor calls. Nobody dies permanently in EchoQuest. Hit 0 HP and you get a real setback instead: you might be captured, robbed or dragged clear by someone with an agenda, or you wake hours later with a price to pay
- The story rewards exploration and curiosity without punishing wrong turns. Poking down a dead-end side path counts as a story moment, not a wasted turn
- NPCs forgive social fumbles. Say something awkward and the world won't end
- And if you really regret a move, press U to undo your last turn

That undo button has a history, actually. In May I found that a turn which errored halfway could leave half-applied changes behind (say, gold gone from your purse but no sword in your pack). So I built a full rollback, where a turn either lands completely or not at all, and I added single-step undo around the same time. It's a safety net I'm glad beginners have.

If the beginner experience ever starts feeling too easy, just tell the GM you'd like more challenge. The dial moves right away.

## The Power Player Experience

For veterans who want a proper challenge:

- Pick a world whose premise promises trouble. The library's difficulty tags won't help you here, since they all say beginner for now. The real challenge comes from how you ask the GM to run things, so a gothic horror or a cosmic-horror investigation is a good place to start
- Tell the GM plainly that you want high difficulty and meaningful consequences. Ask for hard target numbers, and for setbacks at 0 HP that genuinely hurt
- Engage with the world's politics and factions, not just its fights. The deepest challenges in EchoQuest are social and moral, not merely mechanical. You can plan a fight. A faction war where every move makes someone hate you is much harder to optimise
- Try ignoring the suggested choices completely and type or speak your own action every turn. The suggestions are training wheels. Without them, the game becomes a writing exercise where the world reacts to whatever you actually invent
- Play under your own permadeath rule. EchoQuest itself never kills a character for good (at 0 HP you suffer a setback, not a game over), so there's no switch for this. Instead, promise yourself at the start that if your character goes down, the run is over and you'll begin a fresh one. Swear off the undo key while you're at it. That self-imposed threat changes everything, and sessions hit harder when you know the run is mortal
- If you build your own world with the World Builder Wizard, choose the "Crunchy with mechanics" style. The GM will then keep a closer eye on your stats and talk about rolls out loud

That 0 HP setback is fairly new, by the way. Until October 2, hitting zero did, well, nothing at all, which made high lethality a bit of a bluff. Now the GM knows when you're down and has to narrate a real setback, and you hear a sound cue when it happens. In the same pass I discovered that the game engine, the GM and the character sheet were each using a different XP curve, so your XP bar could sail right past 100%. These days there's one curve everywhere.

## The Middle Path

If you asked me for a default, I'd point you to a middle setting. Go for medium-high lethality, meaning real risk with a real route to recovery. Pair it with medium puzzle difficulty, where the GM doesn't volunteer answers but responds honestly when you ask. Then turn narrative consequences all the way up, so the world remembers everything. That combination produces the kind of long-running campaign that earns its dramatic moments. Cheap losses don't sting. Hard losses on a path you chose, fully aware of the stakes, are unforgettable.

## A Note on Content Rating

Worlds in EchoQuest carry a content rating that controls how dark the themes get and how intense the violence is. When you build a world with the Wizard, you pick it yourself: Family, Teen or Mature. That rating is separate from mechanical difficulty. A Family-rated world can still be strategically demanding. And a Mature-rated one can be emotionally intense without being mechanically hard. So pick the rating based on the kind of fiction you want to hear, not on how hard you want the game to be.

The two settings interact in interesting ways, though. A Mature-rated, high-lethality campaign can be punishing. Meanwhile a Family-rated, low-lethality, high-consequence campaign can still move you deeply, because its consequences are personal and emotional rather than violent. There's no single "best" combination. There's only what's right for the story you want to tell. So, which dials are you turning first?

**[Find a campaign that fits your style →](/library)**
`,
  },
  {
    daysFromNow: 20,
    title: "The History of Interactive Fiction: And Where AI Takes It Next",
    excerpt: "From Colossal Cave in the 1970s to AI Game Masters today, a short history of interactive fiction, what each era couldn't do and where AI pushes it next.",
    content: `# The History of Interactive Fiction: And Where AI Takes It Next

Every medium has a moment when it discovers what only it can do. Film found it in editing, when people realised that cutting between two shots could create a meaning that lived in neither, and television found it decades later in serialisation, telling one story over a hundred hours to reach emotional depths no two-hour film could touch. Interactive fiction, I'd argue, is still in the middle of its discovery. The medium has spent about fifty years experimenting with what makes a story work when the *reader is the protagonist*, and I'm convinced AI is the moment it finally finds its native form.

So this post is a short history of how we got here. I'll look at what each era of interactive fiction made possible and what it ruled out, and then at what AI unlocks that nothing before it could. If you've ever wondered why text adventures boomed and then vanished, or why AI Dungeon felt like a glimpse of something even though it couldn't hold itself together, the arc below traces the thread. It's also, frankly, the story of why I built EchoQuest.

## 1976: The Colossal Cave

Interactive fiction begins, depending on who you ask, with Colossal Cave Adventure, a text game written by Will Crowther in the mid-1970s. Crowther was a programmer at Bolt, Beranek and Newman (BBN), where he'd helped build the ARPANET, and a keen caver who had helped map parts of Kentucky's Mammoth Cave system. Legend has it he wrote the game for his young daughters. Dennis Jerz, who dug through the original code for a [2007 study in *Digital Humanities Quarterly*](https://dhq.digitalhumanities.org/vol/1/2/000009/000009.html), found that Crowther probably wrote it during the 1975-76 academic year. He also noticed, with a historian's raised eyebrow, that the very last word in its vocabulary table is an expletive, so the kids weren't the only audience Crowther had in mind.

You typed directions and actions, and the game answered with descriptions. A whole world, built out of nothing but words. Don Woods, a Stanford graduate student, later expanded it with fantasy elements (treasure to collect, plus puzzles that needed magic words), and it spread through the early ARPANET like wildfire. One account Jerz quotes estimates that Adventure "set the entire computer industry back two weeks." In 2019 [The Strong National Museum of Play inducted it](https://www.museumofplay.org/blog/2019-class-of-the-world-video-game-hall-of-fame/) into the World Video Game Hall of Fame, noting that it inspired Scott Adams to found the first commercial computer game company.

Here's my favourite detail, though. A colleague of Crowther's told Jerz that Will was amused by "how well he could fool people into thinking that there was some very complex AI behind the game." Fifty years on, there actually is. I find that delightful.

By any modern measure it was primitive, with a simple parser that knew a short list of commands and a map that never changed. Still, it introduced the core idea everything since has built on. You could stand inside a story and make it move. The story existed somewhere, and you were inside it, changing what happened next with every line you typed. In a sense, every decade of interactive fiction since has been refining that single insight.

## The Parser Era (1977–1993)

Infocom turned the cave into an industry. (Fittingly, Infocom co-founder Dave Lebling had played in the same tabletop D&D campaign as Crowther himself.) Zork, The Hitchhiker's Guide to the Galaxy, Planetfall, A Mind Forever Voyaging and Trinity made text adventures a serious commercial genre. Infocom's parsers were the most sophisticated of their day. You could type "put the blue bottle on the second shelf", and the game would pick apart the sentence, work out the verb and the objects, check you actually had the bottle and could reach the shelf, and then (sometimes) understand you. The puzzle design that grew out of that capability was extraordinary. Brian Moriarty's Trinity, which sends you to the first atomic test, ends on a meditation about nuclear weapons that still lands as hard as anything in fiction.

The limitation was always the parser, however. It knew a finite vocabulary. Step outside it and you got "I don't know the word X." The promise of endless possibility kept crashing into a very finite implementation. As a result, players developed an almost telepathic bond with the parser, learning to phrase every action the way the designer expected. A game might understand "examine the chest" and stare blankly at "have a rummage through the chest." The genre turned into a vocabulary game wrapped around a story, and that ceiling, high as it was, was real. Do you remember that feeling of hunting for the one magic verb? By the end of the 1980s Infocom itself was gone, and in my view the commercial collapse owed as much to the limits of the form as to the rise of graphical games.

## The Hyperlink Era (1993–2010)

The web finished off commercial text adventures, but it gave hobbyists a home. The parser didn't die so much as go underground. The annual Interactive Fiction Competition became a showcase, and some of the most celebrated work of the period came from there. Adam Cadre's [Photopia won the 1998 competition](https://if50.substack.com/p/1998-photopia) and showed that a parser game could make people cry. Emily Short's Galatea (2000) built an entire game out of one conversation with a statue. Later, Inform 7 gave authors a way to write parser games in something close to plain English.

Meanwhile hypertext fiction took off. Tools like Twine (released by Chris Klimas in 2009) and publishers like Choice of Games let authors build branching narratives where clicking a link replaced typing a command. The player became a reader making decisions at key moments. Production costs fell to almost nothing, so a single author with no programming background could ship a complete interactive story.

Branching solved the parser problem by constraining choice entirely. There was nothing to misunderstand, because you could only pick from the options on offer. Even so, it created a new problem: every branch had to be written in advance. Stories became finite decision trees with an illusion of freedom. The most ambitious authors turned the constraint into an art form. Porpentine's Twine game *howling dogs* (2012), which Emily Short [reviewed](https://emshort.blog/2012/10/10/if-comp-2012-howling-dogs-porpentine/) during that year's competition, used its narrow paths to make you feel trapped on purpose. But the constraint was always there. You never did anything the author hadn't anticipated.

## The Hybrid Era (2010–2019)

Episodic adventure games from studios like Telltale and Quantic Dream, along with visual novels, brought branching stories to a mass audience. They dressed the branches up in 3D, with voice acting and cinematic camera work. The promise that *your choices matter* was sincere and partly kept. Underneath, though, the structure was still the branching tree. Plenty of players who loved these games could feel the edges of the form. Most choices made small cosmetic differences and only a handful made big ones. Sooner or later, everything funnelled back to the same trunk. "Clementine will remember that" became a meme for a reason.

Over in the tabletop world, online tools like Roll20 and Foundry made remote D&D workable. Live-streamed actual-play shows like Critical Role showed an enormous audience what *real* interactive narrative looks like: a human GM improvising in response to the players, with no pre-written branches and no false walls, producing stories nobody could have planned. That raised the bar for what interactive fiction's audience expected. Once you could watch actual-play sessions on YouTube, branching trees started to feel a bit dated.

## The AI Era (2020–present)

Large language models changed what's possible. For the first time, a system could understand natural language and write a fitting narrative response, drawing on patterns learned from enormous amounts of human writing instead of looking things up in a table. AI Dungeon was the first widely played example. Nick Walton, then a student at Brigham Young University, built the first version at a hackathon in spring 2019, and when an improved version came out that December, Aaron Reed's *50 Years of Text Games* records that it [drew 100,000 players within a week](https://if50.substack.com/p/2019-ai-dungeon). It was rough, mind you. The state drifted, and characters could forget their own names halfway through a plot that was busy dissolving into nonsense. Yet it proved something nobody had shown before: a story engine with no pre-written branches and no fixed vocabulary could still produce coherent fiction in response to anything you typed.

The implications are huge. Look at the three obstacles that each defined an era of interactive fiction:

- **The parser problem** disappears, because you can say anything
- **The branching problem** disappears, because the story isn't written in advance
- **The GM burden problem** disappears, because an AI can run a session without a human doing hours of prep

Losing all three at once isn't an upgrade. It's a change of category.

EchoQuest is built on that foundation. Its Game Master runs on Claude, a far more capable model than anything AI Dungeon had in 2019, and it sits inside a structured game engine that holds the world together where the AI alone would drift. Your HP, inventory, quests and relationships live in real game state, and the dice are rolled by the system, not invented by the storyteller. Still, we're early, and I'd rather be upfront about the limits. Long-term memory is imperfect, and consistency across many sessions takes real engineering. Meanwhile, the emotional depth of a skilled human author at their best remains unmatched.

I've felt each of those limits personally. On October 2 I found that memory summaries had got stuck: once a game passed a certain length, every turn re-summarised the first ten turns and nothing after them. Games that weren't saved on the server simply forgot their oldest turns once the history filled up. Both are fixed now, and the same day I moved character progress onto the server so you can pick up from any device. I also rewrote the GM's instructions that day, because they read like a technical spec and the narration was coming back sounding like one. I talk about these limits openly because pretending they don't exist would insult the form's future.

## What Comes Next

The path ahead points toward AI narrative that:
- Stays consistent across hundreds of sessions, with structured memory that doesn't fade
- Adapts its style and pacing to each player over time, learning which beats land for *you* in particular
- Generates original music and voices that keep step with the story in real time, and perhaps pictures one day
- Supports genuinely multiplayer adventures, where several players' choices collide through shared AI improvisation (that one's near the top of my own list)
- Reaches the emotional ceiling of human-authored fiction, not by mimicking it, but by being honest about what AI does well and sharpening those strengths

We're at the start of this arc, somewhere around the equivalent of 1978 for the parser era: a few interesting experiments shipped, with the medium's best work still ahead. The history of interactive fiction is full of moments when something unthinkable became ordinary within five years. I expect the next five to produce things that make our 2026 experiences feel as quaint as Zork feels now. Which era did you start in, by the way?

The best interactive fiction ever made hasn't been written yet. My bet is that an AI will write it, together with human creators, in response to the choices of a player who had no idea any of it was possible on the day they started.

**[Play the current state of the art →](/library)**
`,
  },
  {
    daysFromNow: 21,
    title: "How to Run a Horror RPG Campaign Without Any Visuals",
    excerpt: "How to run a horror RPG campaign with no visuals: sound, silence, slow escalation and a Game Bible that keeps the monster hidden until it counts.",
    content: `# How to Run a Horror RPG Campaign Without Any Visuals

On paper, horror looks like the worst genre to attempt without pictures. There's no flickering bulb, and no creature design to recoil from. Nobody can cut suddenly to a face pressed against the window either. I think that's backwards. Some of the most frightening stories ever told reached people through their ears alone. Radio drama managed it in the 1940s and podcasts managed it again in the 2010s (horror audiobooks, meanwhile, never stopped). Now AI-narrated audio RPGs are joining the club, and I'd put good audio horror up against most of what ends up on a screen.

The usual example is Orson Welles and "The War of the Worlds" in 1938. The legend of a nationwide stampede is mostly that, a legend: as A. Brad Schwartz explains in [Smithsonian magazine](https://www.smithsonianmag.com/history/infamous-war-worlds-radio-broadcast-was-magnificent-fluke-180955180/), newspapers blew the "mass panic" far out of proportion. Still, some listeners really did mistake the fake news bulletins for the real thing, and their anxious calls to police and newspaper offices were real too. Those Martians cost the Mercury Theatre nothing to build. The listeners built them, in their own heads, and that's the whole trick of this post.

What follows is a craft guide for building and running horror campaigns in EchoQuest. Some of it works for any audio storytelling. The rest is specific to interactive horror, where the player's own choices decide how deep the dread goes. And if horror isn't your genre, stick around anyway. The principles underneath are mostly about pacing and about what you hold back, so they'll sharpen any tense scene in any campaign.

I care about this one personally, by the way. The library has a gothic world and a cosmic-horror investigation. The GM's own instructions also say horror means "slow dread and uncertainty, never cheap jump scares," and the World Builder Wizard has a "Horror: dread and restraint" setting to match. So I've spent a fair bit of time thinking about what makes a scene land when nobody can see it.

## Why Audio Horror Works

Fear lives in the imagination. H. P. Lovecraft opened his long essay on the genre with a line horror writers still quote: "The oldest and strongest emotion of mankind is fear, and the oldest and strongest kind of fear is fear of the unknown" ([Supernatural Horror in Literature](https://www.hplovecraft.com/writings/texts/essays/shil.aspx)). Psychology has come round to something similar. In a 2016 review in the Journal of Anxiety Disorders, the psychologist R. Nicholas Carleton argued that fear of the unknown ["may be a, or possibly the, fundamental fear"](https://pubmed.ncbi.nlm.nih.gov/27067453/) underneath anxiety.

So the monster you can't see is almost always scarier than the one on screen. When a horror film finally shows you the creature, your brain files it away: "CGI wolf, cost $3 million, actors were on a set." Then the fear sags. The thing has been settled, given edges, turned into something known. Once it's known, it's manageable. And once it's manageable, it stops being terrifying.

Even Steven Spielberg ended up grateful for that. The mechanical shark in Jaws kept breaking down, so he had to work around it, and on Desert Island Discs in 2022 he called that his good luck, because ["it's a scarier movie without seeing so much of the shark."](https://www.smithsonianmag.com/smart-news/steven-spielberg-regrets-how-jaws-impacted-real-world-sharks-180981335/) Audio horror gets that broken shark for free, every single scene.

Now take a line of narration like "you hear something large moving in the dark beyond the reach of your lantern." Your brain produces the monster on the spot. Better still, it produces the exact version *you personally* find most frightening, built from your own fears and your own mental stock footage. No film budget can compete with that. A million-dollar prosthetic monster looks identical to every viewer. The unseen one looks different to every listener, because your subconscious has tailored it to scare *you* in particular.

I'd bet that blind horror fans have understood this for a long time. They've spent years listening to fear that their own imagination assembles for them, and they tend to be sharp critics of how audio horror is paced. Sighted listeners who come to it later often find out they'd been missing something all along. What they were missing was their own imagination's share of the fright.

## The Craft of Audio Horror

**Sound design is your biggest tool.** A cave drip. The sound of something wet, then a long silence. Details like these build dread before anything in the story turns threatening, so set the sound environment early and let it work before the plot catches up. In EchoQuest, the ambient layer picks its bed from how a location is described: a crypt or a catacomb gets the dungeon track, a drowned chapel gets the underwater one, and a thunderstorm gets the storm track I added back in May. Put simply, what you write in your Game Bible decides what plays under the narration. You can't script "two seconds of silence, then a single drip" (I'd love that too, honestly), but you can write the drip into the room's description so the GM has it to hand. The GM also chooses sound cues from a fixed set, including ones like "danger near" and "death nearby." I spent a chunk of May making those cues behave. The ambient bed now ducks underneath them so a warning sting isn't buried under rain, and two identical cues firing within 80 milliseconds of each other get trimmed to one, because a doubled sting sounds like a glitch rather than a threat.

**Withhold information deliberately.** Horror is the gap between what your player knows and what they suspect, so don't reveal too much. Let them hear something without explaining it. Let them find evidence of something terrible without ever showing the event. The blood on the wall is scarier than the killing it implies, and an empty room with three plates set for dinner is scarier than the family who used to eat there. Left alone, an AI narrator tends to over-explain. You can correct that by stating it plainly in the world's tone notes: horror in this world reveals itself through implication, not exposition. When I rewrote the GM's instructions on October 2, I built in the same instinct. It's told to hold things back and to plant small details now so it can pay them off turns later, because a reveal hits harder when the player half saw it coming.

**Make the mundane wrong.** The most effective horror isn't really about monsters. It's about familiar things behaving incorrectly. Freud wrote a whole essay on this in 1919, and the Tate's short guide sums up his idea of the uncanny as what happens ["when something can be familiar and yet alien at the same time."](https://www.tate.org.uk/art/art-terms/u/uncanny) So give your players these:

- An NPC who knows the player's name without being told
- A room that's slightly larger on the inside than the outside
- A child's laughter from a place where no child could be
- A clock that ticks at the wrong rhythm
- A road that bends differently each time you walk it

The wrongness should be small enough that the player can't be sure they aren't imagining it. Doubt is the texture of horror.

**Use silence.** Narrate a scene that ends on something alarming, then stop talking. Let the player decide what happens next. The silence after "you hear it stop moving" is more frightening than any follow-up description could be. EchoQuest's GM is already told to stop on the hook instead of summing things up, and after that nothing happens until you act; only the ambient bed keeps breathing underneath. I also learned the hard way that chosen silence and broken silence are very different animals. On May 16, I found the ambient soundtrack was quietly ratcheting itself down to nothing after about five turns, and later that month it was silent on mobile altogether. Accidental silence doesn't read as dread. It reads as a bug. Around the same time, I noticed choices were being announced to screen readers while the narrator was still mid-sentence, which trampled every ominous final line. Now the choices wait until the narrator has finished, so the last line gets its moment.

**Escalate slowly.** The player should feel a slow creep of wrongness for several scenes before anything openly threatens them. By the time the danger is explicit, the dread has already sunk in deep. The classic structure goes like this:

1. Scene 1 establishes the world as normal
2. Scene 2 introduces a single small wrong thing
3. Scenes 3 to 5 layer on more wrongness while the character tries to rationalise it
4. Scene 6 is when something undeniable happens

By scene 4, the person at the keyboard should be ahead of their character. They know something is terribly wrong, even though the character is still busy convincing themselves there's a normal explanation.

**Use the player's name.** Once your character has a name, the GM saying it where it shouldn't be said is one of the strongest horror moves around. Maybe an NPC who shouldn't know it says it, or it echoes from a place where nobody should be, or it arrives in a tone that feels slightly off. The GM reads your character sheet every turn, so the name is always within reach. It's the player's hook, too. Twist that hook and you twist the player.

**Don't be afraid of dark endings.** Horror that always ties up neatly isn't really horror. The best horror campaigns are willing to end somewhere other than triumph: a pyrrhic victory, perhaps, or a cost the character carries forever, or a survival that feels worse than the alternative. One honest note about EchoQuest here. Characters don't die permanently. However, since October 2, dropping to 0 HP brings a real setback: you might be captured, dragged clear by someone with an agenda of their own, robbed, or you wake hours later with a price to pay. That suits horror rather well, actually. So tell the GM up front that this campaign has darker endings on the table, and the world will lean into them when your choices warrant it.

## Building a Horror World in EchoQuest

When you write your Game Bible for a horror campaign (or answer the World Builder Wizard's questions), keep these in mind:

- **Define the central horror clearly for yourself, then reveal it to players gradually.** Write down what the threat actually is and what it wants. Its rules belong on the page too. The GM needs that to stay consistent. The player doesn't need it, and shouldn't get it, until the moment has been earned
- **Write specific sensory details for each location, because horror lives in specifics.** "The hospital corridor" is generic. "The hospital corridor where the linoleum has buckled in places that make you walk slightly off-rhythm, the fluorescents flicker every 14 seconds, and there's a faint smell of formaldehyde that gets stronger near the locked door at the end" is a place. Remember that blind and low-vision players hear every word of it, so smell, touch and sound pull more weight than colour ever will
- **Give your main antagonist or threat a distinctive sound before the player ever "sees" it.** The player should learn to dread that sound over several scenes. The first time they hear it, they shouldn't recognise it. By the third time, they should know they're in trouble before anything else has happened. EchoQuest's sound-cue library is a fixed set, so your monster's signature sound has to live in the narration. Describe it in your Bible, and the GM will put it into words
- **Establish what's normal in this world, so deviations register as wrong.** Horror needs a baseline. If everything is creepy from scene one, the player calibrates to it and nothing ever escalates
- **Set the content rating to Teen or Mature to allow genuine darkness.** The Wizard describes Teen as "some peril and conflict" and Mature as allowing graphic content. Family-rated horror exists too, but it has a lower ceiling

**Example opening:**

*"You've been assigned to document the decommissioned hospital on the edge of town. The front door is already open, which the records say it shouldn't be. Inside, the smell of antiseptic has been replaced by something older and wetter. Your torch throws shadows that seem to resolve into shapes a half-second after you look away. Your radio is playing static, and you don't remember turning it on."*

That's a complete horror opening with no monsters and no jump scares. It's just wrongness, piling up. Notice how specific the sensory details are: the door, the smell, the timing of the shadows, the radio. Each one is a small wrong thing on its own. And by the time the player decides what to do, they're already well inside the dread.

So, what's the scariest thing you've ever only *heard*? Build your campaign around that sound, and you're halfway there.

**[Start your horror campaign →](/library)**
`,
  },
  {
    daysFromNow: 22,
    title: "Crafting Moral Dilemmas: How to Make Players Truly Think",
    excerpt: "How to design RPG moral dilemmas where every option costs something: the four ingredients, six types that work, and what to do after the choice.",
    content: `# Crafting Moral Dilemmas: How to Make Players Truly Think

You know a campaign has worked when a player logs off still turning over a decision they made. Combat gets forgotten. Political intrigue fades, too. A genuine moral dilemma, though, the kind where they honestly weren't sure what the right answer was, tends to stick around. Players bring those moments up years later and argue about them with friends. Some people even write whole essays about a single choice. A few of those choices quietly shape how a player handles later stories, and once in a while, how they handle their actual life.

Sid Meier famously described games as "a series of interesting decisions," and in his [GDC 2012 talk](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions) he offered a handy test for spotting a dull one: if a player always takes the first option, the decision isn't interesting. Moral dilemmas are where that test bites hardest. A real dilemma is the most valuable thing a campaign can produce, and it's also the easiest to fake. The internet is full of "morality systems" that dress themselves up as deep choices when they're really checking whether you read the dialogue carefully.

This post is my guide to building dilemmas that aren't tests and can't be optimised, the sort that make a thoughtful player genuinely struggle. I use these principles when writing a Game Bible for a custom EchoQuest world, and they hold up just as well at a kitchen table with friends. I've had a personal reason to think hard about this, too. EchoQuest keeps real game state, story flags and NPC relationships included, so every choice a player makes has somewhere to live afterwards. That made me ask what a choice worth remembering actually looks like.

## The Anatomy of a Real Dilemma

A fake dilemma: "Do you save the village or let the bandits burn it?"

Nobody picks "let the bandits burn it." There's no tension at all. It's a good-or-evil test, and most players pass it without blinking. That's backed up by research, incidentally. When Andrew Weaver and Nicky Lewis recorded 75 people playing the first act of Fallout 3, they found that [most players made moral decisions and treated the game's characters "as if these were actual interpersonal interactions."](https://scholars.uky.edu/en/publications/mirrored-morality-an-exploration-of-moral-choice-in-video-games) People are kind to NPCs by default. So a good-or-evil fork barely registers, and worse, the player senses they're being tested and resents the question. Fake dilemmas also damage a campaign's tone, because they tell the player that the GM thinks moral choices have obvious answers.

A real dilemma: "The village Elder helped the bandits in exchange for protection of his daughter, who is now wanted by the crown. The bandits are gone now, but the daughter is hiding in the village under a false name. Do you turn the Elder in, which will legally protect the village from charges of harbouring criminals but condemn his daughter as well, or protect his secret, which means the crown will eventually find a different scapegoat in the village instead?"

Now there's tension, and no clean answer anywhere. Whatever the player chooses, they lose something, and they're choosing who pays. The Elder did something wrong. He also did it for love. The crown's law is legitimate, even though its punishment is wildly out of proportion. And the village deserves protection, but protection costs people. No algorithm solves this, which is exactly the point.

## The Four Ingredients

**1. Legitimate values on both sides.** Both options have to serve something the player actually cares about. If one option is clearly better, you haven't written a dilemma. You've written a puzzle with a right answer. The hardest dilemmas set two of the player's own stated values against each other. A character who prizes both loyalty and justice will be torn when those values demand opposite things. Likewise, a character who values mercy and also the safety of innocents will be torn when sparing one person puts many at risk.

**2. No third option (initially).** Players will always hunt for the clever solution that costs nothing. That's fine. Let them try, and let your AI GM honour creative attempts. In EchoQuest, the player can always ignore the suggested choices and type or say anything, and the GM is told to follow the player's creativity instead of herding them back onto a path. Still, the default state of the dilemma should offer no clean escape. If they find a clever third path that genuinely solves both sides, reward it wholeheartedly; that's their moment of virtuosity. Design the scenario assuming they won't, though, because most of the time, life-shaped problems don't come with third options. The player's job is to choose under real constraint.

**3. Personal stakes.** Abstract dilemmas ("save one person or five") are philosophy-class exercises. That one has a famous pedigree: the philosopher Philippa Foot introduced what became known as [the trolley problem](https://www.britannica.com/topic/trolley-problem) in 1967. Puzzles like it have a "correct" utilitarian answer and produce intellectual engagement, not emotional engagement. Neuroscience points the same way. In a 2001 brain-imaging study, Joshua Greene and colleagues found that [personal moral dilemmas engage emotional processing far more than impersonal ones](https://pubmed.ncbi.nlm.nih.gov/11557895/); pushing someone off a footbridge with your own hands lights up very different territory from flipping a switch. So dilemmas turn emotionally real when the people involved are named characters the player has already met and grown fond of. The Elder isn't "an Elder." He's the man who let the players sleep in his barn and told them about his late wife's apple pies. Twice, he slipped them rations they were too proud to ask for. Now they have to decide whether to turn him in. The same dilemma with strangers is barely a dilemma at all, but with the Elder it's a wound. (EchoQuest tracks every named NPC's standing with you on a scale from -100 to +100, with a short note on why it changed, so the GM remembers the barn and the rations too.)

**4. Irreversibility.** The decision should feel permanent. If the player can always undo it later, there's no weight to making it. The old gaming trick of "save before the choice, see both outcomes, keep the one you like" defeats moral choice entirely. I'll be honest about a tension in my own design here. In May I added single-step undo (the U key), because a misheard voice command or a misclicked choice shouldn't wreck someone's character. It only reaches back one turn, and the turn you undo has already used its AI credit. So it can technically rewind a dilemma, but my position is firm: undo is for slips, not regrets. If you undo a hard choice just to peek at the other branch, you've turned a dilemma back into a puzzle. The choice you made is the choice you made, and knowing that going in changes how you sit with the decision.

## Types of Moral Dilemmas That Work

**The lesser evil.** Both options cause harm, so which harm is more acceptable? This is the shape most people picture when they hear "dilemma," but it isn't the only one. The risk is leaving both harms abstract. Ground them in specific named people and they'll hit with full force.

**The betrayal.** Keeping a promise or a loyalty collides with doing the right thing. The player promised to protect the prince, and the prince turns out to be corrupt. Or the player swore an oath to the temple, and now the temple is asking for something the player believes is wrong. These are especially powerful because they put the player's relationship with their own integrity on the line.

**Certainty vs. hope.** A guaranteed bad outcome against a chance at a good one, with catastrophe as the risk. Accept the certain loss of one person's life, or gamble on saving everyone and possibly losing them all. Mathematicians can argue about expected value forever. Characters who care about the people involved can't.

**Justice vs. mercy.** Punishing someone who deserves it, or giving them grace they haven't earned. The villain has been captured and sits at the player's mercy. They've done unforgivable things, and the player can have them executed with full legal cover. They can also let them go, knowing that mercy might mean the villain hurts someone else, or might mean the villain becomes someone different. There's no formula for this one.

**The individual vs. the many.** One person's wellbeing set against a larger group's. "Sacrifice one to save many" is the classic frame. The subtler version comes when the "individual" is someone the player loves and the "many" stay faceless. Brains don't actually run utility calculations when love is on the table, and Greene's footbridge results suggest as much.

**The cost of staying.** This is a dilemma the player doesn't realise they're in. They keep backing an ally who's slowly turning into someone they don't recognise. Walking away might save the player but condemn the ally. Staying might condemn the player and barely help the ally. These are the slowest dilemmas of all, and sometimes they unfold across an entire campaign.

## Timing and Delivery

Dilemmas land hardest after investment. So don't put a moral choice in the opening scene, because the player hasn't met anyone yet and doesn't care. Plant the seeds early instead (introduce the characters, establish the clashing values) and bring the choice to a head once the player is emotionally committed. Ideally, a dilemma uses people the player has spent at least three or four sessions with. For more on making those people worth caring about, see my post on [writing compelling NPCs](/blog/writing-compelling-npcs-7-techniques-that-work).

Presentation matters as well. A great dilemma doesn't arrive with "you must choose." It arrives as consequences: the crown's investigators ride into town, someone recognises the daughter, and the Elder asks to speak with the player privately. The player realises they're at a crossroads through events, not announcements. As a result, by the time the GM asks "What do you do?", the player has been chewing on it for ten minutes already. EchoQuest's GM ends every scene on a direct question like that, which suits a slow-burning dilemma nicely.

One more thing: don't telegraph the right answer. If your campaign has tells (NPCs nodding approvingly when the player gets it "right"), players stop wrestling with the choice and start optimising for the reaction. The GM should treat both major options in a real dilemma with respect. Neither should be punished as obviously wrong, and neither should be celebrated as obviously right. Both should simply be lived with. When I rewrote the GM's instructions on October 2, I put "summing up or moralising at the end of a scene" on its list of things to never do, partly for this exact reason. A lecture after a hard choice ruins it.

Have you ever made a call in a game that you still aren't sure about? That itch is what you're designing for.

## After the Choice

The most important phase of a dilemma is what happens *after* the player has chosen. The world should react. If the Elder is turned in, he should be executed off-screen, and his daughter should turn up later, alone, with a face the player can't forget. If he's protected, he should keep finding small ways to show his gratitude, each one quietly reminding the player what they did. The choice doesn't end at the moment of decision. It ripples forward.

In EchoQuest, you set this up in your Game Bible by seeding the relevant relationships and tensions, and the GM builds toward the dilemma from there. Afterwards, the choice gets recorded in structured game state. Story flags hold the decision itself, and each NPC's standing (plus its little note) holds how they feel about it. On top of that, the GM reads a running campaign summary every turn. The GM's instructions are blunt about using all that: past choices shape what happens now, and old threads should come back "when it hurts or helps the most." Since October 2, character progress is also saved on the server, so a consequence can catch up with you even if you resume on a different device. The more clearly you establish who the players will care about and why those people's interests collide, the stronger the eventual choice will be. And the longer it'll linger once the session ends.

Want to test your dilemma-writing on a world that already exists? Pick one from the [Adventure Library](/library) and pay attention to who you start caring about.

**[Build your campaign →](/)**
`,
  },
  {
    daysFromNow: 23,
    title: "5 Classic D&D Campaigns That Inspired EchoQuest",
    excerpt: "Five classic RPGs and D&D campaigns that shaped EchoQuest's AI Game Master, from Planescape: Torment to Apocalypse World, and what each one taught me.",
    content: `# 5 Classic D&D Campaigns That Inspired EchoQuest

EchoQuest didn't come out of nowhere. It sits on top of roughly fifty years of tabletop RPG design: the campaigns that showed what collaborative storytelling could pull off, and the missteps that exposed its limits. Along the way, a handful of moments proved a narrative game can leave people properly shaken. When I rewrote the AI Game Master's instructions on October 2 so it would talk like a human GM, I wasn't designing in a vacuum. I was trying to bottle whatever made the campaigns I love actually work, and then asking which parts of that an AI could carry well.

So here are the five campaigns and games that shaped my thinking most directly. None of them involve AI, and all of them came long before EchoQuest. Even so, each one taught me something about how good narrative gaming feels, and those lessons live inside the GM's behaviour today. If you've played tabletop for years, you'll spot the inheritance. If you're new to RPGs, treat this as a half-decent reading list, since these are works worth knowing on any platform you end up playing.

## 1. Planescape: Torment (1999)

Strictly speaking, this isn't a tabletop campaign at all. It's a video game, and possibly the strongest argument ever made that story matters more than combat in an RPG. Black Isle's Planescape: Torment is famous for its central question ("What can change the nature of a man?") and for companions with real depth, history and moral knots. The protagonist, the Nameless One, wakes on a slab in a mortuary in a city that sits between planes of reality. He has no memory of who he is and no idea why he can't die. Most of the game is spent working out the answer, and that answer is harder and stranger than anything an RPG had tried before (or, arguably, since).

Its lead designer, Chris Avellone, has been candid about how unusual that was. Looking back in 2008, he said the [story and quest structure "ended up becoming the primary focus of design"](https://www.escapistmagazine.com/chris-avellone-talks-planescape-torment/), and he even admitted the combat suffered for it. He recalled testers reacting with "Man, this sure is different than the other RPGs that have come through here," which wasn't meant as a compliment at the time. Funny how that works out, isn't it?

What it taught me: a player character's backstory isn't flavour text. It's the engine of the story. The Nameless One's amnesia isn't a gimmick either; it's the central narrative mechanism, the lens every conversation passes through. And the companions you gather are nothing like stock fantasy archetypes. One is a floating, wisecracking skull. Another is a chaste succubus, and a third is a fallen angel working through something heavy. EchoQuest's habit of treating your backstory as an active story input comes straight from this game. The backstory you write sits in the character information the GM reads on every single turn. So don't write it as a bio. Write it as a knot of unresolved questions and let the world keep tugging at it.

## 2. The Curse of Strahd (1983 / 2016)

Ravenloft is D&D's original gothic horror setting, and Curse of Strahd is its crown jewel. That covers both the 1983 original module, I6, written by Tracy and Laura Hickman, and its 2016 reimagining for fifth edition. The newer version leaned heavily on the original authors. Chris Perkins of Wizards of the Coast said ["Without the Hickmans, this project would've died on the vine,"](https://www.cgmagonline.com/interviews/curse-strahd-interview-chris-perkins/) and noted that Tracy had been running the adventure for three decades.

What makes it special is Strahd von Zarovich himself. He's a villain with genuine pathos. His psychology hangs together, and his tragic past makes him sympathetic without excusing a single thing he's done. Yes, he's a vampire. He's also a man who fell for the wrong person, struck a desperate bargain, and has spent centuries paying for it while committing fresh versions of the same mistake.

What it taught me: your antagonist needs to be a person, not a symbol of evil. EchoQuest's GM is told that NPCs speak in their own voice with their own rhythm and grudges, that they hold strong opinions and say them plainly, and that they dodge questions and lie when it suits them. A villain run that way feels far closer to Strahd than to a generic dark lord. When you write a major villain into your own Game Bible, I'd add one more habit. Answer these questions about them before anything else: what does this person want, and why do they want it? Then ask what happened to them that made wanting it feel acceptable. Villains are terrifying when they're coherent.

## 3. Campaigns of Keith Baker's Eberron

Eberron is the D&D setting Keith Baker created for Wizards of the Coast's Fantasy Setting Search in 2002 (it was published in 2004). That contest was a monster in its own right. Wizards' Bill Slavicsek later wrote that the company was ["inundated with more than ten thousand submissions."](https://keith-baker.com/eberron-bill-slavicsek/) Baker's entry won, and it's built squarely on moral ambiguity.

The premise goes like this. A hundred-year war has just ended in a peace treaty that nobody really trusts. Good nations did terrible things during the war, and the "heroic" factions have blood on their hands. Nobody's clean, and that includes the dragonmarked houses and the church as well as the nations themselves. The whole setting is full of people trying to live with choices everyone made and nobody wants to own up to. Baker has explained the thinking himself: film noir was a major influence, and in his words, ["It shouldn't always be easy to decide who the villain is in a scenario… or if killing the villain will solve a problem."](https://keith-baker.com/eberron-flashback-good-and-evil/)

What it taught me: faction design without clean heroes creates the most interesting political choices. Once players know every faction has some legitimacy and every faction casts a shadow, the question stops being "which side is good?" It becomes "what kind of person am I going to be in a world with no clean side?" EchoQuest doesn't have a separate faction engine. Factions live in your Game Bible, and when you upload one, the parser pulls them out along with the world's key tensions for the GM's briefing. My advice for writing them is pure Eberron. Give every group something legitimate it wants that clashes with what the others want, plus one thing it won't do. Then make sure none of them is presented to the player as the canonical good guys. Baker's writing convinced me that grey is more interesting than black and white, and that a GM's job is to honour the legitimate parts of every faction while still letting players pick a side.

## 4. Matt Mercer's Critical Role (2015–present)

Critical Role didn't invent anything new mechanically. What it did was show millions of people that watching other people play D&D could be genuinely moving television. Moments like Percy's deal with Orthax, Mollymauk's death, Vex's resurrection and the second campaign's Traveler reveal landed hard with viewers who'd never touched a d20. The scale is hard to overstate: in 2019, fans put [$11.4 million into a Kickstarter for an animated Vox Machina project](https://www.tubefilter.com/2019/11/05/amazon-prime-video-critical-role-kickstarter-legend-of-vox-machina/) that had asked for $750,000, making it Kickstarter's most-funded film project at the time. The show's success reset expectations for what a session could feel like. People who came to D&D after Critical Role expected long-arc emotional payoffs and character moments that earned real tears, with consequences that kept compounding over hundreds of hours.

What it taught me: the emotional power of RPG storytelling isn't reserved for the people at the table. Good performance and careful pacing can move an audience, too. That shaped how I think about EchoQuest's narration. It should be worth hearing as a story, not merely as a game. The GM is told to narrate the way you'd talk across a kitchen table at midnight, and to vary its sentence length on purpose. What I'm after is the care of a performer rather than the efficiency of a referee. The voices matter as much as the words. In late May I found that NPC voices weren't switching at all, because characters' lines weren't being woven into the narration properly, so every character spoke in the narrator's voice. Fixing that, and matching NPC voices by gender across the whole voice catalogue, made scenes sound like a cast instead of a lecture. Sessions should sound like a story being told, because at their best, that's exactly what they are.

It also taught me something about long-arc patience. Critical Role's most devastating moments often pay off setups from a hundred hours earlier. I won't pretend an AI GM has perfect recall across forty sessions. It doesn't. What it does have is a running campaign summary and NPC relationships that persist. It also has an instruction I'm rather fond of: plant small details now and pay them off turns later, because a reveal hits harder when the player half saw it coming. That's how a seed from an early session can still bloom much later.

## 5. Apocalypse World (2010)

Vincent and Meguey Baker's Apocalypse World is a tabletop RPG about surviving after the end of the world, but its real contribution was mechanical. The "Powered by the Apocalypse" system has moves trigger from the fiction rather than from declared actions, and it gives the GM (called the MC) an agenda: make Apocalypse World seem real, make the players' characters' lives not boring, and play to find out what happens. The Bakers openly invited other designers to build games on that engine, and as Shannon Appelcline's history at [Designers & Dragons](https://www.designers-and-dragons.com/2021/11/02/the-evolution-of-the-apocalypse-a-system-history/) traces, it went on to seed a whole generation of indie design. Its core insight is that the GM doesn't need to plan encounters. The GM needs to create situations and ask provocative questions. After that, the job is responding honestly to whatever the players do.

What it taught me: the GM's role isn't running encounters, it's asking hard questions and building situations, then letting players answer them. EchoQuest's GM is built around that idea: set up situations with real stakes, then respond honestly to the player's choices. I didn't paste Baker's "play to find out what happens" into the prompt word for word. The instruction I did write is a close cousin, though: follow the player's creativity instead of forcing them back onto a path. The GM that comes out of it behaves much more like a curious, present GM than a dungeon master grinding through prepared content. It isn't even allowed to decide whether you succeed; a real roll does that, and the GM narrates whatever comes up.

PbtA's split between "soft moves" (foreshadowing, a warning) and "hard moves" (consequences that land) shows up in EchoQuest's pacing too, though I never borrowed the vocabulary. Foreshadowing happens constantly, in those small planted details and the hooks that end each scene. Hard consequences come less often and hit harder: since October 2, dropping to 0 HP means a real setback, like being captured, or waking hours later with a price to pay. In Apocalypse World, a player's carelessness is what gives the MC licence for a hard move. Here, it's risky actions: they trigger a real roll, and a run of bad ones is how you end up at 0 HP. That rhythm is what keeps the world feeling alive without flattening the player.

## What These Five Have in Common

Look at the list together and a through-line appears: every one of these works trusts its players. Planescape trusts them with a strange, melancholy world. Curse of Strahd trusts them with a villain whose motives matter. Eberron trusts them to choose sides in a world without clean ones. Critical Role trusts them to sit through hours of slow character development. And Apocalypse World trusts them to build the story alongside the GM instead of being led through it.

EchoQuest is built on that same trust. The AI Game Master isn't trying to deliver a pre-written experience. It's trying to stay present and attentive to a player who is co-authoring a story nobody could have planned. That's the inheritance. I didn't invent the philosophy; I translated it into something an AI could carry, and I keep refining it as I learn what works. The October 2 rewrite was simply the latest pass, and it won't be the last. If you want the longer story of how tabletop habits made it into the GM, I wrote about that in [From Tabletop to AI](/blog/from-tabletop-to-ai-how-echoquest-reimagines-dd).

Which campaign shaped the way *you* play? I'd honestly love to know which one I've missed.

**[See EchoQuest's official campaigns →](/library)**
`,
  },
  {
    daysFromNow: 24,
    title: "Solo RPG vs. Group Play: The Case for Playing Alone",
    excerpt: "Why solo RPG play deserves respect: no scheduling headaches, no audience, pacing that fits you, and an honest look at what you give up by playing alone.",
    content: `# Solo RPG vs. Group Play: The Case for Playing Alone

For most of tabletop RPG history, "playing alone" meant you weren't really playing. The assumption was baked right into the name: *role-playing game*, with the stress on *game*, and games needed other people. Solo RPG was a niche within a niche. You had journaling games like *Thousand Year Old Vampire*, oracle decks for dungeon crawls that happened entirely in your head, and players gamely running both sides of a conversation. A small, devoted solo community existed, mostly built on oracle systems where dice and tables generated the world's replies. Still, most people saw it as a workaround for anyone who couldn't find a group, not as a proper way to play.

Here's the funny part. Solo play is nearly as old as the hobby itself. As Jimmy Maher recounts at [The Digital Antiquarian](https://www.filfre.net/2016/02/friends-of-the-wasteland-the-legacy-of-flying-buffalo/), Flying Buffalo published *Buffalo Castle*, the first Tunnels & Trolls solo adventure, back in May 1976. A few years later, Fighting Fantasy took the same idea to bookshop shelves with *The Warlock of Firetop Mountain* in 1982, and that series went on to sell well over 15 million books. So solo players were there all along. They just didn't get much respect.

AI changes the picture completely. EchoQuest is built from the ground up for solo play (multiplayer is on my wish list, but solo came first, on purpose), and so are a growing number of other narrative platforms. My argument in this post is simple. Solo play with a capable AI GM isn't a fallback. It's a distinct experience with strengths of its own, and it suits a different kind of player with a different relationship to story. Group play remains wonderful and irreplaceable for the people who can manage it. Solo play deserves to be taken seriously on its own terms.

## The Scheduling Problem, Honestly

Let's start with the obvious one. The biggest single reason D&D campaigns die is scheduling. Getting four to six adults with jobs and families into the same room (or the same video call) at the same time, every week, forever, is genuinely hard. Maher calls it ["that perennial problem of so many RPG players, then and now: the need to reconcile busy lives with getting together on a regular basis with friends to play."](https://www.filfre.net/2016/02/friends-of-the-wasteland-the-legacy-of-flying-buffalo/) Indeed, that exact problem is why Buffalo Castle was written in the first place. The story is so familiar it's practically a genre of its own: the campaign was great, then someone moved, then someone had a baby, then someone got promoted, then the group tried to carry on with a new player, and then it just... stopped. Most campaigns die before the story finishes. Plenty never start, because assembling the group is too hard in the first place.

Solo play wipes that problem out. You play when you want and stop when you need to. A twenty-minute session before bed is a complete experience, and so is a four-hour Saturday afternoon. The campaign doesn't wait for everyone else to be free. It waits for *you*, which in practice means it doesn't wait at all.

That one change transforms where RPGs fit in someone's life. Instead of a fixed weekly appointment, the game slips into the gaps. I designed EchoQuest's saving around exactly that kind of life. Since May it auto-saves every five turns, and there's a manual Save button for when the kettle boils mid-scene. Then on October 2, character progress moved onto the server, so you can start a session on your phone on the bus and pick it up on your laptop that evening. Even the free tier gives you 60 AI turns a day, which is plenty for a short evening chapter.

## The Performance Anxiety Problem

Tabletop RPGs ask you to perform in front of people. You improvise dialogue and make decisions out loud, sometimes while playing a character who's nothing like you. For lots of players that's precisely the appeal: the joyful silliness of voicing a noble paladin while sitting in your kitchen with three friends and a bowl of pretzels. For many others, it's a real barrier. That includes introverts and people with social anxiety, along with plenty of neurodivergent players and anyone who's simply new to the hobby. This isn't a small group, either. The US National Institute of Mental Health estimates that [7.1% of US adults had social anxiety disorder in the past year, and 12.1% will at some point in their lives](https://www.nimh.nih.gov/health/statistics/social-anxiety-disorder). That hesitation isn't laziness or aloofness. Pushing through it takes real social effort, and a lot of people who would love RPGs never start because they can't get over that hump.

Playing alone with an AI GM removes the social pressure entirely. Nobody is judging your roleplay or tapping their foot while you take a minute to think. And nobody will remember the time you called the villain by the wrong name. The AI doesn't roll its eyes. It doesn't have a taste in characters that clashes with yours, either. It's patient in a way that even the most generous human group can't quite sustain across hundreds of hours.

A few of my own design choices lean into this. EchoQuest never puts a timer on your turn; the story simply waits. When you speak an action, you see the transcript and confirm it before anything reaches the GM, so a mumbled sentence never goes out without your say-so. And since May there's a single-step undo on the U key for the moments you fumble a choice. None of that would matter much at a lively table. Alone, at midnight, it's the difference between relaxing and bracing yourself.

My real hope, and a big reason solo is EchoQuest's default, is that the privacy lets people try characters they've been holding back. Characters with real vulnerabilities, say, or with traits and quirks the player would be embarrassed to perform in public. For some people, the privacy of solo play unlocks a creative range that group play simply can't.

## The Pacing Problem

Group play has a pacing problem baked in. Five people bring different energy levels and different interest in the current scene. On top of that, someone always has to leave early. The player who wants twenty minutes exploring an NPC's psychology is forever in tension with the player who wants to get to the next fight. So the GM mediates constantly, often by averaging the group's preferences, and the result is a session that doesn't fully satisfy anyone.

Solo play is paced perfectly, for you specifically. Spend as long as you like interrogating the reluctant blacksmith. Skip briskly through the scenes that bore you. The story moves at your tempo and adjusts as you go. If you're tired and want a quiet scene, lean into that. If you're wired and want a fight, just ask for one, because you can type or say anything you like. EchoQuest lets you tune the delivery itself, too: the [ and ] keys nudge the narration speed, and Space pauses it. I've also spent a lot of effort cutting dead air. Since October 2, skill checks resolve in the same turn, and narration starts speaking while the GM is still writing its reply. On premium voices, the next clip now loads while the current one plays. Group play has to compromise across many people's tempos. Solo play doesn't.

This is great for new players who are still working out what kind of RPG they enjoy, as well. Your first dozen sessions are an exploration of what you find fun. Group play puts social pressure on that search, so you may end up playing the game your group plays instead of the one you'd pick. Solo play lets you discover your taste without negotiation. What would you play if nobody else got a vote?

## The Privacy of Choice

There's a category of choice that solo play handles better than group play, and it's worth naming. Some moral choices come easier when you don't have to justify them out loud. A character who chooses cowardice, or self-preservation over heroism, or a quiet betrayal: those choices play out differently in front of an audience than they do alone. At a table, players often default to the socially celebrated option because everyone's watching. In solo play, you make the choice your character would actually make, then sit with the consequence in private. The RPG becomes a different kind of mirror.

Your conscience doesn't take the night off just because you're alone, mind you. When researchers watched 75 people play the opening of Fallout 3 by themselves, [most treated the characters they met "as if these were actual interpersonal interactions,"](https://scholars.uky.edu/en/publications/mirrored-morality-an-exploration-of-moral-choice-in-video-games) and behaving badly made them feel guilty. Solo play removes the audience. It doesn't remove the weight. (If that idea interests you, I wrote a whole post on [crafting moral dilemmas](/blog/crafting-moral-dilemmas-how-to-make-players-truly-think).)

I won't claim solo play is more "honest" than group play. Both produce real characters and real stories. The texture of the decisions is different, though. Solo play favours interiority, and group play favours performance. I'd go further and say that's exactly why solo suits the darker, quieter stories so well.

## What You Lose

Group play produces something solo play genuinely can't: the surprise and delight of other players doing unexpected things. The moment a fellow player makes an inspired call that solves a problem in a way nobody planned is irreplaceable. So are the in-jokes that pile up over a hundred hours of campaign. The shared memory of a campaign, meaning the stories you tell each other years later and the running references that turn into a private language between friends, needs co-participants to exist at all.

Solo play also doesn't produce the bonding that comes from regular tabletop sessions. For many people, the friends they made through their D&D group are among the longest-running relationships in their lives. That matters more than it might sound. The WHO's Commission on Social Connection reported in 2025 that [1 in 6 people worldwide is affected by loneliness](https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death). A good table is a real thing, and AI doesn't substitute for it. EchoQuest doesn't claim to. If you have a group that works, honestly, keep it.

Solo play is different. Not lesser, just different. It's a more private, introspective experience, closer to reading a novel than to watching a film with friends. Both kinds of story serve real needs, and they aren't the same needs.

## Who Solo Play Is For

- Players who love RPGs but can't commit to a regular group
- Players who want to explore a character or setting privately before bringing it to a group
- Players who are new and want to learn without social pressure
- Players who find group dynamics exhausting
- Players whose schedule is unpredictable and who would always be the one cancelling
- Players who travel often and lose tabletop continuity
- Players who simply prefer solitary creative experiences
- Players who want to play darker or more vulnerable stories that don't fit a typical group dynamic

Every one of these is a valid reason. EchoQuest is built for all of them, and I treat solo play as the primary mode rather than a watered-down version of "real" RPG play. If group play works for your life, that's wonderful, and EchoQuest isn't trying to replace it. If it doesn't, solo play is right here, and it's enough on its own. So, when did your last campaign quietly stall? Maybe it's time to pick the story back up without waiting for anyone. For a practical walkthrough, my guide to [playing D&D solo with an AI Dungeon Master](/blog/how-to-play-dd-solo-with-an-ai-dungeon-master) covers the nuts and bolts.

**[Start your solo adventure →](/library)**
`,
  },
  {
    daysFromNow: 25,
    title: "The World Builder Wizard: A Complete Guide for Creators",
    excerpt: "A step-by-step guide to EchoQuest's World Builder Wizard: what each question does, how Claude's suggestions help, and tips for a world that plays well.",
    content: `# The World Builder Wizard: A Complete Guide for Creators

The World Builder Wizard is EchoQuest's guided way to make a world of your own, and it's included on both paid plans. Storyteller members get one private world. Creator members can build as many as they like and publish them to the library. Instead of writing a Game Bible from scratch, and fretting over whether you've covered the right things in the right depth, you answer ten short questions. Claude chips in with ideas as you go. When you finish, your answers become the briefing the AI Game Master reads before every turn. The questions cover much of the same ground as my [Game Bible template post](/blog/how-to-write-a-game-bible-the-world-builders-template), just in bite-sized pieces.

This post walks through what the Wizard asks and what each answer actually does, with practical advice for getting the most out of every step. I've grouped the ten questions into the seven jobs they do, so the numbering below follows those jobs rather than the on-screen step counter. Even seasoned worldbuilders often find the Wizard quicker than writing a Bible by hand, because you only have to supply the spark. I kept the steps short on purpose. The W3C's accessibility tutorial on multi-step forms recommends exactly that. It advises splitting long forms into ["a series of logical steps or stages,"](https://www.w3.org/WAI/tutorials/forms/multi-page/) because that "helps make long forms less daunting," and telling people how far along they are at each step.

That second part mattered a lot to me. The Wizard reads each question aloud ("Step 3 of 10...") and moves focus to it, so a screen reader user always knows where they stand. You can type your answers or press V and speak them. R repeats the question. The arrow keys move you back and forward, and Enter works for forward too. I'll confess the voice part had a rough patch. In September I found the microphone was blocked on EchoQuest's own pages, so pressing V did precisely nothing, here and in play. That one's fixed now.

## Step 1: The Pitch

The Wizard first asks for your world's name ("a short, evocative title"), and then comes the question that matters most: **"Describe your world in one sentence."**

This isn't fluff. A good one-sentence pitch carries a genre and a central tension, and the tone usually comes along for free. Compare:

- Weak: "A fantasy world with magic and kingdoms."
- Strong: "A dying empire where the last surviving wizard must choose between saving the institution that oppressed her or letting it collapse and rebuilding from its ashes."

The second sentence tells you the genre (fantasy) and the central tension (preservation vs. revolution). It also gives you the protagonist's situation, a wizard with a complicated relationship to power, and the moral core, which is complicity vs. justice. Everything else in your world flows from that. The pitch goes straight into the GM's briefing as the world's premise, and it also feeds Claude's suggestions in later steps. So a vague pitch produces a vague world. Give it specifics, and you get a world with strong opinions.

If you're stuck, write the worst possible version of your pitch first, then revise it. Getting from "a generic fantasy thing" to something specific is easier than starting from a blank box. You also don't have to ask for help: on each written step, Claude offers three ideas of its own, shown as buttons you can pick. Accept one, or treat all three as something to argue with. Honestly, rejecting a bad suggestion is often the quickest way to figure out what you actually want.

## Step 2: Genre and Tone

This is where the Wizard asks the most questions, and each one shapes how the GM narrates and how it scales stakes and consequences:

- **Genre** is free text, so you're not stuck with a dropdown. The Wizard's own examples are "dark fantasy, sci-fi noir, post-apocalyptic, cozy mystery"
- **Setting** asks where and when the story takes place: a region, an era or one memorable location
- **How the GM should run scenes** offers seven styles: cinematic and vivid, rules-light and breezy, crunchy with mechanics, mystery with slow reveals, horror with dread and restraint, political intrigue, or adventure with a quick tempo
- **Content rating** is Family, Teen or Mature, and the GM honours it at all times
- **The narrator's tone, in three words**, with examples like "hushed and watchful" or "deliberate and dry"

Because genre and tone are separate answers, you can combine them freely. A fairy-tale horror world plays nothing like a gritty one. Likewise, a comedic sci-fi campaign feels completely different from a political-intrigue sci-fi campaign, even when the surface details match. Don't be shy about odd pairings. My hunch is that the most memorable worlds will come from combinations nobody expected to work. What's the strangest pairing you'd try?

## Step 3: Factions

I'll be straight with you here: the Wizard doesn't have a separate factions question. It's built to get you playing in minutes, so factions ride along inside your pitch and setting answers. That's still worth doing properly, because whatever you write there lands in the GM's briefing, and Claude's suggestions draw on it too. So put the conflict right into the setting. "A salt-mining city split between the Brine Guild and a cult of the drowned saint" gives the GM two factions to play with before you've even started.

For each group you name, it helps to know:

- Who are they?
- What do they want right now?
- What are they willing to do to get it?

Make sure at least two of them want things that can't both happen. Those clashes generate the best story moments. Peaceful factions that never collide, on the other hand, don't produce stories at all.

The most important thing to decide is what each faction *won't* do. A faction's red line, the thing they'd never compromise on, is what makes them feel principled rather than merely greedy. When players eventually push a faction toward that line, that's where the drama comes from. If it fits in a phrase, add it to your setting answer. And if you want a full roster with every faction's goals spelled out, a Game Bible upload is the better tool: the parser pulls each faction out separately for the GM.

## Step 4: Key NPCs

Same honesty applies here. There's no dedicated NPC form in the Wizard. Characters come alive in play instead: the GM tracks how each named NPC feels about you on a scale from -100 to +100. And since the Wizard is a paid-plan feature, your NPCs get distinct premium voices, matched by gender and kept consistent across sessions. You can still seed the two or three characters your player meets early, by naming them in your opening scene or your setting answer. For each one, it pays to know:

- Name and role
- One specific goal
- One secret
- One distinctive habit or speech pattern

The secret and the habit matter most, because they're what make a character feel real when the GM plays them. Secrets don't need to be long, either. Mike Shea, the GM behind Sly Flourish, recommends writing them ["tweet-sized"](https://slyflourish.com/sharing_secrets.html), sometimes just a few words, and not deciding in advance how the players will uncover them.

A few NPC techniques I'd steer you toward. First, favour physical mannerisms over emotional descriptions. EchoQuest is heard rather than seen, and the GM is told to carry everything through sound, touch, smell and action, so "she taps her ring against the bar when she lies" plays far better than "she seems nervous." Second, give someone an unexpected competence, like the innkeeper who used to be a sailor. Third, include at least one NPC who actively wants something from the player rather than just having information to dispense.

## Step 5: The Opening Location

**"Describe the opening scene in one or two sentences."** This one's required. Where does the player character find themselves, and what's happening as they arrive? Is there an immediate problem, or an opportunity? The opening scene anchors the whole campaign. It becomes the world's first location, and it stays in the GM's briefing for the whole campaign, so its texture tends to carry forward into everything that follows.

It also picks your soundtrack. EchoQuest chooses the ambient bed for that first location from the words you use, so "a market square at dawn" brings in the market track, and a scene that mentions a forge or a thunderstorm gets the forge or storm tracks I added in May. That's a good reason to write the sound into the scene. If there's a particular opening line you love, put it in, but treat the scene as a brief rather than a script. The GM will make it its own.

## Step 6: Constraints and Rules

**"Name one hard rule of this world the game master must respect."** The Wizard's examples are "no firearms, magic always costs blood, the dead never speak." Whatever you write goes into the GM's briefing marked as a rule it must never break, and it's what keeps the story from wandering outside your world's internal logic. Claude will suggest three rules that fit your pitch if you'd like a starting point.

You can, of course, write your own, and this is where worlds start to feel unmistakably yours. "Music has been illegal for fifty years and is still treated as dangerous." "Iron is rarer than gold here." "The dead come back as crows and watch their old families." Pick the one with the most story in it. Brandon Sanderson's well-known first law of magic says ["an author's ability to solve conflict with magic is DIRECTLY PROPORTIONAL to how well the reader understands said magic,"](https://www.brandonsanderson.com/blogs/blog/sandersons-first-law) and that applies to any rule. A clear limit gives players something to plan around and gives the GM something to honour. The suggestions are starting points, not endpoints.

The very last question is simple: what's your character's name? Then you're nearly done.

## Step 7: Review and Launch

Before you finish, you can step back through any answer with the Back button or the left arrow and change it. On the final step you can also paste a cover image link. Leave it blank and EchoQuest generates cover art for you automatically. Then the Wizard compiles everything into your world and takes you straight into character creation. The world is immediately playable, and it starts out private.

From then on, it lives on your My Worlds page. There you can play it or delete it, and you can generate a fresh cover whenever the old one stops fitting. I'll be honest that the Wizard doesn't yet let you reopen a world and edit individual answers. If a playthrough shows you a better pitch or a sharper rule, rebuilding takes only a few minutes, and Storyteller members can delete their world to free up the slot. For bigger, longer-lived worlds that you expect to keep revising, a Game Bible upload is the better home.

Creator members can build as many worlds as they want and publish any of them to the library for other players to discover, with the cover art and your one-sentence pitch as its description. You can unpublish whenever you like. Creator members also get analytics for their worlds (sessions, total turns, unique players and a 30-day trend), which is the most honest feedback a world can get. Ready to try it? The Wizard lives at [Create a World](/worlds/new/wizard), and the [Adventure Library](/library) is full of examples to steal ideas from.

**[Upgrade to Creator →](/)**
`,
  },
  {
    daysFromNow: 26,
    title: "Storytelling for Mental Health: The Therapeutic Power of RPGs",
    excerpt: "What the research really says about RPGs and wellbeing, how strong that evidence is, and why I will never call EchoQuest therapy.",
    content: `# Storytelling for Mental Health: The Therapeutic Power of RPGs

Have you ever closed a long RPG session and felt strangely lighter, as if some knot had loosened while you were busy haggling with a smuggler? You're not imagining it. Researchers in psychology and social work have spent the last decade or so poking at exactly that feeling, and they've started to put names to it. Players have suspected for ages that those hours inside a story were doing something useful. Now there's a young but growing body of research trying to pin down what, precisely, that something is.

I want to walk through that research slowly, because this is a topic where sloppy claims do real harm. So I'll cover what's actually been studied and how solid it is. Then I'll get into why narrative play seems to help, and where an audio-first game like EchoQuest fits for people who've never had a seat at a tabletop. First, though, the disclaimer I mean most: I make a game. I'm not a clinician, and nothing in this post is medical advice. EchoQuest is not therapy, either, and it doesn't treat anything. Even so, the wellbeing side of narrative play is real enough that I keep it in mind every time I design something.

## What the Research Shows

Let me start with an honest picture of the evidence, because the internet tends to inflate it. The broadest recent overview I could find is a [2024 scoping review in Psychology Research and Behavior Management](https://www.dovepress.com/a-scoping-review-of-tabletop-role-playing-game-ttrpg-as-psychological--peer-reviewed-fulltext-article-PRBM) by Yuliawati, Wardhani and Ng. They gathered 51 papers on tabletop RPGs as a psychological intervention, all published between 2013 and 2023. Across those papers, researchers reported better social skills and empathy, lower social anxiety, room to explore identity and some relief from stress. The authors are blunt about the weak spots, however. Most of the work is qualitative, the quantitative studies mostly lean on small samples, very few use experimental designs, and nearly everything revolves around Dungeons & Dragons in Western countries.

An earlier [rapid evidence assessment by Henrich and Worthington](https://www.tandfonline.com/doi/full/10.1080/15401383.2021.1987367) reached much the same verdict. They searched seven databases up to September 2020, kept 13 studies about D&D specifically, and described the results as promising but preliminary. Two of their findings made me smile, though: there's no single "D&D personality type", and they found no link between the game and maladaptive coping. That's a quiet rebuttal to the moral panic that dogged the hobby in the 1980s.

Then there are the individual studies, and they're small. In one, published in Social Work with Groups, [Varrette and colleagues ran five RPG groups for 12 weeks](https://www.tandfonline.com/doi/abs/10.1080/01609513.2022.2146029) with 25 adult volunteers. Three groups wove cognitive behavioural therapy techniques into play, and two were ordinary games. Every group reported less anxiety on average, yet only one of the therapeutic groups showed a drop in social anxiety, and everyone's social skill scores went up. In another, a team at the University of Plymouth took [eight autistic adults through a six-week online D&D campaign](https://researchportal.plymouth.ac.uk/en/publications/a-critical-hit-dungeons-and-dragons-as-a-buff-for-autistic-people/). Participants described the game as a place to connect without masking, and several said they were trying to carry parts of it into daily life.

Therapists have leaned on role-play for decades, mostly through improvisational techniques and narrative therapy. Indeed, Henrich and Worthington point out that therapeutic roleplay in general is already well established; it's D&D in particular that's still under-studied. Meanwhile "therapeutic D&D" has been getting more formal. [Game to Grow](https://gametogrow.org/), a Seattle-area nonprofit set up in 2017 by two people trained in therapy, ran therapeutic game groups for years and built Critical Core, a therapeutic RPG starter box that it says has reached more than seven thousand therapists, educators and families. In 2025 it announced it was winding down and handing its programmes to the STAR Institute. On the clinical side, a 2025 paper in Behavioral Sciences called [Mastering Your Dragons](https://pmc.ncbi.nlm.nih.gov/articles/PMC12023950/) described five individual cases and three groups where therapists used tabletop RPGs, and its authors are careful to call their results "preliminary indications rather than definitive conclusions."

So no, this isn't a fringe curiosity anymore. It's a peer-reviewed field that pulls in people from psychology, education, social work and occupational therapy. It's just a young one. My stance? The signal is consistent and encouraging, and I'd distrust anyone who tells you it's proven.

## Why Stories Help

Narrative therapy grew out of the work Michael White and David Epston did in the 1980s, and its central idea is lovely in its simplicity. People understand their lives through stories, so if you change the story, you can change the life. One of its signature moves is "externalising" the problem, summed up in White and Epston's line that ["the person is not the problem; rather the problem is the problem."](https://narrativeapproaches.com/making-trouble-for-problems-therapeutic-assumptions-and-research-behind-the-narrative-practice-of-externalizing-conversations/) Once you hand a problem to a character, you can look at it from a few steps back, which is nearly impossible while you're living it head-on. The grief turns into the character's grief. The fear becomes the character's fear. And you get to examine both at arm's length.

That isn't avoidance. Honestly, it's closer to the opposite: a structured way of approaching hard experiences that plain introspection often can't manage. Plenty of people find it impossible to think clearly about something that happened to them. Ask that same person about a character in a similar spot, though, and you'll often get a thoughtful and surprisingly gentle answer. The character works like a doorway, and the doorway leads back to the person. Whatever gets worked out inside the story stays with them after the session ends.

Playing someone who faces fear, loss, failure or a knotty moral choice, and practising your way through those moments, may build real capacity to handle them. The idea rhymes with what you'll find in exposure therapy and in theatre training, and it's also why writing fiction can be such a surprisingly useful kind of journaling when life gets heavy. Stories let us rehearse.

## The Specific Benefits

**Anxiety reduction.** A good session mixes social contact and creative problem-solving with deep immersion, and that combination can tip you into what the psychologist Mihaly Csikszentmihalyi called "flow". One hallmark of flow is that you lose your self-consciousness for a while. The part of your mind that keeps grading how well you're doing at being a person goes quiet, simply because it's busy with something else. For some anxious players, a session may be one of the rare places that inner critic shuts up for an hour. Still, keep the Varrette study in mind: anxiety fell in every group, and that's encouraging, but 25 people is a small room.

**Empathy development.** Playing characters unlike yourself, and playing them in conflict with other characters unlike yourself, exercises perspective-taking. A [2016 study in the American Journal of Clinical Hypnosis](https://pubmed.ncbi.nlm.nih.gov/26675155/) asked 127 fantasy role-players to fill in the Davis Interpersonal Reactivity Index, a standard empathy questionnaire. They scored significantly higher than a comparison group, and their empathy scores rose alongside how easily they got absorbed in experiences. However, that's a snapshot. It can't tell us whether the games build empathy or whether empathetic people are drawn to the games. My bet is a bit of both, since practising predicting and inhabiting other minds probably makes you better at it. But that's my opinion, not a finding.

**Identity exploration.** RPGs give you a low-stakes place to try on other versions of yourself. Which character you pick, and how you play them, often reveals something about your own values and wants. Queer players have written for years about RPGs being the first place they got to play a character of their actual gender or orientation, sometimes long before they came out in daily life. Research is catching up there too. In a [2025 paper in the Journal of Homosexuality](https://www.tandfonline.com/doi/full/10.1080/00918369.2024.2320242), Van Wert and Howansky interviewed ten transgender and gender non-conforming people, then surveyed a hundred more. Players talked about character customisation and about RPGs as safe spaces, and the ones who played games with highly customisable characters were more likely to say RPGs had shaped their gender identity development. The character was the rehearsal. And the rehearsal made the realisation possible.

**Processing grief and loss.** This one has the least hard data behind it, so I'll tread lightly. The idea follows straight from narrative therapy, though. Someone who's lost a person might find meaning in playing a character who's lost someone too. That's not because the game copies their real experience. It's because voicing a character's grief can let them say things they can't yet say about their own. The grief takes on a shape inside the story, and a shape is something you can hold.

**Community and belonging.** For isolated people, an RPG group offers steady social contact with a shared purpose, and that matters a lot. The Plymouth participants are a good example: they found a space where they didn't have to hide who they were. For plenty of disabled and neurodivergent players, and for socially anxious ones as well, RPG communities are among the friendliest places they've found as adults. I'll be straight with you, though. This is the one benefit that doesn't carry over cleanly to solo play. It's something group RPGs do that a solo session can't.

## Why Audio RPGs Extend This

What EchoQuest offers that a group table can't is privacy. The benefits of storytelling don't need an audience. If you want to play a character who's carrying a loss, you can do that alone, without the exposure of performing your feelings in front of friends. Some emotional work is hard with people watching, and it gets easier in the quiet of a session you set up for yourself.

The always-available GM also clears away the scheduling problem. If a story is how you like to think things through, you don't have to wait for Thursday's group. You can play at three in the morning if that's when it hits, and the free tier gives you 60 turns every day. On top of that, accessibility opens the door wider. Blind players get narrative play on the same terms as everyone else, without the logistics a traditional table demands. So do players with motor disabilities, or anyone who lives hours from the nearest gaming group.

Some of my own design decisions came from thinking about how a session feels, on top of what it does. When I rewrote the Game Master in October, I gave it a real setback at 0 HP: you might get captured, or you wake hours later with a price to pay. But the GM's instructions also say, plainly, that nobody dies permanently. Failure should sting without wiping you out. There's single-step undo, too, and a full rollback if a turn breaks halfway, so a glitch never leaves your story in a half-finished mess. And back in May I caught EchoQuest reading out the choices while the narrator was still talking, so screen reader users heard two voices at once. That's stressful in a quiet, grinding way, so now the choices wait. Space or P pauses the narration whenever you need a breath.

I don't market EchoQuest as a wellbeing tool, and I don't claim any clinical benefit. If a story helps you think something through, I'm genuinely glad. That's as far as I'll go.

## What Doesn't Replace

I want to be precise about what solo play with an AI Game Master *doesn't* do. It doesn't replace the bonds you build at a group table, or human connection in general. Above all, it doesn't replace therapy. If you need mental health care, please reach out to a doctor or a therapist, and if you're in danger right now, call your local emergency number. An AI Game Master is no stand-in for a trained professional. I'll keep repeating that, because the alternative (a struggling player using a game as their only outlet for serious distress) is a harm I want to actively prevent.

What it can do, as one tool among many, is give you an easy way to spend time inside structured imagination, with characters who react and choices that carry weight. On the evidence so far, that kind of experience seems to be good for people. I'm not a clinician, and EchoQuest isn't therapy. Still, I believe accessible, responsive narrative play is good for people, and I let that belief shape how I build it.

So, which story would you like to step into tonight?

**[Play your first session →](/library)**
`,
  },
  {
    daysFromNow: 27,
    title: "How Screen Readers Work with EchoQuest: A Technical Deep Dive",
    excerpt: "Building genuine screen reader compatibility isn't about adding ARIA labels — it's a design philosophy that touches every layer of the application. Here's how EchoQuest approaches it.",
    content: `# How Screen Readers Work with EchoQuest: A Technical Deep Dive

"Screen reader compatible" is one of the most abused phrases in accessibility. It often means "we added alt text to the images and tested it once in VoiceOver" — and the gap between that and a screen reader user actually being able to use the application is enormous. A blind player who has been turned away from many "accessible" apps over the years can usually tell within thirty seconds whether a site was designed with screen reader users in mind or whether the developers added accessibility as a checkbox at the end. EchoQuest takes a different approach — one built into the architecture rather than bolted on afterwards.

This post is a technical deep dive into how that's done. It's aimed at developers, accessibility advocates, and curious players who want to know what's happening under the hood. If you build web apps, the patterns below are worth applying to your own work; the underlying lesson is that screen reader compatibility is a *design constraint*, not a feature you ship later. Treat it as a constraint and most of the work is structural; treat it as a feature and you'll be patching forever.

## How Screen Readers Work

A screen reader is software that reads the contents of your screen aloud and provides keyboard navigation. Common screen readers include NVDA and JAWS on Windows, VoiceOver on Mac and iOS, TalkBack on Android, and Orca on Linux. Different users prefer different combinations; we test against several to ensure the experience holds up regardless of the reader.

Screen readers work by reading the browser's *accessibility tree* — a structured representation of the page that the browser builds from your HTML and ARIA attributes. The accessibility tree is what the screen reader actually sees. The visual layout, the colours, the icons, the animations — none of that matters to a screen reader. Only the tree matters. When HTML is semantic and well-structured, the accessibility tree is accurate and useful. When it's not — when content is rendered via CSS, positioned absolutely, or conveyed through visual properties alone — the accessibility tree is incomplete or misleading. A button that looks like a button but is actually a styled div will appear in the tree as something other than a button, and the screen reader user will not be able to operate it the way they'd expect.

The single highest-leverage thing any web developer can do for accessibility is use the right HTML element for the right purpose. Almost every other accessibility technique is downstream of that choice.

## EchoQuest's Approach: Semantic HTML First

Every interactive element in EchoQuest is a real HTML element with the semantics that match its purpose:

- Buttons are real button elements, not clickable divs. They get keyboard focus by default, are activated by Enter or Space without extra code, and announce as "button" to screen readers
- Navigation is in a nav element with an aria-label so users can jump to it via screen reader navigation shortcuts
- The game text is in main with an id so the skip link can jump to it from the top of the page
- Narration entries are p elements inside a live region so new content is announced automatically as it arrives
- Form inputs always have associated label elements; placeholder text is never the only label
- Headings follow proper hierarchy — h1 for page title, h2 for major sections, h3 for subsections — so screen reader heading-navigation works
- Lists use ul, ol, and li elements rather than styled divs, so screen reader users can hear "list with 5 items"
- Tables use table, thead, tbody, tr, th, and td appropriately, with caption elements where they add useful context

This sounds basic, but the majority of web accessibility failures come from ignoring exactly these basics. Modern frontend frameworks make it easy to ship custom components that look right but lose the underlying semantics; we audit constantly to catch ourselves before that happens.

## ARIA Live Regions for Dynamic Content

The most important accessibility feature in EchoQuest is its use of ARIA live regions for game content.

When the AI GM generates a response, it appears dynamically — the page doesn't reload. Without live regions, a screen reader user would never hear the new content unless they navigated to it manually, which would defeat the purpose of an interactive narrative. With live regions, the new narration is automatically announced as soon as it appears, so the screen reader user gets the same real-time response a sighted player gets visually.

EchoQuest uses role="status" for non-urgent announcements (choice updates, inventory changes, faction reputation shifts) and role="alert" for urgent ones (HP reaching zero, critical story moments, narrative cliffhangers that demand attention). The distinction matters: "status" announcements wait for a natural pause in the screen reader's current speech; "alert" announcements interrupt immediately. Using "alert" too often is a common mistake — it makes the experience feel jittery and aggressive. We use it sparingly, only for moments where interrupting the current narration genuinely serves the player.

A subtler choice: how often live regions update. If we naively pushed every token of streamed AI output into a live region, the screen reader would get hammered. Instead, the live region updates at sentence boundaries, which produces much cleaner narration without sacrificing real-time feel.

## Focus Management

When a modal opens (settings, character sheet, inventory), focus moves automatically to the first interactive element inside it. When the modal closes, focus returns to the element that triggered it. This is the standard web accessibility pattern — but it requires explicit JavaScript to implement and is frequently missed in production apps. Every page on the public internet that has a modal you can't escape from with the keyboard, or whose focus jumps to the top of the page when you close a dialog, is failing to implement this correctly.

EchoQuest's FocusManager component handles this centrally, ensuring every modal and overlay follows the pattern consistently. We also trap focus inside modal dialogs so Tab cycling stays within the dialog — preventing the common bug where keyboard users tab themselves out of a modal into the page behind it without realising the modal is still open.

We also explicitly manage focus around route changes in Next.js. When the player navigates to a new page (say, from the library to a character creation flow), focus moves to the new page's main heading, so screen reader users immediately hear where they've landed. Without this, focus would stay where the click happened, and the screen reader user might not realise the page has changed at all.

## Skip Links and Heading Navigation

Every page has a "Skip to main content" link as the very first focusable element. It's visually hidden until focused, then becomes visible at the top-left of the screen. For repeat visitors who navigate by keyboard or screen reader, the skip link is the single most useful element on the page — it lets you bypass the navigation header without tabbing through it on every page load.

We also structure pages with proper heading hierarchy so screen reader users can navigate by heading level. NVDA's "h" key, JAWS's "h" key, and VoiceOver's heading rotor all let users jump from heading to heading. A well-structured page becomes navigable at a level that's faster than visual scrolling.

## Testing Process

We test with:
- NVDA + Firefox on Windows (the most common screen reader/browser combination used by blind Windows users)
- JAWS + Chrome on Windows (the most common combination in enterprise and education)
- VoiceOver + Safari on Mac and iOS
- TalkBack + Chrome on Android (smoke test on each release)
- Orca + Firefox on Linux (smoke test)
- Keyboard-only navigation (no screen reader, just Tab/Enter/arrow keys) on every browser

Accessibility testing is part of our CI pipeline via axe-core automated checks, which catch a useful subset of issues before they reach production. But automated testing alone misses the most important class of bugs — the ones where semantically valid markup produces a confusing experience. Those bugs only show up under manual testing with a screen reader, and we do that with each significant feature change. We also work with blind testers on a freelance basis for major releases. Their feedback consistently surfaces issues no internal team would have caught.

## Reporting Issues

If you encounter an accessibility barrier in EchoQuest, please report it via our support link. We treat accessibility bugs as P1 issues — they block releases. The fastest channel is email, with the browser, screen reader version, and exact steps to reproduce. We respond to every report and fix as quickly as we can. We'd rather know about a bug a hundred users have hit silently than miss it because nobody told us.

**[Play EchoQuest →](/library)**
`,
  },
  {
    daysFromNow: 28,
    title: "Behind the GM: How We Prompt Claude to Run Your Adventures",
    excerpt: "The EchoQuest AI Game Master is powered by Claude, but the magic is in how we instruct it. Here's a transparent look at the prompt engineering behind the scenes.",
    content: `# Behind the GM: How We Prompt Claude to Run Your Adventures

Every time you take an action in EchoQuest, Claude receives a carefully structured prompt and generates a response. That prompt is the product of months of design work — testing, iterating, and tuning until the AI GM behaved the way a great human GM would. Most players never see the prompt; they just experience the output. We think the work is interesting on its own terms, and being transparent about how it operates is part of building trust with players who care about how their stories are made.

This post is a guided tour of the system prompt that powers the AI Game Master. Some specifics are abstracted (the literal prompt is a moving target and includes details we keep private for safety reasons) but the structural choices are public, and we explain why each one is the way it is. If you're a developer building AI applications, the patterns below generalise. If you're a player, you'll come away with a much clearer picture of what the GM is doing on your behalf.

## The Structure of a GM Prompt

Before Claude sees your action, it receives a system prompt that contains several components:

**Identity and role.** The GM is told explicitly what it is: a skilled, empathetic Game Master running a collaborative RPG. It's told its primary job is to make the player feel capable and engaged while maintaining narrative stakes. We invest a lot of time in this section because the model's self-conception shapes everything else. A GM that thinks of itself as "an AI assistant answering a question" will produce different output than one that thinks of itself as "a Game Master running a session for someone they care about." The framing isn't decorative; it's structural.

**World context.** The entire Game Bible — your world's lore, factions, tone, rules, and constraints — is embedded in the prompt. This is what makes the AI behave consistently with your world rather than defaulting to generic fantasy tropes. The Bible is summarised down to a dense, AI-friendly format before being injected; what the model sees is a structured representation, not the raw uploaded document. This pre-processing keeps the context window efficient and the model's grasp of the world precise.

**Character information.** Your character's name, class, backstory, current stats, inventory, and any story flags set by previous choices are included. The GM knows who you are, what you've done, and what your character cares about. Backstory is read carefully — a backstory mentioning a sister is the kind of detail the GM will weaponise, dramatically, when the right scene comes up.

**Location and current state.** Where you are right now, what's around you, and what the AI's current "scene state" is (time of day, active NPCs, recent events). Location is re-injected on every turn; the GM doesn't have to remember it from earlier in the conversation history because the system supplies it fresh.

**Recent conversation history.** The last several exchanges between you and the GM, so it has immediate context without reading the entire session history. Older exchanges are condensed into a structured summary that captures the meaningful events without using up context window space on routine narration.

**Structured game state.** A compact representation of HP, conditions, faction reputations, NPC dispositions, and any story flags. This is the most important consistency tool we have. Rather than relying on the model to remember "you were rude to Sera Volant last session," we explicitly tell the model "current disposition of Sera Volant: cool, +1 (warmed slightly when you returned the locket)." The model doesn't have to remember; it just has to honour what's already written down.

**Instructions for output format.** The GM is told to produce structured output: narration, choices, any state changes, any sound cues. This structured output is what allows EchoQuest to update the game state, trigger sounds, and update your character sheet automatically. The model produces both prose (for the player) and structured data (for the engine) in the same response.

## What We Ask the GM to Do

Beyond the factual context, we give the GM explicit behavioural instructions:

- Respond to the spirit of the player's action, not just the letter. If the player says "I throw my drink in his face," they're communicating intent (provocation, disrespect, escalation), not asking for a literal physics simulation
- Never say "I can't do that" — always interpret the action charitably and find a way to respond. The AI's first instinct is sometimes to refuse; we explicitly forbid this
- Vary sentence length and rhythm; avoid repetitive sentence structures. Without this nudge, AI prose tends toward a uniform medium-length sentence cadence that becomes hypnotic in a bad way
- Use sensory detail — what the player hears, smells, and feels, not just sees. For an audio-first platform this is doubly important; visual-only descriptions translate poorly to narration
- End narration at a moment of tension or decision, not resolution. The player should always have something to do
- Maintain NPC consistency — the same character should speak and behave the same way across scenes. Use the structured game state to verify
- Honour the player's stated tone preferences. If the player has said they want a tragedy, don't soften the blows
- "Play to find out what happens" — borrowed from Apocalypse World. Don't push the player toward a predetermined outcome

## What We Ask the GM Not to Do

- Don't kill characters without clear player agency unless the player has set high difficulty. Even then, give the player a chance to escape
- Don't railroad — if the player wants to go somewhere or do something the story didn't anticipate, follow them. The "story" is whatever happens; it isn't a path the player must walk
- Don't repeat information the player already knows just to pad narration. The GM should trust the player's memory
- Don't use the word "suddenly" (a classic bad writing crutch that AI models love). Other banned words and phrases include "in a way that," "a sense of," and excessive use of "perhaps"
- Don't make the world feel hostile to the player's creative choices. When the player does something unexpected, the GM should be visibly delighted, not annoyed
- Don't give NPCs the same speech rhythms or vocabulary. Each NPC should sound different
- Don't apologise mid-scene. If something needs to be different, the player can tell the GM out-of-character; the GM's narration should never break frame to express AI-style hedging

## The Ongoing Refinement

We tune the prompt continuously based on player feedback. When players report that the GM made an unfair ruling, forgot something important, narrated inconsistently, or fell into a particular bad pattern (overusing certain words, defaulting to certain story shapes), we investigate whether the prompt is responsible and update it if so. The fixes propagate to every player simultaneously.

Some examples of recent changes: we noticed the GM was ending too many scenes with a question to the player, which felt formulaic. We added an explicit instruction to mix scene endings (sometimes a question, sometimes an action beat, sometimes a silence). We noticed NPCs were drifting toward similar speech patterns over long sessions. We added explicit per-NPC voice guidance to the structured state. We noticed difficulty was too uniform across campaigns. We added more nuanced difficulty tuning based on the player's stated preferences and the campaign's tags.

This is one of the advantages of a software-powered GM: we can improve every player's experience simultaneously by improving the instructions. A great human GM in a tabletop campaign improves only that campaign. A change to our prompt improves every campaign in EchoQuest from that point on.

## What We Don't Promise

We're honest about limitations. The prompt can't make the model perfect. It can't fully eliminate the model's tendency to hedge under uncertainty. It can't give the model human emotional perception. It can't make consistency across hundreds of sessions automatic — we've engineered structured state to compensate, but the AI alone wouldn't manage it. Prompts are a powerful tool, not a magic wand. The GM gets better, year over year, both because the underlying models get better and because we keep refining the instructions. We expect the gap between AI GM and best-of-class human GM to keep narrowing for a long time.

**[Experience the GM yourself →](/library)**
`,
  },
  {
    daysFromNow: 29,
    title: "Building Community Worlds: Tips from EchoQuest Creators",
    excerpt: "Players who've published worlds to EchoQuest's community library share what they learned — about world-building, about writing for AI, and about what makes a community campaign worth playing.",
    content: `# Building Community Worlds: Tips from EchoQuest Creators

The EchoQuest community library exists because players want to share their worlds. Since we launched creator tools, dozens of worlds have been published — from gritty political thrillers to cozy mystery towns to cosmic horror epics, from solarpunk anarchies to gothic faerie courts to noir-tinged retro-futures. The community is small enough that creators talk to each other directly, learn from each other's successes and stumbles, and tend to converge on a shared craft. This post is the distillation of what those creators have learned, drawn from interviews with the most-played community worlds and from the patterns we see ourselves when reviewing newly-submitted campaigns.

If you're thinking about publishing your first community world, the advice below is the closest thing we have to a battle-tested playbook. None of it is mandatory; some of the best worlds have broken every rule. But they broke the rules deliberately, with a reason, and that's the difference between intentional choice and accidental rough edge. Read these as defaults to deviate from with purpose.

## Start With the Opening Scene, Not the Lore

The instinct when building a world is to start with history — the ancient wars, the founding myths, the timeline of major events, the cosmology of the gods. Resist this. Players don't experience your world through its history. They experience it through a specific moment: the opening scene. The opening is the only paragraph guaranteed to land. Everything else is optional.

Build the opening first. Who is the player character? Where are they? What's immediately happening? What's the first decision they need to make? A vivid, grounded opening scene does more for player engagement than pages of backstory. You can always add lore later — and the lore lands harder when it's delivered in response to player questions, in chunks shaped by what the player wants to know.

A useful rule: if your opening scene's first paragraph could appear in another, completely different world, the opening isn't specific enough. The opening should announce *this* world. Re-read it through the eyes of a player who has never heard of your setting. Are they oriented? Are they tempted? Do they want to know what happens next? If yes, ship it. If no, rewrite.

## Write for Listening, Not Reading

Community world text gets narrated aloud — either by the browser TTS or by ElevenLabs voices. This changes how you should write. The cadence of prose that reads beautifully on the page often falls flat when spoken; rhythms that work in audio sometimes look strange in print. Play to the medium.

- Use shorter sentences than you would in prose fiction. The voice doesn't have your eye's ability to skip ahead and parse a long sentence at a glance
- Avoid complex nested clauses that are hard to parse when heard rather than read. Rewrite sentences with three sub-clauses into two sentences with two each
- Favor concrete sensory detail over abstract description. "The smell of woodsmoke and roasted onions" beats "the homey smell" every time
- Read your opening scenario aloud before publishing — if it sounds awkward spoken, rewrite it. This is the single highest-leverage editing pass available to a community creator
- Watch out for proper nouns that are easy to read but hard to say. Aeryndel-Tael-Khorin will trip every TTS engine; consider a shorter alternative or a phonetic note

The best community world descriptions have a rhythm to them when read aloud. That's not an accident.

## Give the AI Specific Constraints

The AI Game Master is powerful but needs guardrails to stay consistent with your world. The clearest, most specific constraints produce the best results.

Vague: "Magic is limited in this world."
Specific: "Magic requires spoken incantations and physical components. It is rare, feared, and associated with the heretical old religion. No character casts magic publicly. The Church executes practitioners. Petitioners sometimes claim to have witnessed miracles; these are usually frauds, sometimes mass hysteria, and rarely something more disturbing."

Specific constraints let the AI make confident, consistent calls when magic-adjacent situations arise in play. They also rule out generic-fantasy defaults the model would otherwise fall into. The model is happy to generate "a wizard with a staff casts a spell" if you let it; if you've told it magic is illegal and feared, it produces something much more interesting instead.

The same principle applies to technology, social structure, religion, and economics. The more your constraints differ from generic fantasy defaults, the more specific you have to be. A world with no kings needs to say so explicitly. A world with universal literacy needs to say so. A world where commerce isn't conducted in coins needs to spell out what is.

## Design for Replayability

Community worlds get played by many different players with different approaches. Design scenarios that work whether the player is aggressive or cautious, political or action-oriented, suspicious or trusting, lawful or chaotic, sociable or solitary. The opening should accommodate any of these starting energies and let the player play to their preference.

The best community campaigns have a central tension that creates interesting choices regardless of the approach — because the approach changes which choices are available and what their costs are, but the fundamental tension remains. A campaign about "a city on the verge of revolution" will play differently for a sympathetic player and a counter-revolutionary player and a player who just wants to keep their head down, but all three will find interesting things to do because the tension itself doesn't depend on which side they pick.

If your campaign requires the player to pursue a specific goal in a specific way to be interesting, it isn't designed for replayability. It's designed for one play-through. That's a legitimate choice — some short, focused campaigns are great as one-shots — but be honest about it in the description so players know what they're getting.

## Let the AI Improvise

Some creators try to script every outcome — pre-writing branches, anticipating every player choice, attempting to control the AI's responses in detail. This doesn't work with an AI GM. The model improvises by nature, and trying to constrain it into a pre-written script produces stilted, generic output. Instead of trying to control what happens, focus on the furniture: who the characters are, what they want, what the world feels like, what's at stake. The AI will fill in the rest.

Players consistently report that the best community sessions feel like the world was responding intelligently to their specific choices — not following a script. That feeling comes from good furniture, not from scripted outcomes. A world with detailed factions, rich NPCs, vivid sensory texture, and clear constraints will produce wildly different sessions for different players, all of which feel like authentic stories in that world. A world with a pre-scripted plot will feel like a railroaded video game even when the AI is doing the narration.

## Iterate After Publication

Your first version is a draft. Publish, watch how players actually engage with the world (we provide play telemetry to creators about which scenes get the most time, which choices are most common, where players quit), and revise. The most-played community worlds have all been through three to five major revisions based on real play data. Creators who publish once and never edit usually have lower retention than creators who treat the world as a living document.

Don't take this as a reason to delay publishing. Publish a rough version early; revise based on what you learn. Over six months, that produces a stronger world than working on a perfect version in private for a year.

## Be Generous With Other Creators

The community library benefits from a culture of mutual help. Creators who play other creators' worlds, leave thoughtful feedback, and credit influences openly tend to receive the same in return. We've seen entire small genres emerge from a single creator's work that other creators built on. The library gets richer when everyone treats it as a shared garden rather than a competition.

**[Publish your world →](/worlds/new)**
`,
  },
  {
    daysFromNow: 30,
    title: "What's Next for EchoQuest: Our Vision for the Future",
    excerpt: "We've built the foundation. Here's where EchoQuest is headed — the features we're working on, the problems we're solving, and the future of accessible AI-powered storytelling.",
    content: `# What's Next for EchoQuest: Our Vision for the Future

EchoQuest launched with a simple premise: an AI-powered, audio-first RPG that anyone can play regardless of visual ability, motor ability, or whether they have a tabletop group to play with. That premise is real and working. Players are spending tens of thousands of hours inside our worlds. Blind players are reporting that this is the first RPG that has met them on equal footing with sighted players. Tabletop veterans are using EchoQuest to fill in the gaps between their human campaigns. Solo players are finally getting the kind of long-arc narrative experiences they couldn't access any other way. We're proud of where we are.

But we're only at the beginning of what's possible. The platform we have today is a foundation — a well-built one, but a foundation. The platform we want to ship over the next two years is much larger, more responsive, and more capable of serving a wider range of players. This post is a frank look at where we're headed: what's in active development, what's coming after, and the long-arc ambitions we're shaping the company around. We'll update this post as items ship.

## Near-Term: Deeper World Customization

The most-requested feature from creators is more control over world behavior: custom sound cue triggers, more granular NPC behavior rules, the ability to define specific skill check thresholds, support for non-standard stat systems, custom progression schemes, and per-region tone overrides. These are coming. We've prototyped most of them and the question is integration polish, not whether they're feasible.

We're also building an improved character persistence system — so your character's relationships, reputation, and history carry more clearly across sessions. The AI currently does a good job with short-term memory; we're investing in making long-term character history feel more tangible. The goal is that, by session fifty, your character's reputation is something the world references casually rather than something you have to remind the GM about.

A related upgrade: the World Builder Wizard is getting an "import from existing tabletop campaign" mode, where you can paste your old session notes and the AI will convert them into a Game Bible for ongoing solo play. We've heard from many tabletop players who want to continue retired campaigns alone; this will let them.

## Near-Term: Collaborative Play

Solo play is EchoQuest's foundation. But the most requested feature from players is the ability to adventure with a friend — two players, one AI GM, one shared story. Building multiplayer that works well for accessibility (two players might have very different audio setups, different screen reader rates, different connection speeds) is complex, but it's actively in development.

The first multiplayer release will support two-player sessions with synchronised narration, turn-based actions, and shared game state. Three+ player sessions are planned for the release after. We're paying particular attention to mixed-ability play — a sighted and a blind friend playing together should be a great experience for both, with neither at a disadvantage. Most multiplayer features in the industry assume both players have the same input modality. Ours won't.

## Medium-Term: Voice-First Interface

Right now, EchoQuest is text-first with audio output — you read or listen to narration, you type or speak actions. The next evolution is fully voice-first: you speak, the AI responds with voice, and the keyboard/screen is secondary rather than primary. This would be EchoQuest's most significant accessibility leap — a fully conversational RPG where the screen is entirely optional.

This is harder than it sounds because the round-trip latency of voice-in, AI processing, voice-out has to feel natural. We're working on it. When it ships, we expect it to expand the platform's accessibility further — to players with severe motor disabilities, to players who want to play during commutes or chores, and to children and elderly players for whom typing is a barrier.

## Medium-Term: Adaptive Storytelling

We want EchoQuest to learn from your play style over time. If you consistently engage most with political intrigue, the AI GM should start weaving in more political scenarios. If you love emotional character moments, your campaigns should contain more of those. If you reliably skip combat, the GM should structure stories that don't depend on combat for their stakes. Personalization at the story level is a hard problem — most game personalisation is shallow ("you killed orcs, here's more orcs") — but it's the right one to solve.

The opt-in version is straightforward: tell the GM what you like, and the GM honours it. The harder version is implicit personalisation: the system notices, over many sessions, what you actually engage with versus what you skip past, and gradually shifts the world toward your preferences. We're being careful here because there's a fine line between "the world feels tailored to you" and "the world is sycophantically agreeing with you," and the second one ruins stories. We don't want to ship an AI GM that just tells you what you want to hear. The art is making the world feel responsive without losing its independent integrity.

## Medium-Term: A Creator Marketplace

Right now, all community worlds are free for any subscriber to play. Creators get visibility but not revenue. We want to change that — to build a marketplace where world creators can earn money when players try their campaigns, with revenue share for the most-played worlds. The mechanics are still being designed (revenue share percentages, payment thresholds, quality controls), but the principle is clear: people who write great worlds for the platform should be able to make a living from doing so. The current model puts the entire economic upside on us; that's not sustainable for a thriving ecosystem.

## Long-Term: Native Multiplatform Apps

EchoQuest is a web app today. It works on mobile but isn't a native experience. We have iOS and Android apps in design phase, with the goal of full offline-capable downloads of campaigns you've started. The web version will remain first-class — many of our most-engaged players prefer it — but mobile and tablet players deserve a UX optimised for their devices.

Native apps also unlock features the web can't: deeper integration with platform accessibility services (VoiceOver and TalkBack work better in native), background audio for play while screens are locked, and offline narration for travel. These features will land as the apps mature.

## Long-Term: An Open Platform for Accessibility-First Games

Our biggest ambition isn't EchoQuest itself — it's demonstrating that audio-first, accessibility-first design produces better games that more people can play. We want to publish our accessibility patterns, contribute to open standards, share our prompt engineering learnings, and help other developers build on what we've learned. The blind and visually impaired gaming community has been underserved by the games industry for its entire history. That's a solvable problem. EchoQuest is one solution — but the real goal is a richer ecosystem of accessible games from many creators.

We're also exploring partnerships with organisations doing accessibility research, with universities studying AI-narrated learning, and with mental health adjacent groups using narrative play in clinical settings. The platform can serve more than just entertainment, and we want to support those uses without losing focus on the core game experience.

## What We Won't Do

We want to be clear about a few directions we're not going:

- **No selling player data.** Player conversations with the AI are not training data, are not sold to third parties, and are not used for ad targeting. The privacy of your sessions is non-negotiable
- **No PvP combat.** EchoQuest is a narrative co-op platform. We're not building competitive multiplayer, ranked ladders, or character-vs-character combat systems. That's not what the platform is for
- **No NFTs, no crypto, no blockchain integration.** Worlds and characters belong to their creators and players, not to a token economy
- **No dark patterns to drive subscriptions.** The free tier will remain a complete game. Paid features will be genuine upgrades, not artificial restrictions to force conversions

## A Note of Gratitude

To every player who's spent time in an EchoQuest world: thank you. Every session teaches us something. Every piece of feedback improves the experience for the players who come after you. Every creator who has uploaded a Game Bible has expanded what the platform can be for everyone else. You're not just playing a game — you're helping build the future of accessible storytelling.

To the blind and visually impaired players who took a chance on a new platform: thank you for your patience as we got things right. To the sighted players who fell into audio gaming and never went back to visual: thank you for spreading the word. To the creators publishing worlds: thank you for trusting the platform with your imaginations.

We'll see you in the next session.

**[Join us →](/library)**
`,
  },
];

export function launchPublishDate(daysFromNow: number): Date {
  const d = new Date("2026-05-01T00:00:00Z");
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(9, 0, 0, 0);
  return d;
}
