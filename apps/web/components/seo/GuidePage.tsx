import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { serializeJsonLd } from "@/lib/blog/render-markdown";
import { seedPostSlug } from "@/lib/blog/seed-posts/types";
import { getSiteUrl } from "@/lib/site-url";

export type GuideFaq = { question: string; answer: string };

type GuideMeta = {
  /** Path segment under /seo. */
  slug: string;
  title: string;
  description: string;
};

/** Metadata for a /seo guide: canonical URL plus matching Open Graph tags. */
export function guideMetadata({ slug, title, description }: GuideMeta): Metadata {
  const url = `${getSiteUrl()}/seo/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | EchoQuest TTRPG`, description, url, type: "article" },
  };
}

/** Link to a seeded blog post by its title, so the URL follows the slug rule. */
export function blogHref(title: string): string {
  return `/blog/${seedPostSlug(title)}`;
}

type Props = {
  slug: string;
  /** Visible H1 and the last breadcrumb. */
  heading: string;
  faqs: GuideFaq[];
  related: { href: string; label: string }[];
  children: React.ReactNode;
};

/**
 * Shared shell for the long-tail /seo guides: breadcrumb and FAQ structured
 * data, the page heading, the body, a visible FAQ, related reading and the
 * play calls to action.
 */
export function GuidePage({ slug, heading, faqs, related, children }: Props) {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/seo` },
          { "@type": "ListItem", position: 3, name: heading, item: `${siteUrl}/seo/${slug}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold text-foreground">{heading}</h1>
        {children}

        <h2 className="mt-10 text-2xl font-semibold text-foreground">Frequently asked questions</h2>
        <dl className="mt-3 space-y-4">
          {faqs.map((f) => (
            <div key={f.question}>
              <dt className="font-semibold text-foreground">{f.question}</dt>
              <dd className="mt-1 text-base text-muted">{f.answer}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">Further reading</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base">
          {related.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="text-accent hover:underline">{r.label}</Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/campaigns" className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-accent-solid text-on-accent">
            Explore official campaigns
          </Link>
          <Link href="/library" className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold border-border text-foreground">
            Open the adventure library
          </Link>
        </div>
      </main>
    </div>
  );
}
