"use client";

import { useId, useState } from "react";
import { useAccessibilityStore, type ThemePreference } from "@/store/accessibility-store";

const THEMES: Array<{ value: ThemePreference; label: string; hint: string }> = [
  { value: "system", label: "Match my device", hint: "Light or dark, following your system setting." },
  { value: "dark", label: "Dark", hint: "Light text on a dark background." },
  { value: "light", label: "Light", hint: "Dark text on a light background." },
];

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={`${id}-hint`}
        className="mt-0.5 h-6 w-6 shrink-0"
      />
      <div>
        <label htmlFor={id} className="font-semibold text-foreground">
          {label}
        </label>
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      </div>
    </div>
  );
}

export function DisplaySettings() {
  const s = useAccessibilityStore();
  const [adsMessage, setAdsMessage] = useState("");

  return (
    <div className="mt-8 space-y-8">
      <fieldset>
        <legend className="text-lg font-semibold text-foreground">Theme</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <label
              key={t.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 ${
                s.theme === t.value ? "border-accent bg-accent-dim" : "border-border bg-surface"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={s.theme === t.value}
                  onChange={() => s.setTheme(t.value)}
                  className="h-5 w-5"
                />
                {t.label}
              </span>
              <span className="text-sm text-muted">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-foreground">Seeing and moving</legend>
        <Toggle
          label="High contrast"
          hint="Pure black background, white text and yellow highlights. Overrides the theme."
          checked={s.highContrast}
          onChange={s.setHighContrast}
        />
        <Toggle
          label="Large text"
          hint="Makes all text and controls 25% bigger."
          checked={s.largeText}
          onChange={s.setLargeText}
        />
        <Toggle
          label="Reduce motion"
          hint="Turns off animations and scene-transition pauses."
          checked={s.reducedMotion}
          onChange={s.setReducedMotion}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-foreground">While playing</legend>
        <Toggle
          label="Audio-only mode"
          hint="Skips visual scene transitions so play is driven entirely by sound."
          checked={s.audioOnlyMode}
          onChange={s.setAudioOnlyMode}
        />
        <Toggle
          label="Move focus to the text box after each turn"
          hint="Off: focus goes to the first choice, which suits screen readers. On: straight to typing."
          checked={s.focusAfterTurn === "input"}
          onChange={(on) => s.setFocusAfterTurn(on ? "input" : "choices")}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-foreground">Ads</legend>
        <Toggle
          label="Hide ads"
          hint="Free for everyone, on any plan. Ads can get in the way of a screen reader, so switch them off whenever you like. There are never ads during play."
          checked={s.hideAds}
          onChange={(on) => {
            s.setHideAds(on);
            setAdsMessage(
              on
                ? "Ads are off. Any ad already on this page goes when the page next loads."
                : "Ads are back on from the next page you open.",
            );
          }}
        />
        <p role="status" className="text-sm text-muted">
          {adsMessage}
        </p>
        {adsMessage && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2 focus-ring"
          >
            Reload this page now
          </button>
        )}
      </fieldset>
    </div>
  );
}
