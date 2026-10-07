"use client";

import { useEffect, useRef } from "react";
import { SHORTCUT_HELP } from "@/components/accessibility/KeyboardShortcuts";
import { useDialogFocus } from "@/components/accessibility/FocusManager";

interface OperationsManualProps {
  open: boolean;
  onClose: () => void;
}

export function OperationsManual({ open, onClose }: OperationsManualProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useDialogFocus(open, panelRef, titleRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="operations-manual-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div ref={panelRef} className="w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-2xl">
        <h2 ref={titleRef} tabIndex={-1} id="operations-manual-title" className="mb-4 text-xl font-bold focus:outline-none">
          Help / Operations Manual
        </h2>

        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must take focus so keyboard users can scroll it */}
        <div tabIndex={0}
          role="region"
          aria-label="Manual contents"
          className="max-h-[70vh] space-y-4 overflow-y-auto pr-2 text-sm text-muted-foreground focus-ring"
        >
          <section>
            <h3 className="font-semibold text-foreground">Actions &amp; Dialogue</h3>
            <p>
              Type what your character attempts, or pick a numbered choice. Dialogue and actions both
              advance the story. Use clear intent (for example: negotiate, investigate, or retreat)
              to guide outcomes.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">Combat &amp; Rules</h3>
            <p>
              Watch HP in the status area and character sheet. Risky moves call for a dice roll
              against your stats. Drop to 0 HP and the story turns against you: you might be
              captured, robbed, or wake hours later with a price to pay.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">Inventory</h3>
            <p>
              Important items are tracked automatically. When you gain, consume, or lose equipment,
              the game updates your inventory state for future checks and options.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">Quests</h3>
            <p>
              Objectives update automatically as you discover clues, finish milestones, or resolve
              conflicts. Revisit your quest log to decide your next priority.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">Keyboard Shortcuts</h3>
            <p className="mb-2">Single keys work anywhere except while you&apos;re typing. Press ? for this list on its own.</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {SHORTCUT_HELP.map(({ key, description }) => (
                <div key={key} className="contents">
                  <dt>
                    <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">{key}</kbd>
                  </dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Close Help (Escape)
        </button>
      </div>
    </div>
  );
}
