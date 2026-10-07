"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { DeleteSaveButton } from "@/components/game/DeleteSaveButton";
import { deleteServerSave, fetchServerSaves, loadServerSave, type ServerSaveSummary } from "@/lib/game/server-saves";

/**
 * Games saved on the server for this account (or this browser's guest), so a
 * campaign can be picked up on any device. Games already listed from this
 * browser's own storage are left out to avoid showing them twice.
 */
export function ServerSaves({ excludeSessionIds }: { excludeSessionIds: string[] }) {
  const router = useRouter();
  const { narrate } = useAnnouncer();
  const [saves, setSaves] = useState<ServerSaveSummary[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  // Once a save is deleted the section stays, so focus has somewhere to land
  // even if that was the last one.
  const [deletedAny, setDeletedAny] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchServerSaves()
      .then((list) => { if (!cancelled) setSaves(list); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const visible = saves.filter((s) => !excludeSessionIds.includes(s.id));
  if (visible.length === 0 && !deletedAny) return null;

  async function resume(save: ServerSaveSummary) {
    setLoadingId(save.id);
    narrate(`Loading ${save.worldName}…`);
    const result = await loadServerSave(save.id);
    if (!result.ok) {
      setLoadingId(null);
      narrate(result.message, "assertive");
      return;
    }
    router.push("/play");
  }

  async function remove(save: ServerSaveSummary): Promise<boolean> {
    const result = await deleteServerSave(save.id);
    if (!result.ok) {
      narrate(result.message, "assertive");
      return false;
    }
    setSaves((list) => list.filter((s) => s.id !== save.id));
    setDeletedAny(true);
    narrate(`Deleted the ${save.worldName} save from turn ${save.turnCount}.`);
    headingRef.current?.focus();
    return true;
  }

  return (
    <section
      aria-labelledby="server-saves-heading"
      className="mb-6 rounded-xl border p-4 border-border bg-surface"
    >
      <h2
        id="server-saves-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-sm font-semibold text-foreground focus:outline-none"
      >
        Saved to your account
      </h2>
      <p className="mb-3 text-xs text-muted">
        {visible.length > 0
          ? "Pick up where you left off on any device."
          : "No games are saved to your account any more."}
      </p>
      <ul className="space-y-2">
        {visible.map((save) => (
          <li key={save.id} className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-foreground">{save.worldName}</p>
              <p className="text-xs text-muted">
                Turn {save.turnCount} · last played {new Date(save.lastPlayedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => resume(save)}
                disabled={loadingId !== null}
                aria-label={`Resume ${save.worldName}, turn ${save.turnCount}`}
                className="min-h-[44px] rounded border px-3 py-2 text-xs disabled:opacity-50 border-border"
              >
                {loadingId === save.id ? "Loading…" : "Resume"}
              </button>
              <DeleteSaveButton
                saveName={`${save.worldName}, turn ${save.turnCount}`}
                onConfirm={() => remove(save)}
                disabled={loadingId !== null}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
