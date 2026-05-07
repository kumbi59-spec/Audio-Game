import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { threads } from "../../../store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const emailVerified = Boolean((session.user as { emailVerified?: Date | null }).emailVerified);
  if (!emailVerified) {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  const { id } = await params;
  const thread = threads.find((t) => t.id === id);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const body = (await req.json()) as { text?: string };
  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const comment = {
    id: `comment-${Date.now()}`,
    text,
    author: session.user.name ?? session.user.email ?? "Anonymous",
    createdAt: new Date().toISOString(),
  };
  thread.comments.push(comment);
  return NextResponse.json(comment, { status: 201 });
}
