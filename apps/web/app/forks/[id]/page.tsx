import Link from "next/link";
import { loadPublicWorlds } from "@/lib/worlds/shape";

export const revalidate = 60;

export default async function ForkWorldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Direct data-layer call — see the note in /forks/page.tsx for why the
  // prior fetch("/api/worlds/:id") from a server component was broken.
  const worlds = await loadPublicWorlds();
  const world = worlds.find((w) => w.id === id);

  if (!world) {
    return <main className="mx-auto max-w-2xl px-6 py-10">World not found.</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fork this world</p>
      <h1 className="mt-2 text-3xl font-bold">{world.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{world.description}</p>
      <p className="mt-4 text-sm text-muted-foreground">Genre: {world.genre} · Tone: {world.tone}</p>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">How to fork</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Play the original world and identify what you want to remix.</li>
          <li>Create your version with Quick Build, Wizard, or Game Bible upload.</li>
          <li>Publish your remix and share your recap to bring players back to your world.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/create?worldId=${world.id}`} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Play original</Link>
          <Link
            href={`/worlds/new/wizard?forkFrom=${encodeURIComponent(world.id)}&forkName=${encodeURIComponent(world.name)}`}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold"
          >
            Start your fork
          </Link>
        </div>
      </div>
    </main>
  );
}
