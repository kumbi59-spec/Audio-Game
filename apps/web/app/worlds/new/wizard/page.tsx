"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak, stopSpeech } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { useCanWeb } from "@/store/entitlements-store";
import { UpgradeModal } from "@/components/entitlements/UpgradeModal";
import { STEPS, EMPTY_DRAFT, type Draft, type WizardStep } from "@/lib/wizard/steps";

export default function WorldWizardPage() {
  const router = useRouter();
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const can = useCanWeb();

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [textInput, setTextInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const recognitionRef = useRef<{ abort: () => void; start: () => void } | null>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isMultiline = step?.kind === "freeform" && (step.id === "pitch" || step.id === "startingScenario");

  // Announce + speak each step on mount and step change
  useEffect(() => {
    if (!step) return;
    const msg = `Step ${stepIndex + 1} of ${STEPS.length}. ${step.prompt}${step.kind === "freeform" && step.helper ? ` ${step.helper}` : ""}`;
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
    promptRef.current?.focus();
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Sync textInput when step changes
  useEffect(() => {
    if (!step) return;
    const current = draft[step.id];
    setTextInput(typeof current === "string" ? current : "");
  }, [stepIndex, step, draft]);

  // Fetch Claude suggestions on freeform steps
  useEffect(() => {
    if (!step || step.kind !== "freeform") {
      setSuggestions([]);
      return;
    }
    if (!can.worldWizard) return;
    setSuggestions([]);
    setLoadingSuggestions(true);
    const draftSnapshot: Record<string, string> = {};
    for (const key of Object.keys(draft)) {
      const val = draft[key as keyof Draft];
      if (typeof val === "string" && val.trim()) draftSnapshot[key] = val;
    }
    let cancelled = false;
    fetch("/api/worlds/wizard/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId: step.id, draft: draftSnapshot }),
    })
      .then((r) => r.json())
      .then((data: { suggestions?: string[] }) => {
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoadingSuggestions(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const advance = useCallback(
    (value: string) => {
      if (!step) return;
      const trimmed = value.trim();
      if (step.kind === "freeform" && step.required && !trimmed) {
        const msg = "This step requires an answer to continue.";
        setError(msg);
        announce(msg, "assertive");
        return;
      }
      setError(null);
      setDraft((d) => ({ ...d, [step.id]: trimmed || d[step.id] }));
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    },
    [step, announce],
  );

  const goBack = useCallback(() => {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const finish = useCallback(async () => {
    if (!can.worldWizard) { setPaywallOpen(true); return; }
    setBusy(true);
    setError(null);
    try {
      const finalDraft: Draft = { ...draft };
      if (step?.id === "characterName") finalDraft.characterName = textInput.trim() || draft.characterName;

      const res = await fetch("/api/worlds/wizard/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...finalDraft, imageUrl: coverImageUrl.trim() || undefined }),
      });
      const data = (await res.json()) as { worldId?: string; error?: string };
      if (!res.ok || !data.worldId) {
        const msg = data.error ?? "Could not create world. Please try again.";
        setError(msg);
        announce(msg, "assertive");
        return;
      }
      const doneMsg = `Your world "${finalDraft.title}" is ready. Starting character creation.`;
      announce(doneMsg, "assertive");
      speak(doneMsg, { rate: ttsSpeed, volume });
      router.push(`/create?worldId=${data.worldId}`);
    } catch {
      const msg = "Network error. Please check your connection and try again.";
      setError(msg);
      announce(msg, "assertive");
    } finally {
      setBusy(false);
    }
  }, [draft, step, textInput, can, router, announce, ttsSpeed, volume]);

  const startVoiceInput = useCallback(() => {
    interface SpeechRecognitionLike {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } | undefined } | undefined } }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      abort: () => void;
      start: () => void;
    }
    type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
    const win = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    const SpeechRecognitionAPI: SpeechRecognitionCtor | null = win
      ? ((win["SpeechRecognition"] as SpeechRecognitionCtor | undefined) ??
         (win["webkitSpeechRecognition"] as SpeechRecognitionCtor | undefined) ??
         null)
      : null;
    if (!SpeechRecognitionAPI) {
      announce("Voice input is not supported in this browser.", "assertive");
      return;
    }
    recognitionRef.current?.abort();
    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    announce("Listening…");
    speak("Listening.", { rate: ttsSpeed, volume });
    setListening(true);

    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (!transcript) return;
      if (step?.kind === "choice") {
        const matched = matchChoice(step, transcript);
        if (matched) { advance(matched); return; }
        const msg = "I didn't catch that. Please click one of the listed options.";
        announce(msg, "assertive");
        speak(msg, { rate: ttsSpeed, volume });
      } else {
        setTextInput(transcript);
      }
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => { setListening(false); };
    rec.start();
  }, [step, advance, announce, ttsSpeed, volume]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (!isLast) advance(textInput);
      } else if (e.key === "ArrowLeft") {
        goBack();
      } else if (e.key === "v" || e.key === "V") {
        startVoiceInput();
      } else if (e.key === "r" || e.key === "R") {
        if (step) speak(step.prompt, { rate: ttsSpeed, volume });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, goBack, startVoiceInput, step, isLast, textInput, ttsSpeed, volume]);

  if (!step) return null;

  const pct = Math.round(((stepIndex) / STEPS.length) * 100);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Skip link */}
      <a
        href="#wizard-main"
        className="sr-only focus:not-sr-only absolute left-4 top-4 rounded px-3 py-1 text-sm font-semibold"
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
      >
        Skip to wizard
      </a>

      <header className="px-6 py-6">
        <Link
          href="/worlds/new"
          className="mb-4 inline-block text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
          aria-label="Back to world creation options"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          World Builder Wizard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Answer {STEPS.length} questions and your world is ready to play.
        </p>
      </header>

      <main id="wizard-main" className="mx-auto max-w-xl px-6 pb-20">
        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}
          className="mb-6"
        >
          <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
            <span>Step {stepIndex + 1} of {STEPS.length}</span>
            <span>{pct}% complete</span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--surface3)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="mb-4 flex flex-wrap gap-1" aria-hidden="true">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === stepIndex ? 24 : 8,
                height: 8,
                backgroundColor:
                  i === stepIndex
                    ? "var(--accent)"
                    : i < stepIndex
                    ? "var(--accent2, #6c7280)"
                    : "var(--surface3)",
              }}
            />
          ))}
        </div>

        {/* Question */}
        <section aria-label={`Question ${stepIndex + 1}`}>
          <h2
            ref={promptRef}
            tabIndex={-1}
            className="mb-1 text-xl font-bold leading-snug outline-none"
            style={{ color: "var(--text)" }}
          >
            {step.prompt}
          </h2>
          {step.kind === "freeform" && step.helper && (
            <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              {step.helper}
            </p>
          )}

          {/* Freeform input */}
          {step.kind === "freeform" && (
            <div className="space-y-4">
              {isMultiline ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  aria-label={step.prompt}
                  aria-describedby={step.helper ? "step-helper" : undefined}
                  aria-required={step.required}
                  className="w-full resize-none rounded-xl border px-4 py-3 text-base outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface2)",
                    color: "var(--text)",
                    minHeight: 120,
                  }}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={busy}
                  placeholder="Type or speak your answer…"
                  rows={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      e.preventDefault();
                      isLast ? void finish() : advance(textInput);
                    }
                  }}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  aria-label={step.prompt}
                  aria-required={step.required}
                  className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface2)",
                    color: "var(--text)",
                  }}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={busy}
                  placeholder="Type or speak your answer…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      isLast ? void finish() : advance(textInput);
                    }
                  }}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              )}

              {/* Suggestion chips */}
              {(loadingSuggestions || suggestions.length > 0) && (
                <div>
                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {loadingSuggestions ? "Getting ideas…" : "Suggestions"}
                  </p>
                  {loadingSuggestions ? (
                    <div
                      className="h-4 w-24 animate-pulse rounded"
                      style={{ backgroundColor: "var(--surface3)" }}
                      aria-label="Loading suggestions"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2" aria-label="Suggestion chips">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTextInput(s);
                            speak(s, { rate: ttsSpeed, volume });
                          }}
                          aria-label={`Use suggestion: ${s}`}
                          disabled={busy}
                          className="rounded-full border px-3 py-1.5 text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                          style={{
                            borderColor: "var(--accent)",
                            backgroundColor: "var(--accentBg, rgba(99,102,241,0.08))",
                            color: "var(--accent)",
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Choice list */}
          {step.kind === "choice" && (
            <div className="space-y-2" role="radiogroup" aria-label={step.prompt}>
              {step.options.map((opt) => {
                const selected = draft[step.id] === opt.value;
                return (
                  <div
                    key={opt.value}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={busy ? -1 : 0}
                    onClick={() => {
                      if (!busy) advance(opt.value);
                    }}
                    onKeyDown={(e) => {
                      if (busy) return;
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        advance(opt.value);
                      }
                    }}
                    aria-disabled={busy}
                    className="flex w-full items-center rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors hover:opacity-90"
                    style={{
                      borderColor: selected ? "var(--accent)" : "var(--border)",
                      backgroundColor: selected
                        ? "var(--accentBg, rgba(99,102,241,0.08))"
                        : "var(--surface2)",
                      color: selected ? "var(--accent)" : "var(--text)",
                      opacity: busy ? 0.4 : 1,
                      cursor: busy ? "not-allowed" : "pointer",
                    }}
                  >
                    <span
                      className="mr-3 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: selected ? "var(--accent)" : "var(--border)",
                        backgroundColor: selected ? "var(--accent)" : "transparent",
                      }}
                      aria-hidden="true"
                    >
                      {selected && (
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: "#fff" }}
                        />
                      )}
                    </span>
                    {opt.label}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Error */}
        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-3 text-sm font-semibold"
            style={{ color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={goBack}
            disabled={busy || stepIndex === 0}
            aria-label="Go to previous step"
            className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            ← Back
          </button>

          <button
            onClick={startVoiceInput}
            disabled={busy}
            aria-label={listening ? "Listening for your answer…" : "Speak your answer (V)"}
            aria-pressed={listening}
            className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{
              borderColor: listening ? "var(--accent)" : "var(--border)",
              backgroundColor: listening ? "var(--accentBg, rgba(99,102,241,0.08))" : "transparent",
              color: listening ? "var(--accent)" : "var(--text)",
            }}
          >
            {listening ? "🎤 Listening…" : "🎤 Speak"}
          </button>

          {step.kind === "freeform" && (
            <button
              onClick={() => isLast ? void finish() : advance(textInput)}
              disabled={busy}
              aria-label={isLast ? "Finish and create your world" : "Advance to next step"}
              aria-busy={busy}
              className="ml-auto rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              {busy ? "Creating…" : isLast ? "Create World →" : "Next →"}
            </button>
          )}
        </div>

        {/* Cover image (shown on last step only) */}
        {isLast && (
          <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface2)" }}>
            <label htmlFor="cover-image-url" className="mb-1 block text-sm font-semibold" style={{ color: "var(--text)" }}>
              Cover image <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span>
            </label>
            <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Paste a public image URL to use as your world&apos;s cover art. Leave blank and one will be generated automatically.
            </p>
            <input
              id="cover-image-url"
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://example.com/my-cover.jpg"
              disabled={busy}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            />
            {coverImageUrl.trim() && (
              <div className="mt-3 overflow-hidden rounded-lg" style={{ maxHeight: 160 }}>
                <img
                  src={coverImageUrl.trim()}
                  alt="Cover preview"
                  className="h-40 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>
        )}

        {/* Keyboard hint */}
        <p className="mt-6 text-xs" style={{ color: "var(--text-faint)" }}>
          Keyboard: <kbd>→ / Enter</kbd> next · <kbd>←</kbd> back · <kbd>V</kbd> voice ·{" "}
          <kbd>R</kbd> repeat question
        </p>
      </main>

      <UpgradeModal
        open={paywallOpen}
        requiredTier="creator"
        featureName="World Builder Wizard"
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}

function matchChoice(
  step: Extract<WizardStep, { kind: "choice" }>,
  transcript: string,
): string | null {
  const normalized = transcript.trim().toLowerCase();
  for (const o of step.options) {
    const label = o.label.toLowerCase();
    if (
      normalized === o.value.toLowerCase() ||
      normalized.includes(o.value.toLowerCase()) ||
      normalized.includes(label.split(/\s+/)[0]!)
    ) {
      return o.value;
    }
  }
  return null;
}
