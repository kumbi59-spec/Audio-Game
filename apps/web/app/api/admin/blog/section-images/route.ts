import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { generateBlogSectionImage, blogCoverProviderDiagnostic } from "@/lib/ai/blog-cover-gen";
import { planSectionImages } from "@/lib/blog/section-image-plan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Slot {
  postId: string;
  postTitle: string;
  idx: number;
  heading: string;
  headingIndex: number;
}

// Flatten every (post, planned image idx) pair across all posts into one
// ordered list. Order: posts by createdAt asc, then idx asc within a post.
// This is the canonical traversal both GET (status) and POST (cursor) use.
async function allSlots(): Promise<{ slot: Slot; content: string }[]> {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, content: true },
  });
  const slots: { slot: Slot; content: string }[] = [];
  for (const p of posts) {
    for (const plan of planSectionImages(p.content)) {
      slots.push({
        slot: {
          postId: p.id,
          postTitle: p.title,
          idx: plan.idx,
          heading: plan.heading,
          headingIndex: plan.headingIndex,
        },
        content: p.content,
      });
    }
  }
  return slots;
}

/** Body text under the Nth H2 heading, for visual-cue extraction. */
function sectionBody(markdown: string, headingIndex: number): string {
  const parts = markdown.split(/^##\s+.+$/gm);
  // parts[0] is the pre-first-H2 intro; parts[k+1] is the body after the
  // (k)-th H2. So heading index j → parts[j + 1].
  return (parts[headingIndex + 1] ?? "").trim().slice(0, 400);
}

/**
 * GET — per-post section-image status + provider config health.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const slots = await allSlots();
  const existing = await prisma.blogPostImage.findMany({
    select: { postId: true, idx: true },
  });
  const have = new Set(existing.map((e) => `${e.postId}:${e.idx}`));

  const planned = slots.length;
  const generated = slots.filter((s) => have.has(`${s.slot.postId}:${s.slot.idx}`)).length;

  return NextResponse.json({
    summary: { planned, generated, missing: planned - generated },
    configError: blogCoverProviderDiagnostic(),
  });
}

/**
 * POST — generate exactly one section image and report the next cursor.
 *
 *   (no params)        first missing slot in canonical order.
 *   ?postId=&idx=      process exactly this slot (loop cursor; required so
 *                      the force loop advances instead of re-finding the
 *                      same first slot every call — same bug class as the
 *                      cover endpoint cursor fix).
 *   ?force=true        ignore "already generated"; walk every slot. First
 *                      call has no cursor (seed = first slot); subsequent
 *                      calls pass nextPostId/nextIdx.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configError = blogCoverProviderDiagnostic();
  if (configError) {
    return NextResponse.json({ status: "failed", reason: configError }, { status: 400 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  const curPostId = url.searchParams.get("postId");
  const curIdx = url.searchParams.get("idx");

  const slots = await allSlots();
  if (slots.length === 0) {
    return NextResponse.json({ status: "ok", done: true, message: "No posts have enough H2 sections for images." });
  }

  const existing = await prisma.blogPostImage.findMany({ select: { postId: true, idx: true } });
  const have = new Set(existing.map((e) => `${e.postId}:${e.idx}`));

  // Resolve the slot to process.
  let target: { slot: Slot; content: string } | undefined;
  if (curPostId && curIdx !== null) {
    target = slots.find((s) => s.slot.postId === curPostId && s.slot.idx === Number(curIdx));
    if (!target) {
      return NextResponse.json(
        { status: "failed", reason: `No planned slot for postId=${curPostId} idx=${curIdx}` },
        { status: 404 },
      );
    }
  } else {
    target = force
      ? slots[0]
      : slots.find((s) => !have.has(`${s.slot.postId}:${s.slot.idx}`));
  }

  if (!target) {
    return NextResponse.json({ status: "ok", done: true, message: "All planned section images already generated." });
  }

  const result = await generateBlogSectionImage({
    title: target.slot.postTitle,
    heading: target.slot.heading,
    sectionText: sectionBody(target.content, target.slot.headingIndex),
    idx: target.slot.idx,
  });

  if (result.error) {
    return NextResponse.json({
      status: "failed",
      postTitle: target.slot.postTitle,
      postId: target.slot.postId,
      idx: target.slot.idx,
      reason: result.error,
    });
  }

  // Upsert so a force regen replaces the existing image in place (and keeps
  // the same idx → render placement) instead of duplicating.
  await prisma.blogPostImage.upsert({
    where: { postId_idx: { postId: target.slot.postId, idx: target.slot.idx } },
    create: {
      postId: target.slot.postId,
      idx: target.slot.idx,
      dataUrl: result.url,
      alt: `Illustration for the section "${target.slot.heading}"`,
    },
    update: {
      dataUrl: result.url,
      alt: `Illustration for the section "${target.slot.heading}"`,
    },
  });

  // Compute the next cursor.
  const pos = slots.findIndex(
    (s) => s.slot.postId === target!.slot.postId && s.slot.idx === target!.slot.idx,
  );
  let next: Slot | undefined;
  if (force) {
    next = slots[pos + 1]?.slot;
  } else {
    have.add(`${target.slot.postId}:${target.slot.idx}`);
    next = slots.find((s) => !have.has(`${s.slot.postId}:${s.slot.idx}`))?.slot;
  }

  return NextResponse.json({
    status: "ok",
    postTitle: target.slot.postTitle,
    postId: target.slot.postId,
    idx: target.slot.idx,
    nextPostId: next?.postId ?? null,
    nextIdx: next?.idx ?? null,
    done: !next,
  });
}
