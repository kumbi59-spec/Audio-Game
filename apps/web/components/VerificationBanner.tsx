"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function VerificationBanner() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";

  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Trigger a session refresh after successful email verification so the
  // banner disappears without requiring a sign-out/sign-in cycle.
  useEffect(() => {
    if (justVerified) update();
  }, [justVerified, update]);

  if (status !== "authenticated") return null;

  const emailVerified = (session.user as { emailVerified?: Date | null }).emailVerified;

  // Verified users see a brief success toast only
  if (emailVerified) {
    if (!justVerified) return null;
    return (
      <div
        role="status"
        className="flex items-center justify-between border-b border-success/40 bg-success/10 px-4 py-2 text-sm font-medium text-foreground"
      >
        <span>✓ Email verified. Welcome to EchoQuest!</span>
      </div>
    );
  }

  if (dismissed) return null;

  async function resend() {
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json() as { ok?: boolean; error?: string };
      setResendMsg(data.ok ? "Verification email sent. Check your inbox." : (data.error ?? "Failed to send."));
    } catch {
      setResendMsg("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/40 bg-accent-dim px-4 py-2 text-xs text-foreground"
    >
      <span>
        {resendMsg ?? "Please verify your email address to unlock all features."}
      </span>
      <div className="flex items-center gap-3">
        {!resendMsg && (
          <button
            onClick={resend}
            disabled={resending}
            className="inline-flex items-center rounded bg-accent-solid px-3 text-xs font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend email"}
          </button>
        )}
        <button
          onClick={() => void update().then(() => window.location.reload())}
          className="inline-flex items-center text-xs text-accent underline hover:opacity-80"
        >
          Already verified?
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss verification banner"
          className="inline-flex min-w-[44px] items-center justify-center text-accent hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
