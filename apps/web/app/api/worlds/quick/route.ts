import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getUserTier } from "@/lib/db/queries/users";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import { draftToBible, draftToSystemPrompt } from "@/lib/wizard/steps";
import type { Draft } from "@/lib/wizard/steps";
import { resolveWorldCoverImage } from "@/lib/worlds/cover-art-resolver";
import { getAnthropicClient, MODEL } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  title: z.string().min(1, "Title is required"),
  genre: z.string().min(1, "Genre is required"),
  pitch: z.string().min(1, "Pitch is required"),
  openingScene: z.string().min(1, "Opening scene is required"),
  imageUrl: z.string().optional(),
});

interface ClaudeWorldDetails {
  setting: string;
  styleMode: "cinematic" | "rules_light" | "crunchy" | "mystery" | "horror" | "political" | "adventure";
  contentRating: "family" | "teen" | "mature";
  toneVoice: string;
  hardConstraint: string;
}

async function generateWorldDetails(
  title: string,
  genre: string,
  pitch: string,
  openingScene: string,
): Promise<ClaudeWorldDetails> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are helping build a tabletop RPG world. Given the details below, fill in the missing world-building fields.

World title: ${title}
Genre: ${genre}
Pitch: ${pitch}
Opening scene: ${openingScene}

Reply with ONLY a JSON object with these exact keys:
- setting: where and when the world takes place (1 sentence)
- styleMode: one of "cinematic", "rules_light", "crunchy", "mystery", "horror", "political", "adventure"
- contentRating: one of "family", "teen", "mature" — infer from the genre and pitch
- toneVoice: narrator's tone in exactly 3 words (e.g. "hushed and watchful")
- hardConstraint: one hard rule the GM must never break (1 sentence)

Reply with ONLY the JSON object, no markdown fences, no explanation.`,
      },
    ],
  });

  const block = response.content[0];
  if (block?.type !== "text") throw new Error("unexpected Claude response");

  const raw = block.text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const parsed = JSON.parse(raw) as Partial<ClaudeWorldDetails>;

  const VALID_STYLE_MODES = ["cinematic", "rules_light", "crunchy", "mystery", "horror", "political", "adventure"] as const;
  const VALID_RATINGS = ["family", "teen", "mature"] as const;

  return {
    setting: typeof parsed.setting === "string" ? parsed.setting : `The world of ${title}`,
    styleMode: VALID_STYLE_MODES.includes(parsed.styleMode as typeof VALID_STYLE_MODES[number])
      ? (parsed.styleMode as typeof VALID_STYLE_MODES[number])
      : "cinematic",
    contentRating: VALID_RATINGS.includes(parsed.contentRating as typeof VALID_RATINGS[number])
      ? (parsed.contentRating as typeof VALID_RATINGS[number])
      : "teen",
    toneVoice: typeof parsed.toneVoice === "string" ? parsed.toneVoice : "vivid and dramatic",
    hardConstraint: typeof parsed.hardConstraint === "string" ? parsed.hardConstraint : "",
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const tier = await getUserTier(session.user.id);
  const { maxWorlds, worldWizard } = TIER_ENTITLEMENTS[tier as keyof typeof TIER_ENTITLEMENTS] ?? TIER_ENTITLEMENTS.free;

  if (!worldWizard) {
    return NextResponse.json({ error: "Upgrade to the Storyteller plan to create custom worlds." }, { status: 403 });
  }
  if (maxWorlds !== null && maxWorlds === 0) {
    return NextResponse.json({ error: "Upgrade to the Storyteller plan to create custom worlds." }, { status: 403 });
  }
  if (maxWorlds !== null) {
    const worldCount = await prisma.world.count({ where: { ownerId: session.user.id, isPrebuilt: false } });
    if (worldCount >= maxWorlds) {
      return NextResponse.json(
        { error: `You've reached your world limit (${maxWorlds}). Upgrade to Creator for unlimited worlds.` },
        { status: 403 },
      );
    }
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { title, genre, pitch, openingScene, imageUrl: suppliedImageUrl } = body;

  let details: ClaudeWorldDetails;
  try {
    details = await generateWorldDetails(title, genre, pitch, openingScene);
  } catch {
    details = {
      setting: `The world of ${title}`,
      styleMode: "cinematic",
      contentRating: "teen",
      toneVoice: "vivid and dramatic",
      hardConstraint: "",
    };
  }

  const draft: Draft = {
    title,
    pitch,
    genre,
    setting: details.setting,
    styleMode: details.styleMode,
    contentRating: details.contentRating,
    toneVoice: details.toneVoice,
    hardConstraint: details.hardConstraint,
    startingScenario: openingScene,
    characterName: "the hero",
  };

  const stamp = Date.now().toString(36);
  const worldId = `world-quick-${stamp}`;
  const locId = `loc-quick-${stamp}-start`;

  const bible = draftToBible(draft);
  const systemPrompt = draftToSystemPrompt(draft);

  const imageUrl =
    suppliedImageUrl?.trim() ||
    (await resolveWorldCoverImage(title, genre, details.toneVoice));

  await prisma.world.create({
    data: {
      id: worldId,
      name: title,
      description: pitch,
      genre,
      tone: details.toneVoice || details.contentRating,
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
            description: openingScene,
            shortDesc: openingScene.slice(0, 80),
            ambientSound: null,
            connectedTo: "[]",
            properties: JSON.stringify({ bible }),
          },
        ],
      },
    },
  });

  return NextResponse.json({ worldId });
}
