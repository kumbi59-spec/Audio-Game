import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { serializeJsonLd } from "@/lib/blog/render-markdown";
import { seedPostSlug } from "@/lib/blog/seed-posts/types";
import { BRAND_TTRPG } from "@/lib/seo/brand";
import { guideBreadcrumbJsonLd, guideFaqJsonLd, type GuideFaq } from "@/lib/seo/guide-jsonld";
import { getSiteUrl } from "@/lib/site-url";

const PATH = "/seo/audio-games-for-the-blind";
const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: "Audio Games for the Blind",
  description:
    "EchoQuest TTRPG is an audio game for blind and low-vision players: a screen-reader friendly tabletop RPG narrated by an AI Game Master. Free to start.",
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: `Audio Games for the Blind | ${BRAND_TTRPG}`,
    description:
      "A tabletop RPG you play entirely by ear, with NVDA, JAWS, VoiceOver or TalkBack, narrated by an AI Game Master.",
    url: `${SITE_URL}${PATH}`,
    type: "article",
  },
};

const FAQS: GuideFaq[] = [
  {
    question: "Can I play EchoQuest without any sight?",
    answer:
      "Yes. Every scene is narrated aloud, every menu is reachable by keyboard, and announcements that aren't spoken go to screen-reader live regions. Nothing in play depends on seeing the screen.",
  },
  {
    question: "Which screen readers does EchoQuest work with?",
    answer:
      "EchoQuest is tested with NVDA, JAWS, VoiceOver and TalkBack. It runs in a web browser, so there is nothing to install.",
  },
  {
    question: "Is it free for blind players?",
    answer:
      "The Free tier includes three official campaigns, browser text-to-speech, 60 AI turns a day and full keyboard and screen-reader support. Accessibility features are never behind a paywall.",
  },
];

const RELATED = [
  "Audio Games for Blind People: 10 Genres You Can Play Entirely by Ear",
  "Games You Can Play With a Screen Reader: NVDA, JAWS and VoiceOver Tips",
];

export default function Page() {
  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(guideBreadcrumbJsonLd("Audio games for the blind", PATH)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(guideFaqJsonLd(PATH, FAQS)) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold text-foreground">
          Audio games for the blind: a tabletop RPG you play by ear
        </h1>
        <p className="mt-4 text-base text-muted">
          {BRAND_TTRPG} is a screen-reader friendly, AI-narrated audio tabletop role-playing
          game. An AI Game Master describes the world, speaks for the characters and reacts to
          whatever you decide to do, so the whole adventure works without looking at a screen.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Built to be played without sight
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base text-muted">
          <li>Every scene is narrated aloud, from the opening to each turn&rsquo;s choices.</li>
          <li>Every menu and control is reachable by keyboard, with single-key shortcuts during play.</li>
          <li>Tested with NVDA, JAWS, VoiceOver and TalkBack on every release.</li>
          <li>Damage, items and discoveries are announced to your screen reader as they happen.</li>
          <li>You can speak your actions instead of typing them.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Low vision? Make it fit your eyes
        </h2>
        <p className="mt-3 text-base text-muted">
          If you play with some sight, the{" "}
          <Link href="/settings/display" className="hover:underline text-accent">display settings</Link>{" "}
          offer a high-contrast theme, larger text and reduced motion, and they follow your
          system preferences by default. The narration is also shown as text, so you can read
          along while it plays.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          What you can play
        </h2>
        <p className="mt-3 text-base text-muted">
          Start with the official campaigns, from colony-ship mystery to desert archaeology,
          or explore worlds other players have built. There are no battle maps or dice to read:
          the Game Master tells you what happens, and you answer in plain language.
        </p>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mt-10 text-2xl font-semibold text-foreground">
            Questions blind players ask
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
