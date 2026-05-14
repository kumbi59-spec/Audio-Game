import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, updates, world-building guides, and stories from the EchoQuest team.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
    types: {
      "application/rss+xml": [{ url: `${SITE_URL}/blog/feed.xml`, title: "EchoQuest Blog RSS" }],
    },
  },
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
  let posts: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    publishedAt: Date | null;
    coverImageUrl: string | null;
  }[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { publishedAt: { not: null, lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true, coverImageUrl: true },
    });
  } catch {
    // Table may not exist yet during build-time static generation (before migrations run)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <header className="border-b px-6 py-10" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Blog</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-muted)" }}>Tips, updates, and stories from the team.</p>
        </div>
      </header>

            <main className="mx-auto max-w-3xl px-6 py-12">
        <nav aria-label="Related exploration" className="mb-8 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Keep exploring</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <Link href="/campaigns" className="hover:underline" style={{ color: "var(--accent)" }}>Campaign worlds</Link>
            <Link href="/seo/play-audio-rpg-with-screen-reader" className="hover:underline" style={{ color: "var(--accent)" }}>Screen reader RPG guide</Link>
            <Link href="/library" className="hover:underline" style={{ color: "var(--accent)" }}>Adventure library</Link>
          </div>
        </nav>
        {posts.length === 0 ? (
          <p className="text-center text-base" style={{ color: "var(--text-muted)" }}>No posts yet — check back soon.</p>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="overflow-hidden rounded-xl border transition-shadow hover:shadow-lg"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                  {post.coverImageUrl && (
                    <Link href={`/blog/${post.slug}`} aria-hidden="true" tabIndex={-1} className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element -- base64 data: URL, next/image would re-encode unnecessarily */}
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="aspect-[16/9] w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  )}
                  <div className="p-6">
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
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
