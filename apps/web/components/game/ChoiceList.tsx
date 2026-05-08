"use client";

import { useEffect, useRef, useState } from "react";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";

interface ChoiceListProps {
  choices: string[];
  onSelect: (index: number, choice: string) => void;
  disabled?: boolean;
}

export function ChoiceList({ choices, onSelect, disabled = false }: ChoiceListProps) {
  const { announce } = useAnnouncer();
  const listRef = useRef<HTMLOListElement>(null);
  // Local lock to disable the buttons synchronously on click. The parent's
  // `disabled` prop comes from session.isGenerating which only flips after the
  // store update lands, so a fast double-tap could fire onSelect twice in the
  // same render cycle. Reset whenever the choice set changes.
  const [submittedIdx, setSubmittedIdx] = useState<number | null>(null);

  // Announce when new choices appear
  useEffect(() => {
    if (choices.length > 0) {
      setSubmittedIdx(null);
      const summary = `${choices.length} options available: ${choices.map((c, i) => `${i + 1}, ${c}`).join(". ")}`;
      announce(summary);
      // Move focus to the first choice
      const firstBtn = listRef.current?.querySelector<HTMLButtonElement>("button");
      firstBtn?.focus();
    }
  }, [choices, announce]);

  function handleSelect(i: number, choice: string) {
    if (disabled || submittedIdx !== null) return;
    setSubmittedIdx(i);
    onSelect(i, choice);
  }

  if (choices.length === 0) return null;

  return (
    <nav aria-label="Available choices">
      {/* A11y motion checklist: interactions stay fully visible/usable without animation; movement is decorative only; reduced-motion users get static controls. */}
      <ol ref={listRef} className="flex flex-col gap-2.5">
        {choices.map((choice, i) => (
          <li key={i}>
            <button
              onClick={() => handleSelect(i, choice)}
              disabled={disabled || submittedIdx !== null}
              aria-label={`Option ${i + 1}: ${choice}`}
              aria-busy={submittedIdx === i}
              className="choice-button flex w-full items-start gap-3 rounded-xl border border-border bg-secondary/85 px-4 py-3.5 text-left text-base font-medium leading-relaxed text-secondary-foreground transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
              >
                {i + 1}
              </span>
              <span className="pr-1">{choice}</span>
            </button>
          </li>
        ))}
      </ol>
      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          .choice-button {
            transition:
              transform var(--motion-fast) var(--ease-decelerate),
              opacity var(--motion-fast) var(--ease-standard),
              box-shadow var(--motion-medium) var(--ease-standard);
          }
          .choice-button:hover:not(:disabled) {
            transform: translateY(-1px);
          }
          .choice-button:active:not(:disabled) {
            transform: translateY(0) scale(0.99);
            opacity: 0.96;
          }
          .choice-button:focus-visible {
            animation: focusPulse var(--motion-medium) var(--ease-standard) 1;
          }
        }
      `}</style>
    </nav>
  );
}
