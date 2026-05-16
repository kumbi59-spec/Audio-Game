import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";
import { marked } from "marked";
import { prisma } from "@/lib/db";
import { AdBanner } from "@/components/ads/AdBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { planSectionImages } from "@/lib/blog/section-image-plan";
import { stripContentImages } from "@/lib/blog/strip-images";

export const revalidate = 60;

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

// Split rendered HTML into chunks at each <h2> boundary so AdSense units can
// be interleaved between body sections. The first chunk is everything up to
// (but not including) the first H2; subsequent chunks each start with their H2.
function splitHtmlOnH2(html: string): string[] {
  const parts: string[] = [];
  const re = /<h2\b[^>]*>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push(html.slice(lastIndex, match.index));
    }
    lastIndex = match.index;
  }
  if (lastIndex < html.length) parts.push(html.slice(lastIndex));
  return parts.filter((p) => p.trim().length > 0);
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });
  } catch (err) { console.error("[blog] DB query failed:", err); }
  if (!post) return { title: "Not Found" };
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const ogImage = `${canonical}/opengraph-image`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
      siteName: "EchoQuest Blog",
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true } },
        images: { orderBy: { idx: "asc" }, select: { id: true, idx: true, alt: true } },
      },
    });
  } catch (err) { console.error("[blog] DB query failed:", err); }

  if (!post || !post.publishedAt || post.publishedAt > new Date()) notFound();

  // Strip any legacy embedded images from the body before rendering. All
  // blog imagery is BFL-generated and delivered out-of-band (coverImageUrl
  // hero + interleaved BlogPostImage rows); old seed runs injected stock
  // ![](…) images into the content, which we never want shown.
  const cleanContent = stripContentImages(post.content);
  const htmlContent = await marked(cleanContent, { async: true });
  const sections = splitHtmlOnH2(htmlContent);

  // Map "section index to render the image after" → image record. The plan
  // (shared with the generator) tells us which H2 each image idx targets.
  //
  // splitHtmlOnH2 emits one chunk per <h2>, preceded by a leading intro
  // chunk ONLY when there's non-empty content before the first <h2> (it
  // filters empty chunks). So heading index j maps to:
  //   sections[j + 1]  when an intro chunk exists, else
  //   sections[j]      when the post opens directly with an <h2>.
  // Derive the offset from (#sections − #H2s) instead of assuming an intro.
  const h2Count = (htmlContent.match(/<h2\b/gi) ?? []).length;
  const introOffset = Math.max(0, sections.length - h2Count); // 1 if intro, else 0
  const plan = planSectionImages(post.content);
  const imageBySectionIndex = new Map<number, { id: string; alt: string }>();
  for (const img of post.images) {
    const planned = plan.find((p) => p.idx === img.idx);
    if (planned) {
      imageBySectionIndex.set(planned.headingIndex + introOffset, { id: img.id, alt: img.alt });
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        url: `${SITE_URL}/blog/${post.slug}`,
        datePublished: post.publishedAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: {
          "@type": "Person",
          name: post.author.name ?? "EchoQuest Team",
        },
        publisher: {
          "@type": "Organization",
          name: "EchoQuest",
          url: SITE_URL,
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
        <SiteHeader />
        {post.coverImageUrl && (
          <div className="border-b" style={{ borderColor: "var(--border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- base64 data: URL, next/image would re-encode unnecessarily */}
            <img
              src={post.coverImageUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        )}
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
          <article className="blog-content">
            {(() => {
              // Drop an ad after the 2nd and 5th H2-bounded section. Falls
              // through gracefully on shorter posts: the AdBanner just won't
              // be inserted past the last section.
              const adAfter = new Set([1, 4]);
              return sections.map((s, i) => {
                const img = imageBySectionIndex.get(i);
                return (
                  <Fragment key={i}>
                    <div dangerouslySetInnerHTML={{ __html: s }} />
                    {img && (
                      <figure className="my-8">
                        {/* eslint-disable-next-line @next/next/no-img-element -- served from our own cached /api/blog/image route, not a static asset */}
                        <img
                          src={`/api/blog/image/${img.id}`}
                          alt={img.alt}
                          className="aspect-[16/9] w-full rounded-xl object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </figure>
                    )}
                    {adAfter.has(i) && i < sections.length - 1 && (
                      <div className="my-8">
                        <AdBanner />
                      </div>
                    )}
                  </Fragment>
                );
              });
            })()}
            <div className="mt-8">
              <AdBanner />
            </div>
          </article>
          <div className="mt-12 border-t pt-8" style={{ borderColor: "var(--border)" }}>
            <Link href="/blog" className="text-sm font-semibold hover:underline" style={{ color: "var(--accent)" }}>← Back to all posts</Link>
          </div>
        </main>
      </div>
    </>
  );
}
