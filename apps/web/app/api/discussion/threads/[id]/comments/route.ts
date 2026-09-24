import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeDiscussionWrite } from "@/lib/discussion/guard";
import { createComment } from "@/lib/discussion/queries";

const CreateCommentSchema = z.object({
  text: z.string().trim().min(1).max(2_000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await authorizeDiscussionWrite(req, "comment");
  if (!gate.ok) return gate.response;

  let body: z.infer<typeof CreateCommentSchema>;
  try {
    body = CreateCommentSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "text (up to 2,000 characters) is required" }, { status: 400 });
  }

  const { id } = await params;
  const comment = await createComment(id, gate.userId, body.text);
  if (!comment) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  return NextResponse.json(comment, { status: 201 });
}
