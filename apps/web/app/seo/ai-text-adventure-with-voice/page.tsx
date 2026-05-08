import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "AI Text Adventure with Voice",
  description:
    "Play an AI text adventure with live narration and voice input. EchoQuest turns natural-language choices into adaptive story beats in real time.",
  alternates: { canonical: `${SITE_URL}/seo/ai-text-adventure-with-voice` },
  openGraph: {
    title: "AI Text Adventure with Voice | EchoQuest",
    description:
      "Speak your actions, hear them narrated. EchoQuest is an AI text adventure that listens and responds.",
    url: `${SITE_URL}/seo/ai-text-adventure-with-voice`,
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
      name: "AI text adventure with voice",
      item: `${SITE_URL}/seo/ai-text-adventure-with-voice`,
    },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          AI text adventure with voice
        </h1>
        <p className="mt-4 text-base" style={{ color: "var(--text-muted)" }}>
          EchoQuest turns the &ldquo;text adventure&rdquo; format inside out: instead of
          typing <code>&gt; LOOK NORTH</code> into a parser, you speak (or type) what
          your character does in plain language. The AI Game Master narrates the
          consequence aloud and keeps track of the world state so the next scene
          remembers what you did.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          How the voice loop works
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-base" style={{ color: "var(--text-muted)" }}>
          <li>The GM narrates the current scene through the browser&rsquo;s speech engine (or ElevenLabs on paid tiers).</li>
          <li>You speak your action when narration ends &mdash; &ldquo;I check the door for traps before I open it.&rdquo;</li>
          <li>EchoQuest transcribes your speech, sends it to the AI GM with the scene context, and reads the response back.</li>
          <li>You can interrupt, repeat the last line, or fall back to the keyboard at any moment.</li>
        </ol>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Why this is different from a chatbot
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          Chatbots forget. Text adventures track inventory, location, NPC relationships,
          and consequence. EchoQuest&rsquo;s GM engine maintains a structured world state
          so the dragon you killed in act one stays dead, the gold you spent stays spent,
          and the NPC you betrayed in scene three remembers it in scene seven. The voice
          interface sits on top of that engine &mdash; not on top of a free-form chat.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Hands-free, eyes-free
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          Because both input and output are audio-native, you can play while cooking,
          driving (use carefully &mdash; the GM <em>will</em> stop and wait for you),
          walking, or recovering from screen fatigue. The accessibility design is the
          same design as the voice design: anything a screen reader can read, you can
          hear; anything you can say, the parser can understand.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Bring your own setting
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          On the Storyteller tier, upload a PDF of your own setting and the GM will
          use it as its source of truth. Solo writers use this to play inside their own
          drafts; GMs use it to test homebrew before running it for a table.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/library" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            Start free in the library
          </Link>
          <Link href="/campaigns" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Read a sample transcript
          </Link>
        </div>
      </main>
    </div>
  );
}
