import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google Search Essentials",
  description:
    "EchoQuest guide to Google Search Essentials: technical requirements, spam policies, and key best practices.",
};

export default function SearchEssentialsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Google Search Essentials</h1>
      <p className="mt-4 text-base" style={{ color: "var(--text-muted)" }}>
        Google Search Essentials describes the core requirements and best practices that help publicly available
        content become eligible to appear in Google Search.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-semibold">Technical requirements</h2>
        <p>
          The technical requirements cover the bare minimum that Google Search needs from a page in order to show it
          in search results.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-semibold">Spam policies</h2>
        <p>
          Spam policies detail behaviors and tactics that can result in lower ranking or omission from search results.
          Sites focused on people-first value and trustworthy content are more likely to perform well.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-semibold">Key best practices</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Create helpful, reliable, people-first content.</li>
          <li>Use clear words people actually search for in titles, headings, alt text, and link text.</li>
          <li>Make links crawlable so Google can discover related pages.</li>
          <li>Promote your site in relevant communities where people care about your content.</li>
          <li>Follow best practices for images, videos, structured data, and JavaScript.</li>
          <li>Use appearance enhancements in Search when relevant for your content type.</li>
          <li>Use indexing controls for content you do not want included in search results.</li>
        </ul>
      </section>
    </main>
  );
}
