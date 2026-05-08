import { NextRequest, NextResponse } from "next/server";
import { loadPublicWorlds } from "@/lib/worlds/shape";

export async function GET(_req: NextRequest) {
  const worlds = await loadPublicWorlds();
  return NextResponse.json(worlds);
}
