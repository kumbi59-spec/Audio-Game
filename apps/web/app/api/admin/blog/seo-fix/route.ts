import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildExcerpt(content: string): string {
  const plain = stripMarkdown(content);
  if (plain.length <= 155) return plain;
  return `${plain.slice(0, 152).trimEnd()}...`;
}

function improveContent(title: string, content: string): string {
  const lower = content.toLowerCase();
  const keyPhrase = title.split(/\s+/).slice(0, 4).join(" ").trim();
  let next = content.trim();

  const first100Words = stripMarkdown(content).toLowerCase().split(/\s+/).slice(0, 100).join(" ");
  if (keyPhrase && !first100Words.includes(keyPhrase.toLowerCase())) {
    next = `${title} is the focus of this guide.\n\n${next}`;
  }
  if (!/^#{2,3}\s+/m.test(next)) {
    next += "\n\n## Key Takeaways\n- Apply these steps consistently to improve search visibility.\n";
  }
  if (!/\]\(\/(blog|library|campaigns|pricing|worlds)[^)]+\)/i.test(next)) {
    next += "\n\nRelated reading: [Browse all EchoQuest blog posts](/blog).";
  }
  if (!/\]\(https?:\/\/(?!echoquest\.app)[^)]+\)/i.test(next)) {
    next += "\n\nReference: [Google Search SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).";
  }

  return next.trim();
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.blogPost.findMany();
  const updated: string[] = [];

  for (const post of posts) {
    const nextContent = improveContent(post.title, post.content);
    const nextExcerpt = post.excerpt.trim().length >= 80 ? post.excerpt.trim() : buildExcerpt(nextContent);
    if (nextContent !== post.content || nextExcerpt !== post.excerpt) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content: nextContent, excerpt: nextExcerpt },
      });
      updated.push(post.slug);
    }
  }

  return NextResponse.json({ ok: true, updatedCount: updated.length, updated });
}
