"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useSession } from "next-auth/react";

const FEATURES = [
  {
    title: "Audio-First Design",
    body: "Every scene is narrated aloud. Every menu is reachable by keyboard and voice. Built for blind and sighted adventurers from day one — not as an afterthought.",
    icon: "🎙",
  },
  {
    title: "Living AI Game Master",
    body: "Claude AI responds to anything you say — not just preset choices. Describe actions, ask questions, go off-script. The story adapts.",
    icon: "🧠",
  },
  {
    title: "Community Worlds",
    body: "Upload a PDF of your own rules and lore and play it immediately. Publish it so others can explore your world.",
    icon: "🌍",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Choose a world", body: "Pick from official campaigns or community creations. Or upload your own Game Bible." },
  { step: "2", title: "Create your character", body: "Name them, choose an origin, set your stats. Takes under a minute." },
  { step: "3", title: "Play", body: "The AI Game Master narrates. You respond by voice, keyboard, or text. The story goes where you take it." },
];

const PRICING = [
  {
    tier: "Free",
    price: "$0",
    period: "",
    highlight: false,
    features: ["3 official campaigns", "Browser text-to-speech", "60 AI turns/day (1 turn = 1 minute credit)", "Full keyboard & screen-reader support"],
    cta: "Start Playing",
    href: "/library",
  },
  {
    tier: "Storyteller",
    price: "$15",
    period: "/month",
    highlight: true,
    features: ["Unlimited campaigns", "ElevenLabs premium narration", "Unlimited saves", "Game Bible upload", "No ads"],
    cta: "Get Storyteller",
    href: "/api/payments/checkout?tier=storyteller_monthly",
  },
  {
    tier: "Creator",
    price: "$29",
    period: "/month",
    highlight: false,
    features: ["Everything in Storyteller", "World Builder Wizard", "Publish worlds publicly", "Creator analytics"],
    cta: "Get Creator",
    href: "/api/payments/checkout?tier=creator_monthly",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { narrate } = useAnnouncer();
  const { data: session } = useSession();

  useEffect(() => {
    narrate("Welcome to EchoQuest. Audio-first interactive storytelling with an AI Game Master.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const upgraded = new URLSearchParams(window.location.search).get("upgraded");
    if (upgraded === "true") {
      void fetch("/api/auth/refresh-tier", { method: "POST" });
      narrate("Your plan has been upgraded! Enjoy unlimited play.", "assertive");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://echoquest.app/#organization",
        name: "EchoQuest",
        url: "https://echoquest.app",
        logo: { "@type": "ImageObject", url: "https://echoquest.app/opengraph-image" },
        sameAs: [],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://echoquest.app/#app",
        name: "EchoQuest",
        url: "https://echoquest.app",
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description: "Free to start. Premium plans from $15/month.",
        },
        description:
          "An audio-first AI tabletop RPG platform with a live AI Game Master. Fully accessible for blind and visually impaired players.",
        screenshot: "https://echoquest.app/opengraph-image",
        featureList: [
          "AI Game Master powered by Claude",
          "Audio-first design with TTS narration",
          "Fully accessible for blind players",
          "Community world creation",
          "Voice command navigation",
        ],
        publisher: { "@id": "https://echoquest.app/#organization" },
      },
      {
        "@type": "WebSite",
        "@id": "https://echoquest.app/#website",
        url: "https://echoquest.app",
        name: "EchoQuest",
        publisher: { "@id": "https://echoquest.app/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: "https://echoquest.app/library" },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4" aria-label="Site navigation">
        <span className="text-lg font-bold" style={{ color: "var(--text)" }}>EchoQuest</span>
        <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
          <Link href="/library" className="hover:underline">Library</Link>
          <Link href="/blog" className="hover:underline">Blog</Link>
          {session?.user ? (
            <>
              <Link href="/my-worlds" className="hover:underline">My Worlds</Link>
              {(session.user as { isAdmin?: boolean }).isAdmin && (
                <Link href="/admin" className="hover:underline" style={{ color: "var(--accent)" }}>Admin</Link>
              )}
              <span style={{ opacity: 0.4 }}>|</span>
              <Link href="/account" className="hover:underline">{session.user.name ?? session.user.email}</Link>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <main id="main-content">
        {/* Hero */}
        <section aria-labelledby="hero-heading" className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p
            className="mb-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{ backgroundColor: "var(--surface)", color: "var(--accent)", border: "1px solid var(--border)" }}
            aria-hidden="true"
          >
            Audio-First Interactive Fiction
          </p>
          <h1
            id="hero-heading"
            className="mb-5 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: "var(--text)" }}
            tabIndex={-1}
            data-focus-on-mount
          >
            Your adventure,{" "}
            <span style={{ color: "var(--accent)" }}>narrated live</span>{" "}
            by an AI Game Master.
          </h1>
          <p className="mb-8 max-w-lg text-base md:text-lg" style={{ color: "var(--text-muted)" }}>
            Fully accessible. Plays entirely by voice and keyboard. Built for blind and sighted
            adventurers alike. Powered by Claude AI.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push("/library")}
              className="rounded-lg px-6 py-3 text-base font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              aria-label="Start playing — go to the Adventure Library"
            >
              Start Playing →
            </button>
            <Link
              href="#how-it-works"
              className="rounded-lg border px-6 py-3 text-base font-semibold transition-opacity hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              How it works
            </Link>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-heading" className="px-6 py-16" style={{ backgroundColor: "var(--surface)" }}>
          <h2 id="features-heading" className="mb-10 text-center text-2xl font-bold" style={{ color: "var(--text)" }}>
            Built different
          </h2>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
                <div aria-hidden="true" className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--text)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="hiw-heading" className="px-6 py-16">
          <h2 id="hiw-heading" className="mb-10 text-center text-2xl font-bold" style={{ color: "var(--text)" }}>
            How it works
          </h2>
          <ol className="mx-auto max-w-3xl space-y-6" aria-label="Steps to start playing">
            {HOW_IT_WORKS.map((h) => (
              <li key={h.step} className="flex gap-4 rounded-xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
                  aria-hidden="true"
                >
                  {h.step}
                </span>
                <div>
                  <h3 className="mb-1 font-semibold" style={{ color: "var(--text)" }}>{h.title}</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{h.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Accessibility callout */}
        <section aria-labelledby="a11y-heading" className="px-6 py-12" style={{ backgroundColor: "var(--surface)" }}>
          <div className="mx-auto max-w-3xl rounded-xl border p-8" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
            <h2 id="a11y-heading" className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              ACCESSIBILITY FIRST
            </h2>
            <p className="mb-4 text-lg font-semibold" style={{ color: "var(--text)" }}>
              Every feature works by voice, keyboard, and screen reader.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              EchoQuest started as an accessibility project. VoiceOver, NVDA, and JAWS are tested on every release.
              Press{" "}
              <kbd className="rounded px-1.5 py-0.5 font-mono text-xs" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>H</kbd>
              {" "}at any time for the keyboard shortcut reference. Audio narration plays automatically.
              Speed and volume are adjustable during play. Core accessibility features are{" "}
              <strong style={{ color: "var(--text)" }}>always free</strong> — never paywalled.
            </p>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <a href="/settings/voice" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Customize the narrator voice →
              </a>
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section aria-labelledby="pricing-heading" className="px-6 py-16">
          <h2 id="pricing-heading" className="mb-2 text-center text-2xl font-bold" style={{ color: "var(--text)" }}>
            Simple pricing
          </h2>
          <p className="mb-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Start free. Upgrade when you want more.
          </p>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {PRICING.map((p) => (
              <article
                key={p.tier}
                className="flex flex-col rounded-xl border p-6"
                style={{
                  borderColor: p.highlight ? "var(--accent)" : "var(--border)",
                  backgroundColor: "var(--surface)",
                  boxShadow: p.highlight ? "0 0 0 1px var(--accent)" : undefined,
                }}
              >
                {p.highlight && (
                  <p className="mb-3 self-start rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
                    Most popular
                  </p>
                )}
                <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>{p.tier}</h3>
                <p className="mb-4 mt-1" style={{ color: "var(--text-muted)" }}>
                  <span className="text-3xl font-bold" style={{ color: "var(--text)" }}>{p.price}</span>
                  <span className="text-sm">{p.period}</span>
                </p>
                <ul className="mb-6 flex-1 space-y-2" aria-label={`${p.tier} plan features`}>
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--accent)" }} aria-hidden="true">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className="block rounded-lg py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: p.highlight ? "var(--accent)" : "transparent",
                    color: p.highlight ? "#ffffff" : "var(--text-muted)",
                    border: p.highlight ? undefined : "1px solid var(--border)",
                  }}
                  aria-label={`${p.cta} — ${p.tier} plan at ${p.price}${p.period}`}
                >
                  {p.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>



        <section aria-label="Creator spotlight" className="px-6 py-16">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">World of the Week</p>
            <h2 className="mt-2 text-2xl font-bold" style={{ color: "var(--text)" }}>Creator Spotlight: Community Remix Challenge</h2>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Each week we feature one creator world and encourage the community to fork it, remix it, and share session recaps.
              Featured creators bring their own audience and drive new players back into EchoQuest.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/forks" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">Explore forkable worlds</Link>
              <Link href="/my-worlds" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Nominate your world</Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-label="Call to action" className="px-6 py-16 text-center" style={{ backgroundColor: "var(--surface)" }}>
          <h2 className="mb-3 text-2xl font-bold" style={{ color: "var(--text)" }}>Ready to begin?</h2>
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>No sign-up required to play. Just pick a world.</p>
          <button
            onClick={() => router.push("/library")}
            className="rounded-lg px-8 py-3 text-base font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            aria-label="Browse the adventure library and start playing"
          >
            Browse the Library →
          </button>
        </section>
      </main>

      <footer className="px-6 py-6 text-center text-xs" style={{ color: "var(--text-subtle, var(--text-muted))", borderTop: "1px solid var(--border)" }}>
        <p className="mb-2">EchoQuest — Powered by Claude AI · Audio-first interactive storytelling</p>
        <div className="flex justify-center gap-4">
          <Link href="/library" className="hover:underline">Library</Link>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <Link href="/auth/sign-in" className="hover:underline">Sign in</Link>
          <a href="https://echoquest.app/privacy" className="hover:underline">Privacy</a>
          <a href="https://echoquest.app/support" className="hover:underline">Support</a>
        </div>
      </footer>
    </div>
    </>
  );
}
