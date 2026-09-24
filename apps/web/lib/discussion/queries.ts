import { prisma } from "@/lib/db";

export const THREAD_PAGE_SIZE = 20;
export const COMMENTS_PER_THREAD = 50;

export type DiscussionCommentDto = { id: string; text: string; author: string; createdAt: string };
export type DiscussionThreadDto = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  comments: DiscussionCommentDto[];
};

// Starter threads, stored under a system author so they behave like any
// other thread (comments, moderation). Created on first read.
const SYSTEM_AUTHOR_ID = "system-echoquest-team";
const SEED_THREADS = [
  {
    id: "best-audio-rpg-builds-2026",
    title: "Best Audio RPG Character Builds in 2026 (Screen Reader Friendly)",
    body: "Share your strongest and most accessible character builds for voice-first campaigns.",
  },
  {
    id: "how-to-master-voice-text-adventure",
    title: "How to Master Voice Text Adventure Games: Beginner to Pro Guide",
    body: "Post your tips for faster command phrasing, better narration recaps, and smarter combat choices.",
  },
];
let seeded: Promise<void> | null = null;

async function seedThreads(): Promise<void> {
  await prisma.user.upsert({
    where: { id: SYSTEM_AUTHOR_ID },
    create: { id: SYSTEM_AUTHOR_ID, email: "team@system.echoquest.invalid", name: "EchoQuest Team" },
    update: {},
  });
  for (const [i, thread] of SEED_THREADS.entries()) {
    await prisma.discussionThread.upsert({
      where: { id: thread.id },
      create: {
        ...thread,
        authorId: SYSTEM_AUTHOR_ID,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, SEED_THREADS.length - i)),
      },
      update: {},
    });
  }
}

export function ensureSeedThreads(): Promise<void> {
  seeded ??= seedThreads().catch((err) => {
    seeded = null;
    throw err;
  });
  return seeded;
}

// Public display name only — never fall back to the author's email.
function displayName(author: { name: string | null }): string {
  return author.name?.trim() || "Adventurer";
}

function toCommentDto(c: { id: string; text: string; createdAt: Date; author: { name: string | null } }): DiscussionCommentDto {
  return { id: c.id, text: c.text, author: displayName(c.author), createdAt: c.createdAt.toISOString() };
}

export async function listThreads(cursor: string | null, take = THREAD_PAGE_SIZE) {
  const rows = await prisma.discussionThread.findMany({
    where: { hidden: false },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: { select: { name: true } },
      comments: {
        where: { hidden: false },
        orderBy: { createdAt: "asc" },
        take: COMMENTS_PER_THREAD,
        include: { author: { select: { name: true } } },
      },
    },
  });
  const page = rows.slice(0, take);
  const threads: DiscussionThreadDto[] = page.map((t) => ({
    id: t.id,
    title: t.title,
    body: t.body,
    author: displayName(t.author),
    createdAt: t.createdAt.toISOString(),
    comments: t.comments.map(toCommentDto),
  }));
  return { threads, nextCursor: rows.length > take ? page[page.length - 1]!.id : null };
}

export async function createThread(authorId: string, title: string, body: string): Promise<DiscussionThreadDto> {
  const t = await prisma.discussionThread.create({
    data: { authorId, title, body },
    include: { author: { select: { name: true } } },
  });
  return {
    id: t.id,
    title: t.title,
    body: t.body,
    author: displayName(t.author),
    createdAt: t.createdAt.toISOString(),
    comments: [],
  };
}

export async function createComment(threadId: string, authorId: string, text: string): Promise<DiscussionCommentDto | null> {
  const thread = await prisma.discussionThread.findFirst({ where: { id: threadId, hidden: false }, select: { id: true } });
  if (!thread) return null;
  const c = await prisma.discussionComment.create({
    data: { threadId, authorId, text },
    include: { author: { select: { name: true } } },
  });
  return toCommentDto(c);
}
