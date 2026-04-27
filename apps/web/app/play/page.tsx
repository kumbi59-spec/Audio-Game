"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { GameShell } from "@/components/game/GameShell";

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
    <div className="h-screen overflow-hidden">
      <GameShell />
    </div>
  );
}
