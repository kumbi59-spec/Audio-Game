import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/lib/email";
import { CONTACT_TOPICS, MAX_CONTACT_MESSAGE_CHARS } from "@/lib/email/contact-form";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

const CONTACT_IP_LIMIT = 5;
const CONTACT_WINDOW_SECONDS = 60 * 60;
// Offered when the form can't send and CONTACT_EMAIL isn't set either; the
// same support address the push sender names.
const FALLBACK_ADDRESS = "support@echoquest.app";

const ContactSchema = z.object({
  topic: z.enum(CONTACT_TOPICS),
  /** Where to reply. Optional: the form says to leave it only if you want one. */
  email: z.string().trim().max(254).email().optional(),
  message: z.string().trim().min(1).max(MAX_CONTACT_MESSAGE_CHARS),
});

/**
 * Sends a contact-form message to CONTACT_EMAIL through Resend. When email
 * isn't set up, says so with an address to write to instead (503), so the
 * page never reports a message as sent that went nowhere.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof ContactSchema>;
  try {
    body = ContactSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Please choose a topic, write a message, and check the email address." },
      { status: 400 },
    );
  }

  const decision = await consumeRateLimit({
    key: `contact:ip:${getClientIp(req)}`,
    limit: CONTACT_IP_LIMIT,
    windowSeconds: CONTACT_WINDOW_SECONDS,
  });
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "You've sent several messages already. Please try again later." },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  const to = process.env["CONTACT_EMAIL"]?.trim();
  if (!to || !process.env["RESEND_API_KEY"]) {
    const email = to || FALLBACK_ADDRESS;
    return NextResponse.json(
      { error: `The contact form isn't available right now. Please email us at ${email} instead.`, email },
      { status: 503 },
    );
  }

  try {
    await sendContactEmail(to, body);
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json(
      { error: `Your message couldn't be sent. Please try again, or email us at ${to}.`, email: to },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
