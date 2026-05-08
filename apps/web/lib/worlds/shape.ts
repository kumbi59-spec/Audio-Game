import { listPublicWorlds, seedPrebuiltWorldsIfNeeded } from "@/lib/db/queries/worlds";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

export interface PublicWorld {
  id: string;
  name: string;
  description: string;
  genre: string;
  tone: string;
  isPrebuilt: boolean;
  imageUrl: string | null;
  difficulty: string;
  tags: string[];
  sortOrder: number;
  author: string | null;
  publishedAt: string | null;
}

const PREBUILT_SVG: Record<string, string> = Object.fromEntries(
  PREBUILT_WORLDS.map((w) => [w.id, (w as { imageUrl?: string }).imageUrl ?? ""])
);

function resolveImageUrl(id: string, dbUrl: string | null, isPrebuilt: boolean): string | null {
  if (dbUrl?.startsWith("data:")) return `/api/worlds/${id}/image`;
  if (dbUrl) return dbUrl;
  if (isPrebuilt) return PREBUILT_SVG[id] || null;
  return null;
}

export function shapeWorld(
  w: Awaited<ReturnType<typeof listPublicWorlds>>[number]
): PublicWorld {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    genre: w.genre,
    tone: w.tone,
    isPrebuilt: w.isPrebuilt,
    imageUrl: resolveImageUrl(w.id, w.imageUrl, w.isPrebuilt),
    difficulty: w.libraryItem?.difficulty ?? "beginner",
    tags: w.libraryItem?.tags.split(",").map((t) => t.trim()).filter(Boolean) ?? [w.genre, w.tone],
    sortOrder: w.libraryItem?.sortOrder ?? 100,
    author: w.isPrebuilt ? null : ((w as unknown as { owner?: { name?: string } }).owner?.name ?? "Adventurer"),
    publishedAt: w.libraryItem ? ((w as unknown as { createdAt: Date }).createdAt?.toISOString() ?? null) : null,
  };
}

const PREBUILT_FALLBACK: PublicWorld[] = PREBUILT_WORLDS.map((w, i) => ({
  id: w.id,
  name: w.name,
  description: w.description,
  genre: w.genre,
  tone: w.tone,
  isPrebuilt: true,
  imageUrl: (w as { imageUrl?: string }).imageUrl ?? null,
  difficulty: "beginner",
  tags: [w.genre, w.tone],
  sortOrder: i,
  author: null,
  publishedAt: null,
}));

/**
 * Returns the public worlds list, auto-seeding prebuilt worlds on first use
 * if the DB is empty. Falls back to the in-process prebuilt list if Prisma
 * is unreachable (e.g. during static generation before migrations run).
 */
export async function loadPublicWorlds(): Promise<PublicWorld[]> {
  try {
    const worlds = await listPublicWorlds();
    if (!worlds.some((w) => w.isPrebuilt)) {
      await seedPrebuiltWorldsIfNeeded();
      const seeded = await listPublicWorlds();
      return seeded.map(shapeWorld);
    }
    return worlds.map(shapeWorld);
  } catch {
    return PREBUILT_FALLBACK;
  }
}
