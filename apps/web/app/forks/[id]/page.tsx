import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicWorlds } from "@/lib/worlds/shape";
import { SiteHeader } from "@/components/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";

type Params = { params: Promise<{ id: string }> };

// Direct data-layer call; see the note in /forks/page.tsx for why the
// earlier fetch("/api/worlds/:id") from a server component was broken.
async function findWorld(id: string) {
  const worlds = await loadPublicWorlds();
  return worlds.find((w) => w.id === id) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const world = await findWorld((await params).id);
  if (!world) return { title: "World not found", robots: { index: false } };
  return {
    title: `Fork ${world.name}`,
    description: `Remix ${world.name}, a ${world.genre} world on EchoQuest, into your own version.`,
  };
}

export default async function ForkWorldPage({ params }: Params) {
  const world = await findWorld((await params).id);
  if (!world) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-6 py-10">
        <Eyebrow>Fork this world</Eyebrow>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{world.name}</h1>
        <p className="mt-2 text-sm text-muted">{world.description}</p>
        <p className="mt-4 text-sm text-muted">Genre: {world.genre} · Tone: {world.tone}</p>

        <Card className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">How to fork</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Play the original world and identify what you want to remix.</li>
            <li>Create your version with Quick Build, Wizard, or Game Bible upload.</li>
            <li>Publish your remix and share your recap to bring players back to your world.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href={`/create?worldId=${world.id}`}>Play original</ButtonLink>
            <ButtonLink
              href={`/worlds/new/wizard?forkFrom=${encodeURIComponent(world.id)}&forkName=${encodeURIComponent(world.name)}`}
              variant="secondary"
            >
              Start your fork
            </ButtonLink>
          </div>
        </Card>
      </main>
    </>
  );
}
