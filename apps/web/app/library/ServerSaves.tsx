"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { fetchServerSaves, loadServerSave, type ServerSaveSummary } from "@/lib/game/server-saves";

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

  useEffect(() => {
    let cancelled = false;
    fetchServerSaves()
      .then((list) => { if (!cancelled) setSaves(list); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const visible = saves.filter((s) => !excludeSessionIds.includes(s.id));
  if (visible.length === 0) return null;

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

  return (
    <section
      aria-labelledby="server-saves-heading"
      className="mb-6 rounded-xl border p-4 border-border bg-surface"
    >
      <h2 id="server-saves-heading" className="text-sm font-semibold text-foreground">
        Saved to your account
      </h2>
      <p className="mb-3 text-xs text-muted">
        Pick up where you left off on any device.
      </p>
      <ul className="space-y-2">
        {visible.map((save) => (
          <li key={save.id} className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-foreground">{save.worldName}</p>
              <p className="text-xs text-muted">
                Turn {save.turnCount} · last played {new Date(save.lastPlayedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => resume(save)}
              disabled={loadingId !== null}
              aria-label={`Resume ${save.worldName}, turn ${save.turnCount}`}
              className="min-h-[44px] rounded border px-3 py-2 text-xs disabled:opacity-50 border-border"
            >
              {loadingId === save.id ? "Loading…" : "Resume"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
