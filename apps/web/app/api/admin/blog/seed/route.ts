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
