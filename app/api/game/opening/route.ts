import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOpeningNarration } from "@/lib/ai/gm-engine";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";

const Schema = z.object({
  world: z.unknown(),
  character: z.unknown(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const opening = await generateOpeningNarration(
      body.world as WorldData,
      body.character as CharacterData
    );
    return NextResponse.json(opening);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GM error" },
      { status: 500 }
    );
  }
}
