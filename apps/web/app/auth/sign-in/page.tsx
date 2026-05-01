"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";

const ADJECTIVES = ["Brave", "Swift", "Iron", "Storm", "Silver", "Dark", "Wild", "Ember", "Frost", "Golden"];
const NOUNS = ["Wanderer", "Shadow", "Sage", "Caller", "Knight", "Ranger", "Rogue", "Seeker", "Blade", "Warden"];

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a} ${n}`;
}

function SignInForm() {
  const router = useRouter();
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const searchParams = useSearchParams();
  const verifyError = searchParams.get("verify_error");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    verifyError === "expired"
      ? "Your verification link has expired. Sign in and request a new one."
      : verifyError === "invalid"
      ? "Invalid verification link. Sign in and request a new one."
      : ""
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const msg = mode === "signin" ? "Sign in to EchoQuest." : "Create your EchoQuest account.";
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill a random display name when switching to signup
  useEffect(() => {
    if (mode === "signup" && !name) setName(randomName());
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        mode,
        ...(mode === "signup" ? { name: name.trim() || email.split("@")[0] } : {}),
        redirect: false,
      });
      if (result?.error) {
        let msg: string;
        if (result.error === "Configuration") {
          msg = "Unable to sign in right now. Please try again in a moment.";
        } else if (result.error === "CredentialsSignin") {
          msg = mode === "signup"
            ? "Could not create account. That email may already be in use."
            : "Invalid email or password.";
        } else if (mode === "signup") {
          msg = result.error;
        } else {
          msg = "Sign-in failed. Please try again.";
        }
        setError(msg);
      } else {
        router.replace("/");
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

          {mode === "signup" && (
            <div>
              <label htmlFor="display-name" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  id="display-name"
                  type="text"
                  required
                  minLength={1}
                  maxLength={80}
                  aria-label="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="nickname"
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => setName(randomName())}
                  title="Generate a random adventurer name"
                  aria-label="Generate random name"
                  className="flex-shrink-0 rounded-lg border px-3 py-3 text-lg hover:opacity-80"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
                >
                  🎲
                </button>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                This is how you&apos;ll appear to other players.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
            {mode === "signup" ? (
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                At least 8 characters.
              </p>
            ) : (
              <div className="mt-1 text-right">
                <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
                  Forgot password?
                </Link>
              </div>
            )}
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

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
