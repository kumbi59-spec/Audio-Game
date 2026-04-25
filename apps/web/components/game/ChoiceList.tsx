"use client";

import { useEffect, useRef } from "react";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";

interface ChoiceListProps {
  choices: string[];
  onSelect: (index: number, choice: string) => void;
  disabled?: boolean;
}

export function ChoiceList({ choices, onSelect, disabled = false }: ChoiceListProps) {
  const { announce } = useAnnouncer();
  const listRef = useRef<HTMLOListElement>(null);

  // Announce when new choices appear
  useEffect(() => {
    if (choices.length > 0) {
      const summary = `${choices.length} options available: ${choices.map((c, i) => `${i + 1}, ${c}`).join(". ")}`;
      announce(summary);
      // Move focus to the first choice
      const firstBtn = listRef.current?.querySelector<HTMLButtonElement>("button");
      firstBtn?.focus();
    }
  }, [choices, announce]);

  if (choices.length === 0) return null;

  return (
    <nav aria-label="Available choices">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        What do you do?
      </h2>
      <ol ref={listRef} className="flex flex-col gap-2">
        {choices.map((choice, i) => (
          <li key={i}>
            <button
              onClick={() => onSelect(i, choice)}
              disabled={disabled}
              aria-label={`Option ${i + 1}: ${choice}`}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-left text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
              >
                {i + 1}
              </span>
              <span>{choice}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
