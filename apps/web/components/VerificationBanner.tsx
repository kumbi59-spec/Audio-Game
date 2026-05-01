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
        className="flex items-center justify-between px-4 py-2 text-sm font-medium"
        style={{ backgroundColor: "#166534", color: "#dcfce7" }}
      >
        <span>✓ Email verified — welcome to EchoQuest!</span>
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
      setResendMsg(data.ok ? "Verification email sent — check your inbox." : (data.error ?? "Failed to send."));
    } catch {
      setResendMsg("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs"
      style={{ backgroundColor: "#1e1b4b", borderBottom: "1px solid #3730a3", color: "#c7d2fe" }}
    >
      <span>
        {resendMsg ?? "Please verify your email address to unlock all features."}
      </span>
      <div className="flex items-center gap-3">
        {!resendMsg && (
          <button
            onClick={resend}
            disabled={resending}
            className="rounded px-2 py-1 text-xs font-semibold hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "#4338ca", color: "#fff" }}
          >
            {resending ? "Sending…" : "Resend email"}
          </button>
        )}
        <button
          onClick={() => void update().then(() => window.location.reload())}
          className="text-xs hover:opacity-80 underline"
          style={{ color: "#818cf8" }}
        >
          Already verified?
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss verification banner"
          className="hover:opacity-70"
          style={{ color: "#818cf8" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
