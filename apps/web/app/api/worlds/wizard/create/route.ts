import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { draftToBible, draftToSystemPrompt, type Draft } from "@/lib/wizard/steps";
import { resolveWorldCoverImage } from "@/lib/worlds/cover-art-resolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DraftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  pitch: z.string(),
  genre: z.string(),
  setting: z.string(),
  styleMode: z.enum(["cinematic", "rules_light", "crunchy", "mystery", "horror", "political", "adventure"]),
  contentRating: z.enum(["family", "teen", "mature"]),
  toneVoice: z.string(),
  hardConstraint: z.string(),
  startingScenario: z.string().min(1, "Opening scene is required"),
  characterName: z.string().min(1, "Character name is required"),
  // Optional creator-supplied cover image URL (http/https or data URL)
  imageUrl: z.string().optional(),
}) satisfies z.ZodType<Draft & { imageUrl?: string }>;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: z.infer<typeof DraftSchema>;
  try {
    body = DraftSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : "Invalid draft";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { imageUrl: suppliedImageUrl, ...draft } = body;

  const stamp = Date.now().toString(36);
  const worldId = `world-wiz-${stamp}`;
  const locId = `loc-wiz-${stamp}-start`;

  const bible = draftToBible(draft);
  const systemPrompt = draftToSystemPrompt(draft);

  // Use creator-supplied image, or run AI generation (with SVG fallback)
  const imageUrl =
    suppliedImageUrl?.trim() ||
    (await resolveWorldCoverImage(bible.title, draft.genre, draft.toneVoice));

  await prisma.world.create({
    data: {
      id: worldId,
      name: bible.title,
      description: bible.pitch ?? bible.title,
      genre: bible.genre ?? draft.genre,
      tone: draft.toneVoice || draft.contentRating,
      systemPrompt,
      isPrebuilt: false,
      isPublic: false,
      imageUrl,
      ownerId: session.user.id,
      locations: {
        create: [
          {
            id: locId,
            name: "The Beginning",
            description: draft.startingScenario,
            shortDesc: draft.startingScenario.slice(0, 80),
            ambientSound: null,
            connectedTo: "[]",
            properties: "{}",
          },
        ],
      },
    },
  });

  return NextResponse.json({ worldId });
}
