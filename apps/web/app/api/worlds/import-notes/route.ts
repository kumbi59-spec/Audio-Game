import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAnthropicClient, MODEL } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  notes: z.string().min(20).max(40_000),
});

const EXTRACTION_PROMPT = `You are a game master assistant. Extract structured world-building information from the provided tabletop campaign session notes.

Return a JSON object with ONLY the fields you can confidently extract. Omit fields you cannot determine from the notes.

Fields to extract (all optional):
- title: string — world or campaign name (2-5 words)
- pitch: string — one-sentence premise of the world
- genre: string — genre label (e.g. "dark fantasy", "sci-fi noir")
- setting: string — where and when (5-15 words)
- toneVoice: string — narrator tone in three words (e.g. "hushed and watchful")
- hardConstraint: string — one hard rule the GM must never break
- startingScenario: string — 1-2 sentence opening scene description

Reply with ONLY valid JSON, no markdown fences, no explanation. Example:
{"title":"The Iron Pact","pitch":"A dying empire's last spies prevent a magical arms race.","genre":"espionage fantasy","setting":"A crumbling Renaissance-era city-state, 1502","toneVoice":"sharp and weary","hardConstraint":"Magic always leaves a visible scar","startingScenario":"You stand in a rain-slicked alley clutching a forged imperial seal."}`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body — notes must be 20–40,000 characters" }, { status: 400 });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\n--- SESSION NOTES ---\n${body.notes.slice(0, 12_000)}`,
        },
      ],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    let extracted: Record<string, string>;
    try {
      extracted = JSON.parse(block.text.trim()) as Record<string, string>;
    } catch {
      return NextResponse.json({ error: "AI returned non-JSON response" }, { status: 502 });
    }

    // Whitelist only known draft fields; strip anything unexpected.
    const allowed = new Set(["title", "pitch", "genre", "setting", "toneVoice", "hardConstraint", "startingScenario"]);
    const draft: Record<string, string> = {};
    for (const [k, v] of Object.entries(extracted)) {
      if (allowed.has(k) && typeof v === "string" && v.trim()) {
        draft[k] = v.trim().slice(0, 500);
      }
    }

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("[import-notes] extraction failed", err);
    return NextResponse.json({ error: "Extraction failed. Please try again." }, { status: 500 });
  }
}
