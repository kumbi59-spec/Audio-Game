"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Delete for a saved game, with a confirm step in place of the button. Focus
 * moves to "Keep it" (the safe choice) and Escape backs out, so a stray key
 * press can't delete a save.
 *
 * `onConfirm` resolves true once the save is gone; the caller then removes the
 * row and moves focus somewhere sensible. On false the button comes back.
 */
export function DeleteSaveButton({
  saveName,
  confirmText = "Delete this save? It can't be undone.",
  onConfirm,
  disabled = false,
}: {
  /** Names the save for screen readers, e.g. "The Shattered Reaches, turn 27". */
  saveName: string;
  confirmText?: string;
  onConfirm: () => Promise<boolean>;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const backToDelete = useRef(false);
  const textId = useId();

  useEffect(() => {
    if (confirming) {
      keepRef.current?.focus();
    } else if (backToDelete.current) {
      backToDelete.current = false;
      deleteRef.current?.focus();
    }
  }, [confirming]);

  function cancel() {
    backToDelete.current = true;
    setConfirming(false);
  }

  // Escape backs out from either button (focus is always on one of them).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !busy) {
      e.stopPropagation();
      cancel();
    }
  }

  async function confirm() {
    setBusy(true);
    const deleted = await onConfirm();
    setBusy(false);
    if (!deleted) cancel();
  }

  if (!confirming) {
    return (
      <button
        ref={deleteRef}
        type="button"
        onClick={() => setConfirming(true)}
        disabled={disabled}
        aria-label={`Delete save: ${saveName}`}
        className="min-h-[44px] rounded border border-border px-3 py-2 text-xs text-muted hover:border-danger hover:text-danger disabled:opacity-50 focus-ring"
      >
        Delete
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Delete save: ${saveName}`}
      className="flex flex-wrap items-center gap-2"
    >
      <span id={textId} className="text-xs text-foreground">
        {confirmText}
      </span>
      <button
        type="button"
        onClick={confirm}
        onKeyDown={onKeyDown}
        disabled={busy}
        className="min-h-[44px] rounded border border-danger px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 disabled:opacity-50 focus-ring"
      >
        {busy ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        ref={keepRef}
        type="button"
        onClick={cancel}
        onKeyDown={onKeyDown}
        disabled={busy}
        aria-describedby={textId}
        className="min-h-[44px] rounded border border-border px-3 py-2 text-xs focus-ring"
      >
        Keep it
      </button>
    </div>
  );
}
