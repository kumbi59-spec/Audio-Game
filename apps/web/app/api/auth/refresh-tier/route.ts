import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTier } from "@/lib/db/queries/users";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const tier = await getUserTier(session.user.id);
  return NextResponse.json({ tier });
}
