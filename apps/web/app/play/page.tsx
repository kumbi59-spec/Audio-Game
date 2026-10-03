"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { useShallow } from "zustand/react/shallow";
import { GameShell } from "@/components/game/GameShell";

export default function PlayPage() {
  const router = useRouter();
  const { session, character, world } = useGameStore(
    useShallow((s) => ({ session: s.session, character: s.character, world: s.world })),
  );
  // The first client render hydrates against the server's (empty) store, so
  // the saved game in browser storage isn't visible yet. Only decide there is
  // no game once mounted and the store has loaded — otherwise reloading /play
  // mid-game bounced the player back to the library.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !useGameStore.persist.hasHydrated()) return;
    if (!session || !character || !world) {
      router.replace("/library");
    }
  }, [mounted, session, character, world, router]);

  if (!session || !character || !world) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center"
      >
        <p className="text-muted-foreground">Redirecting to library…</p>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden">
      <GameShell />
    </div>
  );
}
