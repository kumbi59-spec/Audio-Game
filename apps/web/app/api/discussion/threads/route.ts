import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { threads, type DiscussionThread } from "../store";

export async function GET() {
  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const emailVerified = Boolean((session.user as { emailVerified?: Date | null }).emailVerified);
  if (!emailVerified) {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  const body = (await req.json()) as { title?: string; body?: string };
  const title = body.title?.trim() ?? "";
  const text = body.body?.trim() ?? "";
  if (!title || !text) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const thread: DiscussionThread = {
    id: `thread-${Date.now()}`,
    title,
    body: text,
    author: session.user.name ?? session.user.email ?? "Anonymous",
    createdAt: new Date().toISOString(),
    comments: [],
  };
  threads.unshift(thread);
  return NextResponse.json(thread, { status: 201 });
}
