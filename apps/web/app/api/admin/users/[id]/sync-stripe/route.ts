import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { syncUserTierFromStripe } from "@/lib/payments/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-read a user's subscriptions from Stripe and set their tier to match.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const result = await syncUserTierFromStripe(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
