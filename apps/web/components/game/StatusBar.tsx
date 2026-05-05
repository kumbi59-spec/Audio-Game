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

function normalizeStatLabel(key: string): string {
  return key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function buildUniqueShortLabel(label: string, used: Set<string>): string {
  const compact = label.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "STAT";
  for (let len = 3; len <= Math.min(6, compact.length); len += 1) {
    const candidate = compact.slice(0, len);
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  let suffix = 2;
  let candidate = compact.slice(0, 3);
  while (used.has(`${candidate}${suffix}`)) suffix += 1;
  const finalLabel = `${candidate}${suffix}`;
  used.add(finalLabel);
  return finalLabel;
}

export function StatusBar({ character, session, world, id = "status-bar" }: StatusBarProps) {
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const location = world.locations.find((l) => l.id === session.currentLocationId);
  const s = character.stats;
  const hpPercent = Math.round((s.hp / s.maxHp) * 100);

  const customCoreStats = (() => {
    const used = new Set<string>();
    return Object.entries(character.customStats ?? {})
      .filter(([key]) => !key.endsWith("Max"))
      .sort(([a], [b]) => normalizeStatLabel(a).localeCompare(normalizeStatLabel(b)))
      .slice(0, 3)
      .map(([key, value]) => {
        const label = normalizeStatLabel(key);
        return { label, short: buildUniqueShortLabel(label, used), value };
      });
  })();

  const defaultCoreStats = [
    { label: "Strength", short: "STR", value: s.strength },
    { label: "Agility", short: "AGI", value: s.dexterity },
    { label: "Intellect", short: "INT", value: s.intelligence },
  ];

  const coreStats = customCoreStats.length > 0 ? customCoreStats : defaultCoreStats;
  const coreStatSpeech = coreStats.map((stat) => `${stat.label} ${stat.value}`).join(", ");

  const statusText = `${character.name}, ${character.class}. Health: ${s.hp} of ${s.maxHp}. ${coreStatSpeech}. Location: ${location?.name ?? "Unknown"}. ${session.timeOfDay}, ${session.weather}.`;

  function readStatusAloud() {
    announce(statusText);
    speak(statusText, { rate: ttsSpeed, volume });
  }

  return (
    <div
      id={id}
      role="region"
      aria-label="Character status"
      className="grid gap-2 rounded-lg border border-border bg-background/70 p-3 text-sm md:grid-cols-[auto,1fr,auto,auto]"
    >
      {/* Portrait + core stats */}
      <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1" aria-label="Character portrait and core attributes">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm" aria-hidden="true">
          {character.class === "warrior" ? "🛡️" : character.class === "rogue" ? "🗡️" : character.class === "mage" ? "🔮" : character.class === "ranger" ? "🏹" : "🎵"}
        </div>
        <div className="flex gap-2 text-xs font-mono text-muted-foreground">
          {coreStats.map((stat) => (
            <span key={stat.short}>{stat.short} {stat.value}</span>
          ))}
        </div>
      </div>

      {/* HP */}
      <div
        role="meter"
        aria-label="Health points"
        aria-valuenow={s.hp}
        aria-valuemin={0}
        aria-valuemax={s.maxHp}
        aria-valuetext={`${s.hp} of ${s.maxHp} HP`}
        className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1"
      >
        <span aria-hidden="true">❤️</span>
        <span className="font-mono">
          {s.hp}/{s.maxHp}
        </span>
        <div aria-hidden="true" className="h-2 w-16 overflow-hidden rounded-full bg-muted">
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
      <div
        aria-label={`Location: ${location?.name ?? "Unknown"}`}
        className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1"
      >
        <span aria-hidden="true">📍</span>
        <span className="text-muted-foreground">{location?.shortDesc ?? "Unknown location"}</span>
      </div>

      {/* Time */}
      <div
        aria-label={`Time: ${session.timeOfDay}`}
        className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1"
      >
        <span aria-hidden="true">🕐</span>
        <span className="capitalize text-muted-foreground">{session.timeOfDay}</span>
      </div>

      {/* Turn count */}
      <div aria-label={`Turn ${session.turnCount}`} className="text-muted-foreground md:justify-self-end">
        Turn {session.turnCount}
      </div>

      {/* Read status button */}
      <button
        onClick={readStatusAloud}
        aria-label="Read character status aloud (S)"
        title="Read status aloud (S)"
        className="justify-self-start rounded-md border border-border px-2 py-1 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:justify-self-end"
      >
        <span aria-hidden="true">🔊 Read</span>
      </button>
    </div>
  );
}
