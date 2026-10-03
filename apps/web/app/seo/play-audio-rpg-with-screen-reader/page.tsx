import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.us";

export const metadata: Metadata = {
  title: "Play an Audio RPG with a Screen Reader",
  description:
    "How to play EchoQuest's audio-first AI RPG with NVDA, JAWS, VoiceOver, or TalkBack. Keyboard controls, narration tuning, and tips for blind players.",
  alternates: { canonical: `${SITE_URL}/seo/play-audio-rpg-with-screen-reader` },
  openGraph: {
    title: "Play an Audio RPG with a Screen Reader | EchoQuest",
    description:
      "How to play EchoQuest's audio-first AI RPG with NVDA, JAWS, VoiceOver, or TalkBack.",
    url: `${SITE_URL}/seo/play-audio-rpg-with-screen-reader`,
    type: "article",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/seo` },
    {
      "@type": "ListItem",
      position: 3,
      name: "Play an audio RPG with a screen reader",
      item: `${SITE_URL}/seo/play-audio-rpg-with-screen-reader`,
    },
  ],
};

export default function SeoLandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold text-foreground">
          Play an audio RPG with a screen reader
        </h1>
        <p className="mt-4 text-base text-muted">
          EchoQuest is an audio-first AI tabletop RPG built so blind and visually impaired
          players can run a campaign without a sighted GM, a battle map, or a printed
          rulebook. Every menu is reachable by keyboard, every scene is narrated aloud,
          and every interaction works under NVDA, JAWS, VoiceOver, and TalkBack.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Why most RPGs don&rsquo;t work with screen readers
        </h2>
        <p className="mt-3 text-base text-muted">
          Traditional digital tabletop tools were built around a visual battle map: tokens,
          fog of war, drag-and-drop initiative trackers. Screen readers can announce a
          character sheet but they can&rsquo;t describe a 30&times;30 grid in a way you can play
          from. Even text-heavy interactive fiction usually buries scene descriptions inside
          UI chrome that ARIA can&rsquo;t reach.
        </p>
        <p className="mt-3 text-base text-muted">
          EchoQuest takes the opposite approach: the narration <em>is</em> the interface.
          The AI Game Master describes every scene aloud through your browser&rsquo;s
          text-to-speech (or, on premium tiers, through ElevenLabs), and your responses
          go back through a single text field that screen readers handle natively.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          What works out of the box
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base text-muted">
          <li>
            <strong className="text-foreground">Full keyboard navigation.</strong> Tab
            order is consistent across pages; every interactive control has a visible focus
            ring and an ARIA label.
          </li>
          <li>
            <strong className="text-foreground">Live regions for narration.</strong>{" "}
            When TTS is muted, scene text routes to a polite live region so your screen
            reader picks it up.
          </li>
          <li>
            <strong className="text-foreground">No double-speech.</strong> When TTS is
            audible, EchoQuest suppresses the live-region update so VoiceOver and TalkBack
            don&rsquo;t read on top of the narration.
          </li>
          <li>
            <strong className="text-foreground">Skip links and landmarks.</strong>{" "}
            Every page exposes <code>main</code>, <code>nav</code>, and <code>contentinfo</code>{" "}
            landmarks so you can jump with a single command.
          </li>
          <li>
            <strong className="text-foreground">Press <kbd>H</kbd> for shortcuts.</strong>{" "}
            A keyboard reference is one keystroke away during play.
          </li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Tested screen readers
        </h2>
        <p className="mt-3 text-base text-muted">
          We test every release with NVDA + Firefox on Windows, JAWS + Chrome on Windows,
          VoiceOver + Safari on macOS and iOS, and TalkBack + Chrome on Android. If you
          find a regression, please <Link href="/contact-us" className="hover:underline text-accent">let us know</Link> — accessibility regressions are
          treated as P0 bugs.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Tuning the narrator voice
        </h2>
        <p className="mt-3 text-base text-muted">
          The narrator&rsquo;s speed, pitch, and volume are adjustable in real time during
          play. On the free tier, EchoQuest uses your browser&rsquo;s built-in voices; on the
          Storyteller tier and above, you get ElevenLabs voices that handle long-form
          narration much more naturally. None of the accessibility features are locked
          behind a paywall.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/library" className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-accent-solid text-on-accent">
            Open the adventure library
          </Link>
          <Link href="/campaigns" className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold border-border text-foreground">
            Browse campaign worlds
          </Link>
        </div>
      </main>
    </div>
  );
}
