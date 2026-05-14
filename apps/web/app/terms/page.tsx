import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that govern your use of EchoQuest — acceptable use, paid subscriptions, user-created worlds, AI content, and our obligations to you.",
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: "Terms of Use | EchoQuest",
    description:
      "The terms that govern your use of EchoQuest — acceptable use, paid subscriptions, user-created worlds, and AI content.",
    url: `${SITE_URL}/terms`,
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          Terms of Use
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Last updated: 2026-05-14
        </p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <p>
            By using EchoQuest (the &ldquo;Service&rdquo;) you agree to these
            terms. They&rsquo;re written in plain English so you can read
            them. Where they affect your money, your data, or your account,
            we&rsquo;ve called that out explicitly.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>1. Who we are</h2>
          <p>
            EchoQuest is operated by the EchoQuest team. The Service is an
            audio-first AI tabletop RPG platform hosted on the web. Our{" "}
            <Link href="/privacy" className="hover:underline" style={{ color: "var(--accent)" }}>privacy policy</Link>{" "}
            covers what data we collect; this document covers how you may
            use the Service.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>2. Accounts</h2>
          <p>
            You can play three official campaigns without an account. Paid
            features and saving sessions require an account. You&rsquo;re
            responsible for keeping your sign-in credentials safe and for
            anything that happens on your account. If we suspect abuse — for
            example, sharing a paid account across many people — we may
            limit, suspend, or close the account.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>3. Subscriptions and payments</h2>
          <p>
            Paid tiers are billed monthly through Stripe. You can cancel any
            time from the account page; access continues until the end of the
            current billing period. We do not pro-rate refunds for partial
            months, but we&rsquo;ll always honour a refund request that
            reflects a clear product fault (a billing error, a feature that
            was promised and didn&rsquo;t work). Email us through{" "}
            <Link href="/contact-us" className="hover:underline" style={{ color: "var(--accent)" }}>contact us</Link>{" "}
            and we&rsquo;ll sort it.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>4. Acceptable use</h2>
          <p>
            Use EchoQuest like you&rsquo;d use any creative tool that other
            people also use. Don&rsquo;t:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Generate content that targets, harasses, or threatens real people.</li>
            <li>Try to elicit instructions for real-world harm (weapons, violence against specific people, exploitation of minors).</li>
            <li>Resell, sublicense, or rebrand the Service.</li>
            <li>Scrape the Service or its AI outputs at scale to train a competing product.</li>
            <li>Upload Game Bibles or community worlds that infringe someone else&rsquo;s copyright, trademark, or right of publicity.</li>
          </ul>
          <p>
            We may remove content or terminate accounts that violate this
            section. If we do, you can appeal through{" "}
            <Link href="/contact-us" className="hover:underline" style={{ color: "var(--accent)" }}>contact us</Link>.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>5. Your content</h2>
          <p>
            Worlds, characters, and campaigns you create stay yours. You
            grant EchoQuest a limited license to store, render, and (for
            worlds you choose to publish) display them so the Service can
            function. You can delete your content from the account page;
            once you do, copies in our running systems are removed within
            thirty days and backups roll off within ninety.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>6. AI-generated content</h2>
          <p>
            The AI Game Master is powered by Anthropic&rsquo;s Claude. AI
            outputs can be wrong, repetitive, or surprising. We work hard to
            keep them in tone with the world you chose, but you should treat
            them as a creative tool, not a source of factual information.
            For paid users, the AI&rsquo;s output is yours to share or
            screenshot freely. We do not use your session content to train
            any AI model and we do not sell it to third parties.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>7. Availability and changes</h2>
          <p>
            We aim for high availability but the Service is provided
            &ldquo;as is&rdquo; without uptime guarantees. We may add,
            change, or retire features. When we do something likely to
            disappoint you — sunset a tier, raise a price, change how saves
            work — we&rsquo;ll tell you by email and on the site at least
            thirty days before it takes effect.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>8. Liability</h2>
          <p>
            EchoQuest&rsquo;s total liability for any claim related to the
            Service is capped at the amount you paid us in the twelve months
            before the claim arose, or US $50 if you paid nothing. We are
            not liable for indirect or consequential losses (lost
            campaigns, missed deadlines, hurt feelings about a bad roll).
            These caps don&rsquo;t apply where the law doesn&rsquo;t allow
            them.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>9. Governing law</h2>
          <p>
            These terms are governed by the laws of the jurisdiction in
            which the EchoQuest team is principally located. Disputes will
            be resolved in the competent courts of that jurisdiction unless
            consumer-protection law in your country gives you a different
            forum.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--text)" }}>10. Contact</h2>
          <p>
            Questions, complaints, or legal notices:{" "}
            <Link href="/contact-us" className="hover:underline" style={{ color: "var(--accent)" }}>contact us</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
