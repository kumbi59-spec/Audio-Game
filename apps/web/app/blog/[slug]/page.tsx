import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { prisma } from "@/lib/db";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Not Found | EchoQuest" };
  return {
    title: `${post.title} | EchoQuest Blog`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });

  if (!post || !post.publishedAt || post.publishedAt > new Date()) notFound();

  const htmlContent = await marked(post.content, { async: true });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="border-b px-6 py-10" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="mb-4 inline-block text-sm hover:underline" style={{ color: "var(--text-muted)" }}>← All posts</Link>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>{post.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <time dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            {post.author.name && (
              <>
                <span aria-hidden>·</span>
                <span>{post.author.name}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article
          className="prose prose-invert max-w-none"
          style={{ color: "var(--text)" }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        <div className="mt-12 border-t pt-8" style={{ borderColor: "var(--border)" }}>
          <Link href="/blog" className="text-sm font-semibold hover:underline" style={{ color: "var(--accent)" }}>← Back to all posts</Link>
        </div>
      </main>
    </div>
  );
}
