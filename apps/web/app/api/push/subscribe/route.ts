import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { upsertPushToken } from "@/lib/push/tokens";

const WebSubscriptionSchema = z.object({
  type: z.literal("web"),
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

const ExpoTokenSchema = z.object({
  type: z.literal("expo"),
  token: z.string().startsWith("ExponentPushToken["),
});

const BodySchema = z.discriminatedUnion("type", [WebSubscriptionSchema, ExpoTokenSchema]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.type === "web") {
    await upsertPushToken(session.user.id, body.endpoint, "web", body.keys);
  } else {
    await upsertPushToken(session.user.id, body.token, "expo");
  }

  return NextResponse.json({ ok: true });
}
