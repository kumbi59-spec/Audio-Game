"use client";

import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import type { CharacterData } from "@/types/character";
import type { InMemorySession } from "@/types/game";
import type { WorldData } from "@/types/world";

interface StatusBarProps {
  character: CharacterData;
  session: InMemorySession;
  world: WorldData;
  id?: string;
}

export function StatusBar({ character, session, world, id = "status-bar" }: StatusBarProps) {
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const location = world.locations.find((l) => l.id === session.currentLocationId);
  const s = character.stats;
  const hpPercent = Math.round((s.hp / s.maxHp) * 100);

  const statusText = `${character.name}, ${character.class}. Health: ${s.hp} of ${s.maxHp}. Location: ${location?.name ?? "Unknown"}. ${session.timeOfDay}, ${session.weather}.`;

  function readStatusAloud() {
    announce(statusText);
    speak(statusText, { rate: ttsSpeed, volume });
  }

  return (
    <div
      id={id}
      role="region"
      aria-label="Character status"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs"
    >
      {/* HP */}
      <div
        role="meter"
        aria-label="Health points"
        aria-valuenow={s.hp}
        aria-valuemin={0}
        aria-valuemax={s.maxHp}
        aria-valuetext={`${s.hp} of ${s.maxHp} HP`}
        className="flex items-center gap-2"
      >
        <span aria-hidden="true">❤️</span>
        <span className="font-mono">
          {s.hp}/{s.maxHp}
        </span>
        <div
          aria-hidden="true"
          className="h-2 w-16 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={`h-full rounded-full transition-all ${
              hpPercent > 50
                ? "bg-green-500"
                : hpPercent > 25
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Location */}
      <div aria-label={`Location: ${location?.name ?? "Unknown"}`} className="flex items-center gap-1">
        <span aria-hidden="true">📍</span>
        <span className="text-muted-foreground">{location?.shortDesc ?? "Unknown location"}</span>
      </div>

      {/* Time */}
      <div aria-label={`Time: ${session.timeOfDay}`} className="flex items-center gap-1">
        <span aria-hidden="true">🕐</span>
        <span className="capitalize text-muted-foreground">{session.timeOfDay}</span>
      </div>

      {/* Turn count */}
      <div aria-label={`Turn ${session.turnCount}`} className="ml-auto text-muted-foreground">
        Turn {session.turnCount}
      </div>

      {/* Read status button */}
      <button
        onClick={readStatusAloud}
        aria-label="Read character status aloud (S)"
        title="Read status aloud (S)"
        className="ml-1 rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span aria-hidden="true">🔊</span>
      </button>
    </div>
  );
}
