import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How EchoQuest collects, uses, and protects your data — including session content, account info, and payments.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: "Privacy Policy | EchoQuest",
    description:
      "How EchoQuest collects, uses, and protects your data — including session content, account info, and payments.",
    url: `${SITE_URL}/privacy`,
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Last updated: 2026-05-08
        </p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <p>
            EchoQuest is an audio-first AI tabletop RPG platform. This policy describes what we collect,
            why, and the choices you have over your data.
          </p>

          <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--text)" }}>
            What we collect
          </h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong style={{ color: "var(--text)" }}>Account information.</strong> Email address and
              optional display name when you sign in.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Session content.</strong> The narration log,
              choices, and characters you create while playing — stored so you can resume saves.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Payment information.</strong> Stripe processes
              all card data; we never see card numbers. We retain a Stripe customer ID and your
              subscription tier.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Usage analytics.</strong> Aggregated page views
              via Google Analytics, including IP-anonymized geo and device info.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Advertising.</strong> Free-tier pages may show
              Google AdSense units, which set their own cookies subject to Google&rsquo;s policies.
            </li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--text)" }}>
            What we don&rsquo;t do
          </h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>We do not sell your personal data.</li>
            <li>
              Your session conversations with the AI Game Master are not used to train any AI model
              and are not shared with third parties for ad targeting.
            </li>
            <li>We do not access your microphone unless you explicitly enable voice input.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--text)" }}>
            Service providers
          </h2>
          <p>
            We share the minimum data required with: Anthropic (AI inference), ElevenLabs (premium
            text-to-speech for paid tiers), Stripe (payments), Resend (transactional email),
            and Google (analytics + AdSense on free tier).
          </p>

          <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--text)" }}>
            Your choices
          </h2>
          <p>
            You can delete your account and all associated session data at any time from{" "}
            <a href="/account" className="hover:underline" style={{ color: "var(--accent)" }}>
              your account settings
            </a>
            . You can also request a copy of your data by contacting us.
          </p>

          <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--text)" }}>
            Contact
          </h2>
          <p>
            Questions or requests:{" "}
            <a href="/contact-us" className="hover:underline" style={{ color: "var(--accent)" }}>
              contact us
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
