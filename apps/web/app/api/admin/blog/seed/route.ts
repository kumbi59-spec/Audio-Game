import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

function slugify(title: string) {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

const POSTS: Array<{ title: string; excerpt: string; content: string; daysFromNow: number }> = [
  {
    daysFromNow: 1,
    title: "Welcome to EchoQuest: The AI RPG Built for Everyone",
    excerpt: "EchoQuest is the world's first audio-first AI RPG platform — built from day one to be fully accessible to blind, visually impaired, and sighted players alike. Here's what makes it different.",
    content: `# Welcome to EchoQuest: The AI RPG Built for Everyone

If you've ever wanted to play a tabletop RPG but couldn't find a group, didn't have time to prep, or simply couldn't access the visual-heavy tools most games rely on — EchoQuest was built for you.

## What Is EchoQuest?

EchoQuest is an audio-first AI RPG platform powered by Claude AI. Instead of reading text on a screen, every scene is narrated aloud. Instead of rolling dice and consulting tables, a live AI Game Master responds to exactly what you say — in natural language, no special commands required.

You can type your actions, speak them aloud, or use a keyboard. The story adapts to you.

## Built for Blind and Sighted Adventurers

Most games treat accessibility as an afterthought — a checkbox tacked on after launch. EchoQuest is different. We built the audio layer first, then added visuals on top. That means:

- Every menu, button, and piece of game text is readable by screen readers
- Full keyboard navigation — no mouse required
- Voice command support so you can play completely hands-free
- Narration speed and pitch controls so the voice fits how you listen

Whether you're blind, have low vision, or just prefer to close your eyes and listen, EchoQuest works the way your brain works.

## A Living, Breathing AI Game Master

The heart of EchoQuest is the AI Game Master, powered by Claude — one of the most capable large language models available. Unlike older text adventures with branching menus, the EchoQuest GM:

- Responds to anything you say, not just preset choices
- Remembers what happened earlier in your session
- Generates NPCs with distinct personalities
- Tracks your character's health, inventory, and story flags in real time
- Plays ambient sound effects that match the scene

## Free to Start

EchoQuest is free to play. We offer three prebuilt official campaigns to start with, and you get 60 AI minutes per day on the free tier. If you want unlimited play, premium narration voices, or the ability to create your own worlds, paid plans start at $15/month.

## What's Coming

We're building a community library of player-created worlds, a World Builder Wizard for creators, and deeper accessibility integrations. The game is actively developed and your feedback shapes what we build next.

Ready to start your first adventure? **[Browse the Adventure Library →](/library)**
`,
  },
  {
    daysFromNow: 2,
    title: "How to Play Your First EchoQuest Adventure (Beginner's Guide)",
    excerpt: "Never played a text-based RPG before? No problem. This step-by-step guide walks you through your first EchoQuest session — from picking a world to making your first move.",
    content: `# How to Play Your First EchoQuest Adventure (Beginner's Guide)

So you've heard about EchoQuest and you're curious — but you've never played an AI-driven RPG before. Maybe you've never played a tabletop RPG at all. That's completely fine. This guide will walk you through everything.

## Step 1: Browse the Adventure Library

When you first arrive at EchoQuest, head to the **Adventure Library**. This is where all available worlds live — both official campaigns built by our team and community-created worlds published by players.

On the free tier, you can access three official prebuilt campaigns. Each one is labeled with a difficulty (Beginner, Intermediate, Advanced) and a genre tag like Fantasy, Horror, or Mystery. Start with a Beginner campaign.

## Step 2: Choose Your Character

Before the adventure begins, you'll create a character. Pick a name, a class (like Rogue, Mage, or Warrior), and write a short backstory. Don't overthink it — the AI Game Master adapts to whoever you decide to be.

Your character has a few simple stats: **HP** (hit points), and any special abilities tied to your class. These change as the story progresses.

## Step 3: Listen to the Opening Scene

Once your session starts, the AI Game Master narrates an opening scene. If you're using the browser TTS voice, it will read this aloud. If you have a premium subscription, the ElevenLabs voice will narrate with richer, more expressive audio.

Take a moment to listen. Pay attention to where you are, who's around you, and what's happening. The scene sets up the situation you need to respond to.

## Step 4: Take Your First Action

Below the narration, you'll see three suggested choices — but you're not limited to them. You can:

- **Click or tap a choice** to select it
- **Type your own action** in the text box (e.g. "I examine the door for traps")
- **Speak your action** using the voice input button

The AI GM will respond to exactly what you say. There's no wrong answer — the story adapts.

## Step 5: Keep Going

Each response from the AI GM advances the story. Your HP updates if you take damage, your inventory changes if you pick something up, and ambient sounds shift as you move through the world.

If you want to replay the last narration, press **R** or click the replay button. If you need to pause, your session is saved automatically.

## Tips for New Players

- **Don't be afraid to ask questions in-character.** "I ask the innkeeper what she knows about the disappearances" is a perfectly valid action.
- **Explore.** The AI GM rewards curiosity. Try examining objects, talking to NPCs, and going off the suggested path.
- **You can't break the game.** If your action doesn't make sense in the story, the GM will say so gracefully and ask what you'd like to do instead.

Your first adventure is waiting. **[Open the Library →](/library)**
`,
  },
  {
    daysFromNow: 3,
    title: "Why Audio-First Gaming Is a Revolution for Blind Players",
    excerpt: "For blind and visually impaired gamers, most RPGs are effectively inaccessible. EchoQuest was designed to change that — permanently.",
    content: `# Why Audio-First Gaming Is a Revolution for Blind Players

The gaming industry generates over $180 billion per year. And yet, for an estimated 2.2 billion people worldwide with some form of visual impairment, the vast majority of that industry might as well not exist.

Most games — even text-heavy RPGs — rely on visual maps, tiny text, drag-and-drop interfaces, and split-second visual cues. Screen readers struggle with them. Keyboard navigation is broken or absent. The "accessibility options" menu, if it exists at all, typically just increases font size.

EchoQuest was built to fix this — not as a side project, but as the core design principle.

## The Problem with "Accessible" Games

When accessibility is bolted on after the fact, it shows. Common failures include:

- **Non-semantic HTML** — screen readers read random numbers and IDs instead of meaningful labels
- **Mouse-only interactions** — no keyboard equivalent for critical actions
- **Visual-only feedback** — damage, status effects, and inventory changes are shown as icons with no text alternative
- **No narration** — the story exists only as text on screen, with no audio playback option

These aren't minor inconveniences. They're complete barriers.

## What Audio-First Actually Means

Building audio-first means the game experience is designed around hearing before seeing. In practice:

- Every scene, NPC dialogue, and narrative beat is **spoken aloud** via text-to-speech
- Every UI element has a proper **ARIA label** so screen readers can describe it accurately
- Every action can be triggered via **keyboard shortcut** — no mouse, no touchscreen required
- **Ambient soundscapes** signal the environment (dungeon echoes, forest birdsong, city crowds)
- **Spatial audio cues** indicate direction and events happening around your character

This is what blind gamers have been asking for — not a simplified game, but a full-featured one that works the way they work.

## The Voice Command Layer

EchoQuest also supports **voice commands** for navigation. Instead of pressing Tab to move between choices, you can say "option two" or describe your action out loud. The game converts your speech to text and submits it to the AI GM — no hands needed at all.

For players with motor disabilities as well as visual impairments, this opens doors that were previously nailed shut.

## Why AI Changes Everything

Previous accessible games were limited by fixed scripts. A blind player could navigate the menus, but the story itself was branching — it had a predetermined set of options and paths.

With an AI Game Master, there are no predetermined options. The GM responds to natural language. A blind player can say exactly what their character does, in their own words, and receive a meaningful, contextually appropriate response. The playing field is finally level.

## Building a More Inclusive Gaming Future

EchoQuest isn't the end of accessible gaming — it's a beginning. We're building deeper integrations with assistive technology, working with blind gaming communities to improve our design, and publishing our accessibility approach openly so other developers can learn from it.

If you're a blind or visually impaired gamer who wants to try EchoQuest, your first session is free. No credit card. No catches. **[Start your adventure →](/library)**
`,
  },
  {
    daysFromNow: 4,
    title: "5 World-Building Tips That Make Great RPG Campaigns",
    excerpt: "Whether you're creating a world in EchoQuest's World Builder Wizard or writing a Game Bible from scratch, these five principles separate memorable campaigns from forgettable ones.",
    content: `# 5 World-Building Tips That Make Great RPG Campaigns

Every great RPG campaign starts with a great world. Not a perfect world — a *interesting* one. A world with problems, history, and people who want things. Here are five principles that will make your world worth adventuring in.

## 1. Give Your World a Central Tension

The best fictional worlds aren't static. Something is wrong — or about to go wrong. Maybe an ancient empire is crumbling and three factions are fighting over its bones. Maybe a plague is spreading and nobody knows the cause. Maybe a god just died, and the faiths that worshipped it are in freefall.

Your players need a world with active stakes. The central tension is the engine that drives your story forward even when players go off-script. Before you write anything else, answer: **What is fundamentally broken about this world?**

## 2. Make Your Factions Want Incompatible Things

Conflict is the soul of drama. And conflict comes easiest when you have groups of people — factions — who each want something legitimate but mutually exclusive.

The merchant guild wants open trade routes. The druids want the forest untouched. The crown wants tax revenue from the timber trade. Nobody is purely evil. Everyone has a reasonable case. Now put your players in the middle and watch the sparks fly.

Aim for three to five factions. Any fewer and the world feels simple. Any more and players lose track.

## 3. History Leaves Ruins — Use Them

Players love discovering things. They love stumbling into a half-buried temple and wondering who built it and why. They love finding a crumbling fort with a name on the map but no explanation.

Before your players arrive, something happened here. Build two or three historical events that left physical traces in the world — ruins, scars, monuments, ghost towns. You don't have to explain them all upfront. Let players encounter a ruin and ask questions. Let the mystery breathe.

## 4. Give NPCs Goals That Exist Without the Players

Novice world-builders create NPCs who exist solely to give quests. Veterans create NPCs who were doing things before the players showed up and will keep doing things regardless.

The blacksmith has a gambling debt she's hiding from her husband. The innkeeper is quietly collecting information for a rebel cell. The city guard captain genuinely believes he's protecting people, even when his methods are cruel.

When an NPC has their own agenda, they feel real. Players pick up on it. It makes the world feel inhabited rather than constructed.

## 5. Establish Clear Sensory Language

An AI Game Master describes your world through text and narration. Help it do that well by giving your world specific sensory language in your Game Bible.

Don't say "the city is dark and gritty." Say: "The city smells of tallow candles, river mud, and frying onions. Cobblestones are slick from morning fog. Voices argue in three languages from upper-floor windows."

Specificity is immersion. The more concrete your world's sensory palette, the more vividly the AI will render it in play.

---

Ready to build your world? EchoQuest Creator plan members get access to the **World Builder Wizard** — a step-by-step AI-assisted tool that turns your ideas into a fully playable campaign. **[See plans →](/)**
`,
  },
  {
    daysFromNow: 5,
    title: "How Claude AI Powers the EchoQuest Game Master",
    excerpt: "What actually happens when you type an action in EchoQuest? Here's a plain-language look at how Claude AI drives the AI Game Master — and why it's different from older text adventure systems.",
    content: `# How Claude AI Powers the EchoQuest Game Master

When you type "I draw my sword and demand the merchant explain himself," something remarkable happens. Within seconds, a fully contextual narrative response appears — one that remembers who the merchant is, what happened three scenes ago, and what your character's personality is like. How does that work?

## The Old Way: Decision Trees

Text adventures and early visual novels worked by mapping every possible player input to a predetermined response. If you typed "go north," the game checked a table and returned the "north room" text. If you typed anything else, you got "I don't understand that."

This was fine for simple puzzles, but it breaks down immediately when you try to have a conversation, act creatively, or do anything the designer didn't anticipate. The world felt hollow because it literally was — it only contained what someone explicitly programmed.

## The New Way: Language Models

EchoQuest uses Claude, a large language model developed by Anthropic, as the core of the AI Game Master. Claude doesn't work from a lookup table. Instead, it understands your input as natural language and generates a contextually appropriate response from scratch, every time.

That means:

- You can phrase your actions any way you want
- The GM understands intent, not just keywords
- Responses feel natural and varied rather than canned
- The story can go in directions nobody predetermined

## What the GM Actually Knows

Before Claude generates a response to your action, it receives a detailed system prompt containing:

- **World information**: the setting, tone, factions, and lore from your campaign's Game Bible
- **Your character**: name, class, stats, backstory, and current inventory
- **Current context**: where you are, what's around you, recent events
- **Conversation history**: the last several exchanges in your session
- **Rules**: how to handle combat, skill checks, NPC behavior, and narrative pacing

This is called the *context window* — everything the AI knows before it writes its next response. The richer the context, the more coherent and immersive the story.

## Why Responses Feel Consistent

One of the challenges with AI Game Masters is maintaining consistency — the same NPC shouldn't forget your name between scenes, and the laws of the world shouldn't arbitrarily change. EchoQuest addresses this by:

- Storing key story facts and character state in a structured game state (not just relying on the conversation history)
- Injecting a summary of past events when sessions continue after a break
- Using the world's Game Bible as a persistent ground truth the AI always references

## The Human Design Behind the AI

Claude doesn't invent the rules — we do. The EchoQuest team writes the system prompt that defines how the GM should behave: how to pace tension, when to offer choices versus let the player freeform, how harsh or forgiving to be with consequences. The AI executes those rules with intelligence and creativity.

Think of it like a very skilled, very fast co-author. We set the creative constraints. Claude fills in the story within them.

Ready to see it in action? **[Play a free session →](/library)**
`,
  },
  {
    daysFromNow: 6,
    title: "The Best Fantasy RPG Tropes — And When to Subvert Them",
    excerpt: "Chosen heroes, dark lords, and magical prophecies are RPG staples for good reason. But knowing when to lean in — and when to flip the script — is what separates a good campaign from a great one.",
    content: `# The Best Fantasy RPG Tropes — And When to Subvert Them

Tropes get a bad reputation. People use the word like an insult, as if familiar story elements are somehow lazy. But tropes exist because they work — they're shorthand that lets players instantly understand the stakes and their role in the story. The trick isn't avoiding them. It's knowing when to use them straight and when to twist them.

## The Chosen Hero

**The trope:** One special person, foretold by prophecy, is destined to save the world.

**Why it works:** It puts the player at the centre of the story. It justifies why *your character* is the one taking action when everyone else stays home.

**How to subvert it:** Make the prophecy wrong. Or make it technically correct but describing someone the players would never expect. Or have multiple people who each believe they're the chosen one — and they're all partly right. The chosen hero trope is most interesting when the "choosing" turns out to mean something different than power.

## The Dark Lord

**The trope:** An ancient evil wants to cover the world in darkness. Destroy the MacGuffin, defeat the villain.

**Why it works:** Clear stakes. Obvious enemy. Satisfying endgame.

**How to subvert it:** Give the dark lord a legitimate grievance. Maybe they were wronged by the civilization your players are defending. Maybe their "darkness" is actually a necessary ecological reset the current power structure is suppressing. A villain who makes a coherent argument is far more unsettling than one who just wants chaos.

## The Ancient Ruin With a Secret

**The trope:** Players explore a crumbling structure, find puzzles, discover lore, fight a guardian.

**Why it works:** Exploration, mystery, and reward in one neat package.

**How to subvert it:** The ruin isn't ancient — it's recent, and someone faked the aging. Or the "guardian" is the last survivor, not a monster, and has been waiting there for rescue for fifty years. Or the lore players find inside directly contradicts the history everyone outside believes.

## The Wise Old Mentor

**The trope:** An experienced figure guides the players early on, then steps back (or dies dramatically) so the players can grow.

**Why it works:** Orients new players. Provides early direction without railroading.

**How to subvert it:** The mentor is wrong. Not maliciously — genuinely, confidently, catastrophically wrong about something important. Players who trusted them completely get a harsh lesson about authority. Players who questioned them get vindicated. Either way, the story becomes about more than following instructions.

## The Magical Macguffin

**The trope:** An object of great power must be found, protected, or destroyed.

**Why it works:** Creates a clear objective that can travel anywhere and involve anyone.

**How to subvert it:** The MacGuffin doesn't work as advertised. Or it works perfectly — but activating it requires a moral compromise the players didn't anticipate. Or the "evil" faction trying to steal it actually has a better plan for it than the "good" faction trying to keep it.

---

The best campaigns use tropes as a foundation, then surprise players with the first floor they build on top. In EchoQuest, the AI Game Master can follow your lead — tell it your world's central tension and faction goals, and it will find the moments to subvert expectations naturally. **[Start building your world →](/)**
`,
  },
  {
    daysFromNow: 7,
    title: "Keyboard Navigation in EchoQuest: Play Without a Mouse",
    excerpt: "EchoQuest is fully playable with a keyboard alone. Here's every shortcut, focus order, and navigation trick you need to know for a seamless mouse-free experience.",
    content: `# Keyboard Navigation in EchoQuest: Play Without a Mouse

Whether you're a keyboard power user, a blind player using a screen reader, or someone whose mouse just broke, EchoQuest is designed to work completely without one. Every feature is reachable by keyboard. Every action is triggerable by shortcut.

## The Core Navigation Model

EchoQuest follows standard web accessibility patterns, so if you know how to navigate a webpage by keyboard, most things will feel familiar:

- **Tab** moves focus forward through interactive elements
- **Shift+Tab** moves focus backward
- **Enter** or **Space** activates the focused button or link
- **Escape** closes modals and dismisses overlays

Focus is always visible — there's a clear highlight ring around whichever element is active.

## In-Game Shortcuts

During a play session, these shortcuts let you act quickly without reaching for a mouse:

| Key | Action |
|-----|--------|
| **1, 2, 3** | Select choice 1, 2, or 3 |
| **T** | Focus the text input to type a custom action |
| **Enter** | Submit your action |
| **R** | Replay the last narration |
| **Space** | Pause / resume TTS narration |
| **↑ / ↓** | Adjust narration volume |
| **M** | Toggle ambient sound on/off |

## Screen Reader Compatibility

EchoQuest is tested with NVDA, JAWS, and VoiceOver. Key accessibility features:

- All game text is rendered as semantic HTML, not images
- Narration log entries are marked as ARIA live regions so screen readers announce new content automatically
- Choice buttons have descriptive labels (not just "Option 1")
- Status changes — HP updates, inventory changes, location shifts — are announced via a screen reader-only live region

## The Skip Link

At the top of every page, before any navigation, there's a hidden skip link that becomes visible on focus: **"Skip to main content."** This lets screen reader and keyboard users jump straight to the game area without tabbing through the nav bar on every page load.

## Setting Up Your Preferred Voice

If you're using a system screen reader alongside EchoQuest's built-in TTS, you may want to mute the browser TTS to avoid double-narration. Go to **Settings → Voice** and set TTS Provider to "Off" — the screen reader will then read game text through your preferred voice.

## Tips for Power Users

- Keep the game in a **dedicated browser tab** and use your browser's tab shortcut (Ctrl+Tab) to switch back without losing focus position
- Use **browser zoom** (Ctrl+plus) to increase text size without affecting the game layout
- The text input field supports **standard browser editing shortcuts** — Home/End, Ctrl+A, Ctrl+Z for undo

Questions about accessibility? Reach us at the support link in the footer. We respond to every message. **[Start playing →](/library)**
`,
  },
  {
    daysFromNow: 8,
    title: "ElevenLabs Premium Narration: Why Voice Quality Changes Everything",
    excerpt: "There's a big difference between a robotic TTS voice reading words and a voice that actually performs them. Here's why EchoQuest's ElevenLabs integration is a game-changer for immersion.",
    content: `# ElevenLabs Premium Narration: Why Voice Quality Changes Everything

Text-to-speech has been around for decades. Early versions sounded robotic — flat, monotone, mispronouncing every proper noun. They were useful but not enjoyable. That era is over.

EchoQuest's premium narration, powered by ElevenLabs, represents a genuine leap in what AI voice can do. Here's what changes when you switch from browser TTS to premium voices.

## The Difference Is Emotional Expressiveness

Browser TTS reads words. ElevenLabs voices *perform* them.

When the AI Game Master describes a tense confrontation, a premium voice will lower slightly in pitch, speak more deliberately. When narrating an exciting chase, the pace quickens. When an NPC is frightened, you can hear it. These micro-variations in delivery aren't programmed — they emerge from the model's understanding of the text's emotional register.

For an audio-first game, this isn't a cosmetic feature. It's the difference between reading a stage direction and watching a performance.

## Handling Fantasy Proper Nouns

One perennial problem with TTS in RPGs is proper noun pronunciation. Generic voices mangle invented names constantly — a character called Aeryndel comes out as "Ay-ren-del" or worse.

ElevenLabs models handle this better than any browser voice we've tested. The phonetic patterns of fantasy naming conventions (common in Tolkien-influenced fantasy) are well-represented in training data. You'll still hear occasional mispronunciations, but far fewer.

## Choosing Your Voice

EchoQuest Storyteller and Creator subscribers can choose from a curated set of narrator voices with different personalities:

- **Deep & Dramatic** — a low, resonant voice suited to dark fantasy and horror
- **Warm & Engaging** — a friendly, mid-range voice that works for adventure and comedy
- **Precise & Cool** — a crisp, articulate voice ideal for mystery and political intrigue
- **Energetic** — a faster, enthusiastic voice for action-heavy campaigns

You can preview each voice and switch between them at any time in Settings.

## Speed and Pitch Controls

Premium narration also supports speed and pitch adjustment, giving you full control over how the voice sounds. Some players prefer a faster pace for action scenes; others like a slower, more deliberate read for atmospheric moments. You can change these mid-session without restarting.

## Is Free TTS Good Enough?

Yes — and we've put real work into making the browser TTS experience as good as possible. Free users get narration that clearly communicates everything in the scene. The gap between browser TTS and premium is real but not the difference between playable and unplayable.

If you primarily use a screen reader with your own preferred voice, the built-in narration may matter less to you than the quality of the game text itself.

Premium narration is included in the Storyteller plan ($15/month) and Creator plan ($29/month). **[Compare plans →](/)**
`,
  },
  {
    daysFromNow: 9,
    title: "10 Classic RPG Character Archetypes (And How to Play Them Well)",
    excerpt: "From the brooding rogue to the idealistic paladin, RPG archetypes endure because they work. Here are ten classic character types, what makes each compelling, and one tip for playing them memorably.",
    content: `# 10 Classic RPG Character Archetypes (And How to Play Them Well)

Character archetypes exist in RPGs for the same reason they exist in literature: they're proven. They give players an emotional entry point, a set of instincts to act from, and a relationship to the world that generates interesting choices. Here are ten that appear again and again — and how to make each one feel like yours.

## 1. The Reluctant Hero
*"I just want to go home."*

They didn't ask for this. The world dragged them in anyway. This archetype works because the internal conflict — wanting safety vs. doing what's right — creates constant dramatic tension. **Play it well by:** having a specific thing they're trying to get back to, not just "normal life." A person, a place, a promise.

## 2. The Disgraced Noble
*"I used to have everything."*

Status lost, reputation destroyed, but the manners and instincts of privilege remain. Creates comedy, tragedy, and interesting friction with less privileged party members. **Play it well by:** letting them be genuinely competent in courtly situations — the disgrace shouldn't erase their skills.

## 3. The True Believer
*"The cause is worth any price."*

A character whose faith — in a god, an ideology, a person — defines every choice. Works best when that faith is tested. **Play it well by:** establishing what the faith actually demands in concrete terms, so when it conflicts with other values, the dilemma is real.

## 4. The Cynical Veteran
*"I've seen how this ends."*

Seen too much, trusts no one, survives on instinct. A classic dark fantasy archetype. **Play it well by:** showing what they *were* before the cynicism set in — one relationship or value they haven't abandoned.

## 5. The Eager Apprentice
*"Teach me everything."*

Enthusiastic, possibly reckless, learning on the job. Works especially well if there's a mentor dynamic in the group. **Play it well by:** having them make a specific type of mistake repeatedly until a pivotal moment forces genuine growth.

## 6. The Outsider
*"Your customs are strange to me."*

A character from elsewhere — another culture, another world, another era. Offers a lens to examine the world's assumptions. **Play it well by:** making their outsider perspective come from somewhere specific, not just generic naivety.

## 7. The Reluctant Monster
*"I am what I am. It doesn't define me."*

A character with a monstrous nature (curse, heritage, past) trying to live differently. **Play it well by:** letting the monster nature surface in useful, even heroic ways — the archetype is more interesting when the "curse" becomes a tool.

## 8. The Con Artist with a Heart
*"I only steal from people who deserve it."*

Charming, untrustworthy, surprisingly principled. **Play it well by:** establishing their actual moral line clearly — the thing they won't do regardless of the payoff.

## 9. The Scholar Out of Their Depth
*"Theoretically, I know how this works."*

Brilliant in their domain, helpless in the field. **Play it well by:** having their expertise save the group in one key moment they didn't expect.

## 10. The Haunted Survivor
*"I should have died. Others did."*

Survivor's guilt, driven forward by ghosts. **Play it well by:** naming the people they lost. Specific names, specific memories. That's what makes them real.

---

Pick one of these for your next EchoQuest session. Tell the AI Game Master a sentence or two about your character's archetype in the backstory field, and watch how the story bends around who you are. **[Create your character →](/library)**
`,
  },
  {
    daysFromNow: 10,
    title: "How to Write a Game Bible: The World-Builder's Template",
    excerpt: "A Game Bible is the document that defines everything about your RPG world — lore, factions, tone, rules. Here's a practical template you can fill in and upload to EchoQuest today.",
    content: `# How to Write a Game Bible: The World-Builder's Template

A Game Bible is the single document that defines your world. It's what the AI Game Master reads before your first session begins. A great Game Bible produces consistent, immersive storytelling. A vague one produces a Generic Fantasy Experience™. Here's how to write one worth playing.

## What Goes in a Game Bible

Think of your Game Bible as answers to six questions:

1. **What kind of world is this?**
2. **What's wrong with it right now?**
3. **Who are the major players?**
4. **What does it feel like to be here?**
5. **What are the rules?**
6. **Where does the story start?**

## Section 1: World Overview (1–2 paragraphs)

Name your world. Describe its scope (one city? a continent? multiple realms?). Give the historical period feel — medieval, Renaissance, post-apocalyptic, secondary-world modern. State the dominant tone: gritty and realistic, high fantasy, cosmic horror, political thriller, fairy tale.

*Example: "Valdenmoor is a decaying empire in its third century of slow collapse. Think late Roman Empire crossed with the Venetian Republic — bureaucratic corruption, mercenary armies, fading gods. The tone is dark and political, with occasional moments of unexpected grace."*

## Section 2: The Central Conflict

What is the one tension that defines the current moment in your world? This should be specific and active — something that is happening right now, not ancient history.

*Example: "The Emperor just died without an heir. Three Archduchies are mobilizing armies. A fourth is secretly negotiating with a foreign power. The Church has declared it will name the next emperor from among the clergy. Civil war is two weeks away."*

## Section 3: Factions (3–5)

For each faction, write 2–3 sentences covering: who they are, what they want, and what they're willing to do to get it. Don't write histories — write current agendas.

## Section 4: Tone & Sensory Language

Give the GM a list of sensory details specific to your world. What does the capital city smell like? What sounds fill a tavern? What does magic look like when cast? These details make the difference between generic narration and immersive storytelling.

## Section 5: Rules & Constraints

What can't happen in your world? What are the hard limits? Examples:
- "Magic is rare and feared — nobody casts spells openly"
- "This world has no elves or dwarves — all characters are human"
- "Death is permanent and treated with gravitas — no resurrection magic"
- "Technology is equivalent to 1400s Europe — no gunpowder yet"

The GM will respect these constraints throughout your campaign.

## Section 6: Opening Scenario

Describe the first scene in 2–3 sentences. Where is the player character? What's immediately happening? What's the first decision they need to make?

## Uploading Your Bible

EchoQuest accepts Game Bibles as plain text, PDF, or DOCX files up to 10MB. The AI parses your document, extracts the world data, and creates a playable campaign. Storyteller plan and above includes Bible upload access. **[See plans →](/)**
`,
  },
  {
    daysFromNow: 11,
    title: "Accessibility in Gaming: The State of Play in 2026",
    excerpt: "The gaming industry has made real progress on accessibility over the past decade — but significant gaps remain, especially for blind and visually impaired players. Here's an honest look at where things stand.",
    content: `# Accessibility in Gaming: The State of Play in 2026

The conversation around gaming accessibility has shifted dramatically over the past decade. What was once a niche concern addressed by volunteer modders is now something major studios publish accessibility trailers for. Progress is real. But so are the remaining gaps.

## What's Improved

**Subtitle and caption standards** have risen significantly. Most major releases now include speaker labels, sound effect descriptions, and positioning information in captions — not just dialogue transcripts.

**Colorblind modes** are nearly universal in AAA titles. Multiple colorblind profiles (deuteranopia, protanopia, tritanopia) are standard.

**Controller remapping** is now expected. Players with motor disabilities can remap any button to any input, use single-switch or eye-tracking setups, and adjust timing windows.

**Cognitive accessibility options** — simplified UI, objective markers, difficulty presets — have expanded significantly. Games like *The Last of Us Part II* published detailed accessibility documentation alongside launch.

## Where Significant Gaps Remain

**Blind and low vision players** remain dramatically underserved. Visual UI, map navigation, inventory management, and most combat systems require sight to use effectively. Screen reader support is rare and often broken when it exists. The percentage of mainstream games that a totally blind player can complete is tiny.

**Audio description** — verbal descriptions of visual cutscenes and story moments — is almost nonexistent outside of a handful of exceptions.

**Accessible documentation** — tutorials, wikis, strategy guides — is rarely produced in accessible formats.

**Small and indie studios** lack the resources that large studios have invested in accessibility tooling and testing. The accessibility gap between AAA and indie is enormous.

## Why EchoQuest Takes a Different Approach

Rather than retrofitting accessibility into an existing visual system, EchoQuest starts from the other direction: everything is audio and text first. The visual elements — images, interface design — are added on top of a system that works without them.

This isn't just philosophy. It changes the architecture. A screen reader reading EchoQuest's HTML gets clean, semantic, meaningful labels. A keyboard user gets logical tab order. A voice user gets commands that map to real game actions.

We're not done. We test with blind players regularly and publish our accessibility findings. We believe the best thing we can do for accessible gaming broadly is demonstrate that audio-first design is commercially viable and creatively rich.

**[Try EchoQuest free — no account required for your first session →](/library)**
`,
  },
  {
    daysFromNow: 12,
    title: "How Ambient Sound Design Elevates RPG Storytelling",
    excerpt: "The crackle of a fire, distant thunder, the low hum of a dungeon — ambient sound does more for immersion than any visual effect. Here's the science and craft behind EchoQuest's soundscapes.",
    content: `# How Ambient Sound Design Elevates RPG Storytelling

Close your eyes. Imagine a stone dungeon corridor. Now add: the slow drip of water echoing off walls, the distant scrape of something moving, the faint smell of torch smoke. You're there instantly. That's what ambient sound does. It collapses the distance between description and experience.

## The Neuroscience of Audio Immersion

Research in spatial audio and presence consistently shows that soundscapes activate the same cognitive processes as real environments. When your auditory cortex receives information consistent with "underground stone corridor," your threat assessment, spatial reasoning, and emotional state all shift accordingly — regardless of whether you're looking at an image.

For blind and visually impaired players, this isn't just immersion: it's orientation. Ambient sound communicates where you are and what kind of space you're in with precision that text description alone can't match.

## How EchoQuest's Soundscapes Work

Each location in an EchoQuest campaign has an associated ambient sound tag — things like `dungeon`, `forest`, `tavern`, `ocean`, `battlefield`, `throne_room`. When the AI Game Master moves you to a new location, the ambient track crossfades to the appropriate soundscape.

The AI generates `state_change` events that include `locationId`. EchoQuest uses that to trigger the matching audio loop on the client. The result is that sound shifts automatically as you move through the world — no button presses required.

## The Layers of a Good Soundscape

Effective ambient sound isn't just one loop. It's typically three layers:

**Base layer:** The constant environmental drone — rain, wind, cave echo, city crowd noise. This runs continuously and establishes the space.

**Mid layer:** Periodic sounds that occur every few seconds — a fire popping, distant church bells, an owl calling. These prevent the base layer from feeling stale.

**Event layer:** Triggered sounds tied to specific story moments — a door creaking open, a crowd going silent, thunder cracking at a dramatic reveal. These are the ones that create goosebumps.

EchoQuest currently handles the base and mid layers automatically. Event-layer sounds are triggered by the AI GM via sound cue events in the SSE stream.

## Volume Control

Ambient sound can overwhelm narration if it's too loud — particularly for players using hearing aids or who process audio differently. EchoQuest lets you adjust ambient volume independently of narration volume, or disable ambient sound entirely without affecting the TTS voice.

You'll find the ambient volume slider in **Settings → Voice** and in the in-game audio controls panel. **[Play your first session →](/library)**
`,
  },
];

function getPublishDate(daysFromNow: number): Date {
  const d = new Date("2026-05-01T00:00:00Z");
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(9, 0, 0, 0);
  return d;
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const created: string[] = [];
  const skipped: string[] = [];

  for (const p of POSTS) {
    const slug = slugify(p.title);
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) { skipped.push(slug); continue; }

    await prisma.blogPost.create({
      data: {
        title: p.title,
        slug,
        excerpt: p.excerpt,
        content: p.content,
        publishedAt: getPublishDate(p.daysFromNow),
        authorId: admin.id,
      },
    });
    created.push(slug);
  }

  return NextResponse.json({ created, skipped });
}
