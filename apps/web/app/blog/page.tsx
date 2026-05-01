import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, updates, world-building guides, and stories from the EchoQuest team.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "EchoQuest Blog",
    description: "Tips, updates, world-building guides, and stories from the EchoQuest team.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoQuest Blog",
    description: "Tips, updates, world-building guides, and stories from the EchoQuest team.",
  },
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true },
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="border-b px-6 py-10" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="mb-4 inline-block text-sm hover:underline" style={{ color: "var(--text-muted)" }}>← Back to EchoQuest</Link>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Blog</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-muted)" }}>Tips, updates, and stories from the team.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {posts.length === 0 ? (
          <p className="text-center text-base" style={{ color: "var(--text-muted)" }}>No posts yet — check back soon.</p>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="rounded-xl border p-6 transition-shadow hover:shadow-lg"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                  <time dateTime={post.publishedAt!.toISOString()} className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(post.publishedAt!).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                  <h2 className="mt-2 text-xl font-bold" style={{ color: "var(--text)" }}>
                    <Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`}
                    className="mt-4 inline-block text-sm font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}>
                    Read more →
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
