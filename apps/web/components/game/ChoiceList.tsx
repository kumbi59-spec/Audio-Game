"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { useGameStore } from "@/store/game-store";

interface ChoiceListProps {
  choices: string[];
  onSelect: (index: number, choice: string) => void;
  disabled?: boolean;
}

// Stop words trimmed before matching choices to quest objectives. Keeping this
// small and English-only is fine — false positives just dim a badge that's
// already conservative (we only badge a single choice per turn).
const STOP_WORDS = new Set([
  "the","a","an","of","to","in","on","at","by","for","with","and","or","but",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","i","you","he","she","it","we","they",
  "my","your","his","her","its","our","their","this","that","these","those",
  "as","if","then","than","so","not","up","down","out","over","off","into",
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w)),
  );
}

/**
 * Returns the index of the choice most likely to advance an active quest,
 * or -1 if no choice has at least 2 significant-word overlaps with quest
 * titles or open objectives. Conservative on purpose — we'd rather miss
 * a quest hint than mislabel a non-quest choice.
 */
function detectQuestChoice(
  choices: string[],
  questCorpus: Set<string>,
): number {
  if (choices.length === 0 || questCorpus.size === 0) return -1;
  let bestIdx = -1;
  let bestScore = 1; // minimum 2 overlaps to badge
  for (let i = 0; i < choices.length; i += 1) {
    const words = significantWords(choices[i] ?? "");
    let score = 0;
    for (const w of words) if (questCorpus.has(w)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function ChoiceList({ choices, onSelect, disabled = false }: ChoiceListProps) {
  const { announce } = useAnnouncer();
  const focusAfterTurn = useAccessibilityStore((s) => s.focusAfterTurn);
  const character = useGameStore((s) => s.character);
  const listRef = useRef<HTMLOListElement>(null);
  // Local lock to disable the buttons synchronously on click. The parent's
  // `disabled` prop comes from session.isGenerating which only flips after the
  // store update lands, so a fast double-tap could fire onSelect twice in the
  // same render cycle. Reset whenever the choice set changes.
  const [submittedIdx, setSubmittedIdx] = useState<number | null>(null);

  // Derive the quest-corpus once per quest list change. Significant words
  // from active quest titles + open objectives.
  const questCorpus = useMemo(() => {
    const words = new Set<string>();
    const quests = character?.quests ?? [];
    for (const q of quests) {
      if (q.status !== "active") continue;
      for (const w of significantWords(q.title)) words.add(w);
      for (const o of q.objectives) {
        if (o.completed) continue;
        for (const w of significantWords(o.text)) words.add(w);
      }
    }
    return words;
  }, [character?.quests]);

  const questChoiceIdx = useMemo(
    () => detectQuestChoice(choices, questCorpus),
    [choices, questCorpus],
  );

  // Announce when new choices appear
  useEffect(() => {
    if (choices.length > 0) {
      setSubmittedIdx(null);
      const summary = `${choices.length} options available: ${choices.map((c, i) => `${i + 1}, ${c}`).join(". ")}`;
      announce(summary);
      // Honour the focusAfterTurn preference. Default ("choices") moves focus
      // to the first choice button — best for screen-reader users navigating
      // choices. Players who mostly type freeform can opt into "input", in
      // which case we leave focus alone here so the input retains it.
      if (focusAfterTurn === "choices") {
        const firstBtn = listRef.current?.querySelector<HTMLButtonElement>("button");
        firstBtn?.focus();
      } else {
        document.getElementById("action-text-input")?.focus();
      }
    }
  }, [choices, announce, focusAfterTurn]);

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
              aria-label={
                i === questChoiceIdx
                  ? `Option ${i + 1}, advances active quest: ${choice}`
                  : `Option ${i + 1}: ${choice}`
              }
              aria-busy={submittedIdx === i}
              className="choice-button flex w-full items-start gap-3 rounded-xl border border-border bg-secondary/85 px-4 py-3.5 text-left text-base font-medium leading-relaxed text-secondary-foreground transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
              >
                {i + 1}
              </span>
              <span className="flex-1 pr-1">
                {choice}
                {i === questChoiceIdx && (
                  <span
                    aria-hidden="true"
                    className="ml-2 inline-block rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-primary"
                  >
                    Quest
                  </span>
                )}
              </span>
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
