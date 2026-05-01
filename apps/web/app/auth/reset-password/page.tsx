"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <main className="w-full max-w-sm px-6" role="main">
          <p className="text-sm" style={{ color: "var(--danger, #ef4444)" }}>Invalid reset link.</p>
          <Link href="/auth/forgot-password" className="mt-4 inline-block text-sm underline" style={{ color: "var(--accent)" }}>
            Request a new one
          </Link>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setDone(true);
        setTimeout(() => router.replace("/auth/sign-in"), 2500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <main className="w-full max-w-sm px-6 text-center" role="main">
          <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Password updated!</p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Redirecting to sign in…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <main className="w-full max-w-sm px-6" role="main">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text)" }}>Choose a new password</h1>
        <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Resetting password for <strong style={{ color: "var(--text)" }}>{email}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                aria-label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border px-4 py-3 pr-12 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)", color: "var(--text)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? "Hide" : "Reveal"}
              </button>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Confirm password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              aria-label="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
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
            {busy ? "Saving…" : "Set new password"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
