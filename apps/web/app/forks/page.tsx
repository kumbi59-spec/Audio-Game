import Link from "next/link";
import type { Metadata } from "next";
import { loadPublicWorlds } from "@/lib/worlds/shape";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Fork a Community World",
  description:
    "Browse creator-made EchoQuest worlds and launch your own remix. Fork a published world, rebuild it your way, and share it back.",
  alternates: { canonical: `${SITE_URL}/forks` },
};

export const revalidate = 60;

export default async function ForkIndexPage() {
  // Call the data layer directly. The previous implementation did
  // fetch(`${NEXT_PUBLIC_BASE_URL ?? ""}/api/worlds`) from a server
  // component — with NEXT_PUBLIC_BASE_URL unset (the codebase uses
  // NEXT_PUBLIC_SITE_URL) that resolved to a relative URL, which the
  // server-side fetch can't parse, so the route threw and the page was
  // effectively a dead link.
  const worlds = await loadPublicWorlds();
  const creatorWorlds = worlds.filter((w) => !!w.author);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Fork this world</h1>
      <p className="mt-2 text-sm text-muted-foreground">Browse creator worlds and launch your own remix page.</p>
      {creatorWorlds.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No community worlds have been published yet.{" "}
          <Link href="/worlds/new" className="font-semibold text-primary hover:underline">
            Create the first one →
          </Link>
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {creatorWorlds.map((world) => (
            <li key={world.id} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">{world.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">by {world.author}</p>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{world.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {world.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                ))}
              </div>
              <Link href={`/forks/${world.id}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Open fork page →</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
