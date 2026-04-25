"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";

export default function SignInPage() {
  const router = useRouter();
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const msg = mode === "signin" ? "Sign in to EchoQuest." : "Create your EchoQuest account.";
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", { email, password, mode, redirect: false });
    setBusy(false);
    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
    } else {
      router.replace("/");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <main className="w-full max-w-sm px-6" role="main">
        <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--text)" }}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
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
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {mode === "signin" ? (
            <button onClick={() => setMode("signup")} className="underline">
              New here? Create an account
            </button>
          ) : (
            <button onClick={() => setMode("signin")} className="underline">
              Already have an account? Sign in
            </button>
          )}
        </div>
        <div className="mt-3 text-center">
          <Link href="/" className="text-sm underline" style={{ color: "var(--text-subtle, var(--text-muted))" }}>
            Continue as guest
          </Link>
        </div>
      </main>
    </div>
  );
}
