import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAnthropicClient, MODEL } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  fieldId: z.string().min(1),
  draft: z.record(z.string()),
});

const FIELD_HINTS: Record<string, string> = {
  title: "world names (2-4 evocative words each)",
  pitch: "one-sentence world pitches",
  genre: "specific genre labels (2-5 words each)",
  setting: "setting descriptions (where + when, 5-10 words each)",
  toneVoice: "narrator tone phrases (exactly 3 words each)",
  hardConstraint: "hard world rules the GM must never break (one sentence each)",
  startingScenario: "opening scene descriptions (1-2 sentences each)",
  characterName: "character first names that fit the world",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { fieldId, draft } = body;
  const hint = FIELD_HINTS[fieldId] ?? "short creative answers for a world-building question";

  const contextLines: string[] = [];
  if (draft["title"]) contextLines.push(`World title: ${draft["title"]}`);
  if (draft["pitch"]) contextLines.push(`Pitch: ${draft["pitch"]}`);
  if (draft["genre"]) contextLines.push(`Genre: ${draft["genre"]}`);
  if (draft["setting"]) contextLines.push(`Setting: ${draft["setting"]}`);
  const context = contextLines.length > 0 ? `\nWorld context so far:\n${contextLines.join("\n")}` : "";

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Give me exactly 3 ${hint} for a tabletop RPG world.${context}\n\nReply with ONLY a JSON array of 3 strings, nothing else. Example: ["idea one","idea two","idea three"]`,
        },
      ],
    });

    const block = response.content[0];
    if (block?.type !== "text") throw new Error("unexpected response");

    const raw = block.text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const suggestions = JSON.parse(raw) as unknown;
    if (!Array.isArray(suggestions)) throw new Error("not an array");

    return NextResponse.json({
      suggestions: (suggestions as unknown[]).slice(0, 3).map(String),
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
