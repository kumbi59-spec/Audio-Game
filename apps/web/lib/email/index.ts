import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env["RESEND_API_KEY"]) return null;
  if (!_resend) _resend = new Resend(process.env["RESEND_API_KEY"]);
  return _resend;
}

const FROM = process.env["RESEND_FROM"] ?? "EchoQuest <noreply@echoquest.app>";

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to EchoQuest",
    html: welcomeHtml(name),
  });
}

export async function sendUpgradeEmail(to: string, name: string, tier: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const tierLabel = tier === "creator" ? "Creator" : "Storyteller";
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your EchoQuest ${tierLabel} plan is active`,
    html: upgradeHtml(name, tierLabel),
  });
}

function welcomeHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Welcome to EchoQuest</title></head>
<body style="font-family:system-ui,sans-serif;background:#0d0d0d;color:#e5e5e5;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:12px;padding:40px;border:1px solid #2a2a2a;">
    <h1 style="color:#fff;font-size:24px;margin:0 0 8px;">Welcome to EchoQuest, ${escapeHtml(name)}!</h1>
    <p style="color:#999;margin:0 0 24px;font-size:15px;">Your audio-first adventure begins now.</p>
    <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 24px;">
      EchoQuest is a fully accessible, audio-first interactive storytelling platform guided by an
      AI Game Master. Every feature works by keyboard, voice, and screen reader — built for blind
      and sighted adventurers alike.
    </p>
    <a href="https://echoquest.app/library"
       style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
      Start Playing →
    </a>
    <p style="color:#555;font-size:12px;margin:32px 0 0;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}

function upgradeHtml(name: string, tier: string): string {
  const perks: Record<string, string[]> = {
    Storyteller: [
      "Unlimited play sessions",
      "Premium ElevenLabs voices",
      "Unlimited save slots",
      "Game Bible upload",
    ],
    Creator: [
      "Everything in Storyteller",
      "World Builder Wizard",
      "Publish worlds to the community",
      "Creator analytics dashboard",
    ],
  };
  const bullets = (perks[tier] ?? []).map((p) => `<li style="margin:6px 0;">${escapeHtml(p)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>EchoQuest ${tier} Plan Active</title></head>
<body style="font-family:system-ui,sans-serif;background:#0d0d0d;color:#e5e5e5;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:12px;padding:40px;border:1px solid #2a2a2a;">
    <h1 style="color:#fff;font-size:24px;margin:0 0 8px;">Your ${escapeHtml(tier)} plan is active</h1>
    <p style="color:#999;margin:0 0 24px;font-size:15px;">Thanks, ${escapeHtml(name)}! Here's what's unlocked:</p>
    <ul style="color:#ccc;font-size:14px;line-height:1.6;padding-left:20px;margin:0 0 24px;">
      ${bullets}
    </ul>
    <a href="https://echoquest.app/library"
       style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
      Go to Library →
    </a>
    <p style="color:#555;font-size:12px;margin:32px 0 0;">
      Questions? Reply to this email — we read every message.
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
