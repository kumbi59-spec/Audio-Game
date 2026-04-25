"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { GameShell } from "@/components/game/GameShell";
import Link from "next/link";

export default function PlayPage() {
  const router = useRouter();
  const { session, character, world } = useGameStore();

  useEffect(() => {
    if (!session || !character || !world) {
      router.replace("/library");
    }
  }, [session, character, world, router]);

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
    <div className="flex h-screen flex-col">
      {/* Minimal top nav */}
      <nav
        aria-label="Game navigation"
        className="flex items-center justify-between border-b border-border px-4 py-2"
      >
        <Link
          href="/library"
          className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Exit game and return to library"
        >
          ← Exit
        </Link>
        <p className="text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1 font-mono">H</kbd> for keyboard shortcuts
        </p>
      </nav>

      {/* Main game shell */}
      <div className="flex-1 overflow-hidden">
        <GameShell />
      </div>
    </div>
  );
}
