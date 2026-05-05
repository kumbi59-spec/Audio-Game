"use client";

interface OperationsManualProps {
  open: boolean;
  onClose: () => void;
}

export function OperationsManual({ open, onClose }: OperationsManualProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="operations-manual-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-2xl">
        <h2 id="operations-manual-title" className="mb-4 text-xl font-bold">
          Help / Operations Manual
        </h2>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2 text-sm text-muted-foreground">
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
              Watch HP in the status area and character sheet. Some encounters are deadly—if you
              push a risky path without preparation, your character can be defeated.
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
            <h3 className="font-semibold text-foreground">Keyboard Shortcuts (Separate)</h3>
            <p>
              Shortcut keys are listed in a separate keyboard-shortcuts dialog. This Help / Operations
              Manual explains game systems and rules.
            </p>
          </section>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Close Help
        </button>
      </div>
    </div>
  );
}
