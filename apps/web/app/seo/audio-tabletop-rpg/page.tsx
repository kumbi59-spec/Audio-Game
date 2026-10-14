import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { serializeJsonLd } from "@/lib/blog/render-markdown";
import { seedPostSlug } from "@/lib/blog/seed-posts/types";
import { SEO_CAMPAIGNS } from "@/lib/seo-campaigns";
import { BRAND_TTRPG } from "@/lib/seo/brand";
import { guideBreadcrumbJsonLd, guideFaqJsonLd, type GuideFaq } from "@/lib/seo/guide-jsonld";
import { getSiteUrl } from "@/lib/site-url";

const PATH = "/seo/audio-tabletop-rpg";
const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: "Audio Tabletop RPG & Audio Stories",
  description:
    "EchoQuest TTRPG is an audio-first tabletop RPG: an AI narrator voices every scene and you decide what happens next. Interactive audio stories, free to start.",
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: `Audio Tabletop RPG | ${BRAND_TTRPG}`,
    description:
      "An audio-first RPG narrated by an AI Game Master: interactive audio stories where your choices drive the plot.",
    url: `${SITE_URL}${PATH}`,
    type: "article",
  },
};

const FAQS: GuideFaq[] = [
  {
    question: "What is an audio tabletop RPG?",
    answer:
      "A tabletop role-playing game you play by listening and talking instead of reading a map or rolling dice on a table. In EchoQuest an AI Game Master narrates the story aloud and you say or type what your character does.",
  },
  {
    question: "How is it different from an audiobook or a podcast?",
    answer:
      "An audiobook tells the same story to everyone. In an audio RPG the story waits for you: every scene ends with your decision, and the narrator continues from what you chose.",
  },
  {
    question: "What does the narration sound like?",
    answer:
      "The Free tier narrates with your browser's built-in voices. The Storyteller plan adds premium ElevenLabs narration, with distinct voices for the characters you meet.",
  },
];

const RELATED = ["Interactive Audio Stories: How They Differ From Audiobooks and Podcasts"];

export default function Page() {
  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(guideBreadcrumbJsonLd("Audio tabletop RPG", PATH)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(guideFaqJsonLd(PATH, FAQS)) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold text-foreground">
          An audio tabletop RPG: interactive stories you play out loud
        </h1>
        <p className="mt-4 text-base text-muted">
          {BRAND_TTRPG} is a screen-reader friendly, AI-narrated audio tabletop role-playing
          game. It is built audio first: the story is told aloud, every choice can be made by
          voice or keyboard, and the screen is optional.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Audio first, not audio added
        </h2>
        <p className="mt-3 text-base text-muted">
          Most games add narration on top of something you have to watch. EchoQuest starts from
          the narration. An AI Game Master voices each scene, sound cues mark discoveries and
          danger, and optional ambient sound sets the mood, so you can follow the whole
          adventure with your eyes closed.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Hear how a session goes
        </h2>
        <p className="mt-3 text-base text-muted">
          Each official campaign page has a short transcript of real play, so you can see how
          the Game Master and the player trade turns before you start:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base">
          {SEO_CAMPAIGNS.map((campaign) => (
            <li key={campaign.slug}>
              <Link href={`/campaigns/${campaign.slug}`} className="hover:underline text-accent">{campaign.name}</Link>
              <span className="text-muted"> &mdash; {campaign.hook}</span>
            </li>
          ))}
        </ul>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mt-10 text-2xl font-semibold text-foreground">
            Common questions
          </h2>
          <dl className="mt-3 space-y-4 text-base">
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="font-semibold text-foreground">{faq.question}</dt>
                <dd className="mt-1 text-muted">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Further reading
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base">
          {RELATED.map((title) => (
            <li key={title}>
              <Link href={`/blog/${seedPostSlug(title)}`} className="hover:underline text-accent">{title}</Link>
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
