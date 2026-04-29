"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free:         { label: "Free",        color: "#6b7280" },
  storyteller:  { label: "Storyteller", color: "#7c3aed" },
  creator:      { label: "Creator",     color: "#d97706" },
};

interface Profile {
  id: string;
  name: string | null;
  email: string;
  tier: string;
  aiMinutesRemaining: number;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { status } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/sign-in");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Profile | null) => {
        if (!data) return;
        setProfile(data);
        setName(data.name ?? "");
      })
      .catch(() => undefined);
  }, [status]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMsg(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setNameMsg(res.ok ? "Name updated." : "Failed to update name.");
    } finally {
      setNameSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok) {
        setPwMsg({ ok: true, text: "Password changed successfully." });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        setPwMsg({ ok: false, text: data.error ?? "Failed to change password." });
      }
    } finally {
      setPwSaving(false);
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/payments/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error ?? "Could not open billing portal.");
      }
    } finally {
      setPortalLoading(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  const tier = profile?.tier ?? "free";
  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS.free!;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="px-6 py-8">
        <Link href="/" className="mb-4 inline-block text-sm hover:underline" style={{ color: "var(--text-muted)" }}>
          ← Home
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Account
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Manage your profile, subscription, and password.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-xl space-y-6 px-6 pb-16">

        {/* Plan */}
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>Subscription</h2>
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-full px-3 py-0.5 text-sm font-semibold text-white"
              style={{ backgroundColor: tierInfo.color }}
            >
              {tierInfo.label}
            </span>
            {profile && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {profile.aiMinutesRemaining} AI minutes remaining
              </span>
            )}
          </div>
          {tier === "free" ? (
            <Link
              href="/#pricing"
              className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Upgrade plan
            </Link>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={openBillingPortal}
                disabled={portalLoading}
                className="rounded-lg border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {portalLoading ? "Opening…" : "Manage billing & invoices"}
              </button>
              {portalError && (
                <p className="text-xs" style={{ color: "var(--error, #dc2626)" }}>{portalError}</p>
              )}
            </div>
          )}
        </section>

        {/* Profile */}
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>Profile</h2>
          {profile && (
            <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
              {profile.email}
            </p>
          )}
          <form onSubmit={saveName} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>Display name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={80}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", minHeight: 44 }}
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={nameSaving || !name.trim()}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: "var(--accent)", minHeight: 44 }}
              >
                {nameSaving ? "Saving…" : "Save name"}
              </button>
              {nameMsg && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{nameMsg}</span>
              )}
            </div>
          </form>
        </section>

        {/* Password */}
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>Change password</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>Current password</span>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", minHeight: 44 }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>New password</span>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", minHeight: 44 }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>Confirm new password</span>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", minHeight: 44 }}
              />
            </label>
            {pwMsg && (
              <p className="text-xs" style={{ color: pwMsg.ok ? "var(--success, #16a34a)" : "var(--error, #dc2626)" }} role="alert">
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {pwSaving ? "Changing…" : "Change password"}
            </button>
          </form>
        </section>

        {/* Settings links */}
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>Settings</h2>
          <div className="space-y-2">
            <Link
              href="/settings/voice"
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-opacity hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              <span>Narrator voice &amp; audio</span>
              <span style={{ color: "var(--text-muted)" }}>→</span>
            </Link>
          </div>
        </section>

        {/* Sign out */}
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ borderColor: "var(--error, #dc2626)", color: "var(--error, #dc2626)" }}
          >
            Sign out
          </button>
        </section>

      </main>
    </div>
  );
}
