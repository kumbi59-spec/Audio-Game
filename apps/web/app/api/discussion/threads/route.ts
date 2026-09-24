import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeDiscussionWrite } from "@/lib/discussion/guard";
import { createThread, ensureSeedThreads, listThreads } from "@/lib/discussion/queries";

const CreateThreadSchema = z.object({
  title: z.string().trim().min(3).max(150),
  body: z.string().trim().min(1).max(5_000),
});

// GET /api/discussion/threads?cursor=<threadId>
// Returns one page of threads; the next page's cursor is in X-Next-Cursor.
export async function GET(req: Request) {
  const cursor = new URL(req.url).searchParams.get("cursor");
  try {
    await ensureSeedThreads();
    const { threads, nextCursor } = await listThreads(cursor);
    return NextResponse.json(threads, {
      headers: nextCursor ? { "X-Next-Cursor": nextCursor } : undefined,
    });
  } catch (err) {
    console.error("[discussion] list failed:", err);
    return NextResponse.json({ error: "Failed to load discussions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const gate = await authorizeDiscussionWrite(req, "thread");
  if (!gate.ok) return gate.response;

  let body: z.infer<typeof CreateThreadSchema>;
  try {
    body = CreateThreadSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "title (3–150 characters) and body (up to 5,000 characters) are required" },
      { status: 400 },
    );
  }

  const thread = await createThread(gate.userId, body.title, body.body);
  return NextResponse.json(thread, { status: 201 });
}
