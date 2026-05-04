import { SiteHeader } from "@/components/SiteHeader";

export default function DiscussionPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Discussion</h1>
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Community discussion is now available. Share strategies, session recaps, and world-building ideas.
        </p>
      </main>
    </div>
  );
}
