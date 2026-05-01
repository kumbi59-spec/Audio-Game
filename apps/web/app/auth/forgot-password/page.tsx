"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <main className="w-full max-w-sm px-6" role="main">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text)" }}>Forgot password</h1>

        {sent ? (
          <>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              If an account with that email exists, a reset link has been sent. Check your inbox — it expires in 1 hour.
            </p>
            <Link href="/auth/sign-in" className="text-sm underline" style={{ color: "var(--accent)" }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)", color: "var(--text)" }}
                />
              </div>
              {error && (
                <p role="alert" aria-live="assertive" className="text-sm" style={{ color: "var(--danger, #ef4444)" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/sign-in" className="underline" style={{ color: "var(--text-muted)" }}>
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
