"use client";

import { useState, useEffect, useRef } from "react";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import type { CharacterData } from "@/types/character";

interface CharacterSheetProps {
  character: CharacterData;
  onClose: () => void;
}

type Tab = "stats" | "inventory" | "quests" | "bio";

const TAB_LABELS: Record<Tab, string> = {
  stats: "Stats",
  inventory: "Inventory",
  quests: "Quests",
  bio: "Bio",
};

const CATEGORY_ICONS: Record<string, string> = {
  weapon: "⚔️",
  armor: "🛡️",
  consumable: "🧪",
  key: "🗝️",
  misc: "📦",
};

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((Math.max(0, value) / Math.max(1, max)) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value}/{max}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        role="meter"
        aria-label={`${label}: ${value} of ${max}`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        style={{ backgroundColor: "var(--surface3)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-lg px-3 py-2 text-center"
      style={{ backgroundColor: "var(--surface2)" }}
    >
      <div className="text-lg font-bold tabular-nums" style={{ color: "var(--text)" }}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
    </div>
  );
}

function xpForNextLevel(level: number) { return level * 100; }
function xpIntoLevel(totalXp: number, level: number) {
  let cumulative = 0;
  for (let l = 1; l < level; l++) cumulative += xpForNextLevel(l);
  return Math.max(0, totalXp - cumulative);
}

function StatsTab({ character }: { character: CharacterData }) {
  const s = character.stats;
  const hpPct = Math.round((s.hp / s.maxHp) * 100);
  const hpColor = hpPct > 50 ? "#22c55e" : hpPct > 25 ? "#eab308" : "#ef4444";

  const customStatEntries = Object.entries(character.customStats ?? {});

  const xpNeeded = xpForNextLevel(s.level);
  const xpProgress = xpIntoLevel(s.experience, s.level);
  const xpPct = Math.min(100, Math.round((xpProgress / xpNeeded) * 100));

  return (
    <div className="space-y-5">
      {/* Level / XP */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold"
          style={{ backgroundColor: "var(--accentBg, rgba(99,102,241,0.15))", color: "var(--accent)" }}
          aria-label={`Level ${s.level}`}
        >
          {s.level}
        </div>
        <div className="flex-1">
          <div className="mb-0.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
            {character.roleTitle ?? character.class.charAt(0).toUpperCase() + character.class.slice(1)}
          </div>
          {/* XP progress bar */}
          <div
            className="mb-1 flex justify-between text-xs"
            style={{ color: "var(--text-muted)" }}
            aria-label={`Experience: ${s.experience} total, ${xpProgress} of ${xpNeeded} XP towards level ${s.level + 1}`}
          >
            <span>{s.experience} XP total</span>
            <span>{xpProgress}/{xpNeeded} to lv.{s.level + 1}</span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            role="meter"
            aria-valuenow={xpProgress}
            aria-valuemin={0}
            aria-valuemax={xpNeeded}
            style={{ backgroundColor: "var(--surface3)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, backgroundColor: "var(--accent)" }}
            />
          </div>
        </div>
      </div>

      {/* HP bar */}
      <StatBar label="Health (HP)" value={s.hp} max={s.maxHp} color={hpColor} />

      {/* Custom resource bars (MP, Stamina, Sanity, etc.) */}
      {customStatEntries
        .filter(([k]) => k.endsWith("Max") === false)
        .map(([key, val]) => {
          const maxKey = key + "Max";
          const maxVal = character.customStats?.[maxKey] ?? val;
          const hasMax = character.customStats?.[maxKey] !== undefined;
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          if (hasMax) {
            const color = key.toLowerCase().includes("mana") || key.toLowerCase().includes("mp") ? "#818cf8"
              : key.toLowerCase().includes("stamina") ? "#f59e0b"
              : key.toLowerCase().includes("sanity") ? "#a78bfa"
              : "var(--accent)";
            return <StatBar key={key} label={label} value={val} max={maxVal} color={color} />;
          }
          return null;
        })}

      {/* Core attributes */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          Attributes
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <StatItem label="STR" value={s.strength} />
          <StatItem label="DEX" value={s.dexterity} />
          <StatItem label="INT" value={s.intelligence} />
          <StatItem label="CHA" value={s.charisma} />
        </div>
      </div>

      {/* Extra custom stats (those without a matching Max key and not a Max key themselves) */}
      {customStatEntries.some(([k]) => !k.endsWith("Max") && character.customStats?.[k + "Max"] === undefined) && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Other
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {customStatEntries
              .filter(([k]) => !k.endsWith("Max") && character.customStats?.[k + "Max"] === undefined)
              .map(([key, val]) => (
                <StatItem key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryTab({ character }: { character: CharacterData }) {
  const inv = character.inventory;
  if (inv.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Your pack is empty.
      </p>
    );
  }

  const byCategory = inv.reduce<Record<string, typeof inv>>((acc, item) => {
    const cat = item.category ?? "misc";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(item);
    return acc;
  }, {});

  const categoryOrder = ["weapon", "armor", "consumable", "key", "misc"];
  const sorted = categoryOrder.filter((c) => byCategory[c]);

  return (
    <div className="space-y-4">
      {sorted.map((cat) => (
        <div key={cat}>
          <h3
            className="mb-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-faint)" }}
          >
            {CATEGORY_ICONS[cat] ?? "📦"} {cat.charAt(0).toUpperCase() + cat.slice(1)}s
          </h3>
          <ul className="space-y-1.5" aria-label={`${cat} items`}>
            {byCategory[cat]!.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--surface2)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--accentBg, rgba(99,102,241,0.12))",
                          color: "var(--accent)",
                        }}
                      >
                        ×{item.quantity}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {item.description}
                    </p>
                  )}
                  {/* Extra properties from Game Bible */}
                  {Object.keys(item.properties).length > 0 && (
                    <p className="mt-0.5 text-xs italic" style={{ color: "var(--text-faint)" }}>
                      {Object.entries(item.properties)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function QuestsTab({ character }: { character: CharacterData }) {
  const active = character.quests.filter((q) => q.status === "active");
  const completed = character.quests.filter((q) => q.status === "completed");
  const failed = character.quests.filter((q) => q.status === "failed");

  if (character.quests.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        No quests yet. Adventure awaits.
      </p>
    );
  }

  function QuestCard({ quest, accent }: { quest: typeof character.quests[number]; accent: string }) {
    const open = quest.objectives.filter((o) => !o.completed).length;
    const total = quest.objectives.length;
    return (
      <li
        className="rounded-lg p-3"
        style={{ backgroundColor: "var(--surface2)" }}
        aria-label={`${quest.title}: ${quest.status}`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-base" aria-hidden="true">
            {quest.status === "active" ? "📜" : quest.status === "completed" ? "✅" : "❌"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {quest.title}
              </span>
              {total > 0 && quest.status === "active" && (
                <span className="text-xs" style={{ color: accent }}>
                  {total - open}/{total}
                </span>
              )}
            </div>
            {quest.description && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {quest.description}
              </p>
            )}
            {quest.objectives.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {quest.objectives.map((obj) => (
                  <li key={obj.id} className="flex items-start gap-1.5 text-xs" style={{ color: obj.completed ? "var(--text-faint)" : "var(--text-muted)" }}>
                    <span aria-hidden="true">{obj.completed ? "✓" : "○"}</span>
                    <span style={{ textDecoration: obj.completed ? "line-through" : "none" }}>
                      {obj.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {quest.reward && (
              <p className="mt-1.5 text-xs italic" style={{ color: "var(--text-faint)" }}>
                Reward: {quest.reward}
              </p>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-5">
      {active.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Active
          </h3>
          <ul className="space-y-2">
            {active.map((q) => <QuestCard key={q.id} quest={q} accent="var(--accent)" />)}
          </ul>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Completed
          </h3>
          <ul className="space-y-2">
            {completed.map((q) => <QuestCard key={q.id} quest={q} accent="#22c55e" />)}
          </ul>
        </div>
      )}
      {failed.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Failed
          </h3>
          <ul className="space-y-2">
            {failed.map((q) => <QuestCard key={q.id} quest={q} accent="#ef4444" />)}
          </ul>
        </div>
      )}
    </div>
  );
}

function BioTab({ character }: { character: CharacterData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
          style={{
            backgroundColor: "var(--accentBg, rgba(99,102,241,0.15))",
            color: "var(--accent)",
          }}
          aria-hidden="true"
        >
          {character.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {character.name}
          </div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            {character.roleTitle ?? character.class.charAt(0).toUpperCase() + character.class.slice(1)}
            {character.pronouns ? ` · ${character.pronouns}` : ""}
            {typeof character.age === "number" ? ` · Age ${character.age}` : ""}
          </div>
        </div>
      </div>

      {character.shortDescription && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Appearance
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {character.shortDescription}
          </p>
        </div>
      )}

      {character.backstory && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Backstory
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {character.backstory}
          </p>
        </div>
      )}
    </div>
  );
}

export function CharacterSheet({ character, onClose }: CharacterSheetProps) {
  const [tab, setTab] = useState<Tab>("stats");
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus inside dialog
  useEffect(() => {
    closeRef.current?.focus();
    const el = dialogRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !el) return;
      const focusable = Array.from(
        el.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function switchTab(t: Tab) {
    setTab(t);
    announce(TAB_LABELS[t]);
  }

  // Build TTS summary for screen readers
  function readSheetAloud() {
    const s = character.stats;
    const inv = character.inventory.map((i) => `${i.name}${i.quantity > 1 ? ` times ${i.quantity}` : ""}`).join(", ") || "none";
    const active = character.quests.filter((q) => q.status === "active").map((q) => q.title).join(", ") || "none";
    const custom = Object.entries(character.customStats ?? {})
      .filter(([k]) => !k.endsWith("Max"))
      .map(([k, v]) => `${k} ${v}`)
      .join(", ");
    const xpNeeded = xpForNextLevel(s.level);
    const xpProgress = xpIntoLevel(s.experience, s.level);
    const text = [
      `${character.name}, ${character.roleTitle ?? character.class}, level ${s.level}.`,
      `Health: ${s.hp} of ${s.maxHp}.`,
      `Experience: ${s.experience} total. ${xpProgress} of ${xpNeeded} XP towards level ${s.level + 1}.`,
      custom ? `Other stats: ${custom}.` : "",
      `Strength ${s.strength}, Dexterity ${s.dexterity}, Intelligence ${s.intelligence}, Charisma ${s.charisma}.`,
      `Inventory: ${inv}.`,
      `Active quests: ${active}.`,
    ].filter(Boolean).join(" ");
    announce(text, "assertive");
    speak(text, { rate: ttsSpeed, volume });
  }

  const s = character.stats;
  const hpPct = Math.round((s.hp / s.maxHp) * 100);
  const hpColor = hpPct > 50 ? "#22c55e" : hpPct > 25 ? "#eab308" : "#ef4444";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${character.name}'s character sheet`}
        className="flex w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Mini HP bar in header */}
          <div
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-mono"
            style={{ backgroundColor: "var(--surface2)" }}
            aria-label={`HP: ${s.hp} of ${s.maxHp}`}
          >
            <span aria-hidden="true">❤️</span>
            <span style={{ color: "var(--text)" }}>{s.hp}/{s.maxHp}</span>
            <div
              className="h-1.5 w-12 overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--surface3)" }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
              {character.name}
            </span>
            <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Lv.{s.level} {character.roleTitle ?? character.class}
            </span>
          </div>

          <button
            onClick={readSheetAloud}
            aria-label="Read character sheet aloud"
            title="Read aloud"
            className="rounded-lg border px-2 py-1 text-xs hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            🔊
          </button>

          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close character sheet (C or Escape)"
            className="rounded-lg border px-2.5 py-1 text-xs font-semibold hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="flex shrink-0 gap-1 border-b px-4 py-2"
          role="tablist"
          aria-label="Character sheet sections"
          style={{ borderColor: "var(--border)" }}
        >
          {(["stats", "inventory", "quests", "bio"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              aria-controls={`sheet-panel-${t}`}
              onClick={() => switchTab(t)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "#ffffff" : "var(--text-muted)",
              }}
            >
              {TAB_LABELS[t]}
              {t === "inventory" && character.inventory.length > 0 && (
                <span className="ml-1 opacity-70">({character.inventory.length})</span>
              )}
              {t === "quests" && character.quests.filter((q) => q.status === "active").length > 0 && (
                <span className="ml-1 opacity-70">
                  ({character.quests.filter((q) => q.status === "active").length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          id={`sheet-panel-${tab}`}
          role="tabpanel"
          aria-label={TAB_LABELS[tab]}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {tab === "stats" && <StatsTab character={character} />}
          {tab === "inventory" && <InventoryTab character={character} />}
          {tab === "quests" && <QuestsTab character={character} />}
          {tab === "bio" && <BioTab character={character} />}
        </div>

        {/* Footer hint */}
        <div
          className="shrink-0 border-t px-4 py-2 text-center text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
        >
          <kbd>C</kbd> toggle · <kbd>Esc</kbd> close · <kbd>🔊</kbd> read aloud
        </div>
      </div>
    </div>
  );
}
