import Link from "next/link";

interface PublicWorld {
  id: string;
  name: string;
  description: string;
  author: string | null;
  tags: string[];
}

async function getWorlds(): Promise<PublicWorld[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/worlds`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as PublicWorld[];
  return Array.isArray(data) ? data : [];
}

export default async function ForkIndexPage() {
  const worlds = await getWorlds();
  const creatorWorlds = worlds.filter((w) => !!w.author);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Fork this world</h1>
      <p className="mt-2 text-sm text-muted-foreground">Browse creator worlds and launch your own remix page.</p>
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
    </main>
  );
}
