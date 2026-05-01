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
