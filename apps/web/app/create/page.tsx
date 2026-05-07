"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useGameStore } from "@/store/game-store";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";
import { CLASS_DESCRIPTIONS } from "@/types/character";
import type { CharacterClass, CharacterData } from "@/types/character";
import type { InMemorySession } from "@/types/game";
import type { WorldData } from "@/types/world";
import {
  CORE_STAT_KEYS,
  resolveStatRules,
  sumCoreStats,
  sumCustomStats,
  type CoreStatKey,
  type StatRules,
} from "@/lib/character/stat-rules";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

type Step = "name" | "class" | "backstory" | "starting";

const CLASSLESS_STARTING_STATS: CharacterData["stats"] = {
  hp: 20,
  maxHp: 20,
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  charisma: 10,
  level: 1,
  experience: 0,
};


function parseCustomStatNames(rulesNotes?: string): string[] {
  if (!rulesNotes) return [];
  const threeStatsMatch = rulesNotes.match(/three stats\s*:\s*([^\n]+)/i);
  if (threeStatsMatch?.[1]) {
    return threeStatsMatch[1]
      .split(",")
      .map((part) => part.trim().split(/\s*\(/)[0]?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 4);
  }

  const bulletMatches = [...rulesNotes.matchAll(/[-*]\s*([A-Za-z][A-Za-z\s'-]{1,24})\s*:\s*/g)]
    .map((m) => m[1]?.trim() ?? "")
    .filter((v) => /stat|skill|attribute|lore|grit|sense|focus|will|might|agility|intellect|charisma|dexterity|strength/i.test(v));

  return Array.from(new Set(bulletMatches)).slice(0, 4);
}

function CreateCharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const worldId = searchParams.get("worldId") ?? PREBUILT_WORLDS[0].id;
  const [world, setLoadedWorld] = useState<WorldData | null>(null);
  const [worldLoadError, setWorldLoadError] = useState<string | null>(null);

  const { narrate } = useAnnouncer();
  const { setSession, setCharacter, setWorld: setStoreWorld, setDbSessionId } = useGameStore();

  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("warrior");
  const [selectedWorldClass, setSelectedWorldClass] = useState<string | null>(null);
  const [customRoleTitle, setCustomRoleTitle] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [age, setAge] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [backstory, setBackstory] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [coreStatOverrides, setCoreStatOverrides] = useState(CLASS_DESCRIPTIONS[selectedClass].startingStats);
  const [draftCoreStats, setDraftCoreStats] = useState<Record<CoreStatKey, string>>(
    () => Object.fromEntries(CORE_STAT_KEYS.map((k) => [k, String(CLASS_DESCRIPTIONS[selectedClass].startingStats[k])])) as Record<CoreStatKey, string>,
  );
  const [customStatOverrides, setCustomStatOverrides] = useState<Record<string, number>>({});
  const [draftCustomStats, setDraftCustomStats] = useState<Record<string, string>>({});

  useEffect(() => {
    const prebuiltWorld = PREBUILT_WORLDS.find((w) => w.id === worldId);
    if (prebuiltWorld) {
      setLoadedWorld(prebuiltWorld);
      setWorldLoadError(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/worlds/${worldId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "Failed to load world.");
        }
        return res.json() as Promise<WorldData>;
      })
      .then((data) => {
        if (cancelled) return;
        setLoadedWorld(data);
        setWorldLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadedWorld(null);
        setWorldLoadError(err instanceof Error ? err.message : "Failed to load world.");
      });

    return () => {
      cancelled = true;
    };
  }, [worldId]);

  useEffect(() => {
    if (!world) return;
    narrate(`Character creation for ${world.name}. Step 1: Enter your character's name.`);
  }, [world, narrate]);

  const worldDefinesClasses = Boolean(world?.classes && world.classes.length > 0);

  const statRules: StatRules = useMemo(
    () =>
      resolveStatRules({
        isPrebuilt: world?.isPrebuilt,
        rulesNotes: world?.rulesNotes,
        statRules: world?.statRules,
        characterClass: worldDefinesClasses ? selectedClass : null,
        worldDefinesClasses,
      }),
    [world?.isPrebuilt, world?.rulesNotes, world?.statRules, worldDefinesClasses, selectedClass],
  );

  useEffect(() => {
    if (!world) return;
    const starting = worldDefinesClasses ? CLASS_DESCRIPTIONS[selectedClass].startingStats : CLASSLESS_STARTING_STATS;
    setCoreStatOverrides({ ...starting });
    setDraftCoreStats(
      Object.fromEntries(CORE_STAT_KEYS.map((k) => [k, String(starting[k])])) as Record<CoreStatKey, string>,
    );

    const customNames = parseCustomStatNames(world.rulesNotes);
    if (customNames.length > 0) {
      setCustomStatOverrides((prev) => {
        const next: Record<string, number> = {};
        for (const name of customNames) next[name] = prev[name] ?? 10;
        return next;
      });
      setDraftCustomStats((prev) => {
        const next: Record<string, string> = {};
        for (const name of customNames) next[name] = String(prev[name] ?? 10);
        return next;
      });
    } else {
      setCustomStatOverrides({});
      setDraftCustomStats({});
    }
  }, [selectedClass, world, worldDefinesClasses]);

  const corePointsSpent = sumCoreStats(coreStatOverrides);
  const corePointsBudget = statRules.totalPointPool;
  const corePointsRemaining = corePointsBudget !== null ? corePointsBudget - corePointsSpent : null;

  /**
   * Clamp a candidate value into the per-stat range and ensure it doesn't push
   * the total core-stat pool past the world's allowance. The pool is only
   * enforced on the four core stats; custom stats use their own per-stat caps.
   */
  function clampCoreStat(key: CoreStatKey, candidate: number, current: number): number {
    if (!Number.isFinite(candidate)) return current;
    let next = Math.max(statRules.perStatMin, Math.min(statRules.perStatMax, Math.floor(candidate)));
    if (corePointsBudget !== null) {
      const otherCoreSum = CORE_STAT_KEYS.reduce(
        (acc, k) => (k === key ? acc : acc + coreStatOverrides[k]),
        0,
      );
      const maxAllowedByPool = corePointsBudget - otherCoreSum;
      if (next > maxAllowedByPool) next = Math.max(statRules.perStatMin, maxAllowedByPool);
    }
    return next;
  }

  function clampCustomStat(candidate: number, current: number): number {
    if (!Number.isFinite(candidate)) return current;
    return Math.max(statRules.perStatMin, Math.min(statRules.perStatMax, Math.floor(candidate)));
  }

  /** True when the total core-stat pool currently exceeds the budget. Drives
   *  the disabled-state of "Begin Adventure" so a player can't ship a build
   *  that violates the world's rules. */
  const overBudget = corePointsBudget !== null && corePointsSpent > corePointsBudget;
  // Custom stats omitted from the over-budget check: they get per-stat caps
  // only. Track their total so we can also surface it for transparency.
  const customPointsSpent = sumCustomStats(customStatOverrides);
  void customPointsSpent;


  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    narrate(`Name set to ${name}. Step 2: Choose your role.`);
    setStep("class");
  }

  function handleWorldClassSelect(cls: { name: string; description: string }) {
    setSelectedWorldClass(cls.name);
    narrate(`${cls.name} selected. ${cls.description}. Press Continue to proceed or choose a different class.`);
  }

  function handleClassSubmit() {
    const displayClass =
      selectedWorldClass ??
      customRoleTitle.trim() ??
      CLASS_DESCRIPTIONS[selectedClass].name;
    narrate(
      `Class confirmed as ${displayClass}. Step 3 of 3: Optional character details. ` +
      `You can fill in pronouns, age, appearance, and a written backstory, or skip them entirely. ` +
      `Empty fields are fine — the Game Master will let your character be discovered through play.`,
    );
    setStep("backstory");
  }

  async function handleStart(opts: { skipBackstory?: boolean } = {}) {
    if (!world) return;
    setIsStarting(true);
    narrate("Starting your adventure. The Game Master is preparing your world…");

    const worldDefinesClasses = Boolean(world.classes && world.classes.length > 0);
    const classData = CLASS_DESCRIPTIONS[selectedClass];
    const startingStats = { ...coreStatOverrides };
    const startingItems = worldDefinesClasses ? classData.startingItems : [];
    const parsedAge = Number.parseInt(age.trim(), 10);
    const character: CharacterData = {
      id: `char-${Date.now()}`,
      name: name.trim(),
      pronouns: pronouns.trim() || null,
      age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : null,
      shortDescription: shortDescription.trim() || null,
      class: selectedClass,
      roleTitle: (selectedWorldClass ?? customRoleTitle.trim()) || null,
      backstory: opts.skipBackstory ? "" : backstory.trim(),
      stats: { ...startingStats },
      ...(Object.keys(customStatOverrides).length > 0 ? { customStats: { ...customStatOverrides } } : {}),
      inventory: startingItems.map((item, i) => ({
        id: `item-${i}`,
        name: item,
        description: "",
        category: "misc" as const,
        quantity: 1,
        properties: {},
      })),
      quests: [],
    };

    const session: InMemorySession = {
      id: `session-${Date.now()}`,
      worldId: world.id,
      characterId: character.id,
      status: "active",
      turnCount: 0,
      currentLocationId: world.locations[0]?.id ?? null,
      timeOfDay: "morning",
      weather: "clear",
      globalFlags: {},
      npcStates: {},
      memorySummary: "",
      history: [],
      narrationLog: [],
      choices: [],
      isGenerating: false,
      achievements: [],
      relationships: [],
      codex: [],
    };

    setStoreWorld(world);
    setCharacter(character);
    setSession(session);

    // Persist to DB in the background (best-effort — game works without it)
    const guestId = (() => {
      const stored = localStorage.getItem("echoquest-guest-id");
      if (stored) return stored;
      const id = crypto.randomUUID();
      localStorage.setItem("echoquest-guest-id", id);
      return id;
    })();

    fetch("/api/game/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, worldId: world.id, character }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { sessionId?: string } | null) => {
        if (data?.sessionId) setDbSessionId(data.sessionId);
      })
      .catch(() => undefined);

    // Generate opening narration via the server API route (keeps API key server-side)
    try {
      const res = await fetch("/api/game/opening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ world, character }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const opening = await res.json();

      // Update the session with the opening narration in the game store
      useGameStore.setState((s) => ({
        session: s.session
          ? {
              ...s.session,
              narrationLog: [
                {
                  id: "opening",
                  text: opening.narration,
                  type: "narration" as const,
                  timestamp: new Date(),
                },
              ],
              choices: opening.choices,
              history: [
                { role: "user" as const, content: "Begin the adventure." },
                { role: "assistant" as const, content: opening.narration },
              ],
            }
          : null,
      }));
    } catch {
      // If opening generation fails, start with an empty log
    }

    router.push("/play");
  }

  async function handleStartMultiplayer() {
    if (!world) return;
    setIsStarting(true);
    narrate("Setting up your multiplayer lobby…");

    const sessionId = `session-${Date.now()}`;
    const worldDefinesClasses = Boolean(world.classes && world.classes.length > 0);
    const classData = CLASS_DESCRIPTIONS[selectedClass];
    const startingStats = { ...coreStatOverrides };
    const startingItems = worldDefinesClasses ? classData.startingItems : [];
    const parsedAge = Number.parseInt(age.trim(), 10);
    const character: CharacterData = {
      id: `char-${Date.now()}`,
      name: name.trim(),
      pronouns: pronouns.trim() || null,
      age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : null,
      shortDescription: shortDescription.trim() || null,
      class: selectedClass,
      roleTitle: (selectedWorldClass ?? customRoleTitle.trim()) || null,
      backstory: backstory.trim(),
      stats: { ...startingStats },
      ...(Object.keys(customStatOverrides).length > 0 ? { customStats: { ...customStatOverrides } } : {}),
      inventory: startingItems.map((item, i) => ({
        id: `item-${i}`,
        name: item,
        description: "",
        category: "misc" as const,
        quantity: 1,
        properties: {},
      })),
      quests: [],
    };

    const session: InMemorySession = {
      id: sessionId,
      worldId: world.id,
      characterId: character.id,
      status: "active",
      turnCount: 0,
      currentLocationId: world.locations[0]?.id ?? null,
      timeOfDay: "morning",
      weather: "clear",
      globalFlags: {},
      npcStates: {},
      memorySummary: "",
      history: [],
      narrationLog: [],
      choices: [],
      isGenerating: false,
      achievements: [],
      relationships: [],
      codex: [],
    };

    setStoreWorld(world);
    setCharacter(character);
    setSession(session);

    const guestId = (() => {
      const stored = localStorage.getItem("echoquest-guest-id");
      if (stored) return stored;
      const id = crypto.randomUUID();
      localStorage.setItem("echoquest-guest-id", id);
      return id;
    })();

    void fetch("/api/game/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, worldId: world.id, character }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { sessionId?: string } | null) => {
        if (data?.sessionId) setDbSessionId(data.sessionId);
      })
      .catch(() => undefined);

    router.push(`/campaign/${encodeURIComponent(sessionId)}/lobby`);
  }

  return (
    <div className="min-h-screen surface-gradient">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-8">
        {!world && (
          <section className="surface-gradient inner-highlight rounded-lg border border-border p-4 text-sm text-muted-foreground">
            {worldLoadError ?? "Loading world…"}
          </section>
        )}
        {worldLoadError && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => router.replace("/library")}
              className="surface-gradient inner-highlight rounded-lg border border-border px-3 py-2 text-sm motion-cta hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back to Library
            </button>
          </div>
        )}
        {world && (
          <>
        <section className="surface-gradient inner-highlight mb-6 rounded-xl border border-border/90 p-4 sm:p-5">
          <h1 className="mb-1 text-2xl font-bold" tabIndex={-1} data-focus-on-mount>
            Create Your Character
          </h1>
          <p className="text-sm text-muted-foreground">
            World: <strong>{world.name}</strong>
          </p>
        </section>

        <section className="surface-gradient inner-highlight mb-6 rounded-xl border border-border bg-background/60 p-4 shadow-sm sm:p-5">
          {/* Progress */}
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step === "name" ? 1 : step === "class" ? 2 : 3}
            aria-label="Character creation progress"
            className="flex gap-2"
          >
            {["name", "class", "backstory"].map((s, i) => (
              <div
                key={s}
                className={`progress-segment h-1.5 flex-1 rounded-full motion-step ${
                  i < (step === "name" ? 0 : step === "class" ? 1 : 2)
                    ? "bg-primary progress-segment-fill"
                    : i === (step === "name" ? 0 : step === "class" ? 1 : 2)
                    ? "bg-primary/60 motion-step-active progress-segment-fill"
                    : "bg-muted motion-step-idle progress-segment-pending"
                }`}
              />
            ))}
          </div>
        </section>

        <section className="surface-gradient inner-highlight mb-6 rounded-xl border border-border/90 bg-background/70 p-4 shadow-md sm:p-5">

        {/* Step: Name */}
        {step === "name" && (
          <section aria-labelledby="step-name-heading">
            <h2 id="step-name-heading" className="mb-4 text-lg font-semibold">
              Step 1: What is your name?
            </h2>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label htmlFor="char-name" className="mb-1 block text-sm font-medium">
                  Character Name
                </label>
                <input
                  id="char-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name…"
                  className="surface-gradient inner-highlight w-full rounded-lg border border-input px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim()}
                className="surface-active-glow w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground motion-cta hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                Continue →
              </button>
            </form>
          </section>
        )}

        {/* Step: Class */}
        {step === "class" && (
          <section aria-labelledby="step-class-heading">
            <h2 id="step-class-heading" className="mb-4 text-lg font-semibold">
              Step 2: Choose your role, {name}
            </h2>
            <div className="mb-4 space-y-3" role="radiogroup" aria-label="Character class">
              {world.classes && world.classes.length > 0
                ? world.classes.map((cls) => (
                    <button
                      key={cls.name}
                      type="button"
                      role="radio"
                      aria-checked={selectedWorldClass === cls.name}
                      onClick={() => handleWorldClassSelect(cls)}
                      aria-label={`${cls.name}: ${cls.description}`}
                      className={`surface-gradient inner-highlight flex cursor-pointer items-start gap-4 rounded-xl border p-4 motion-cta transition-colors ${
                        selectedWorldClass === cls.name
                          ? "border-primary bg-accent"
                          : "border-border bg-secondary hover:border-primary/50"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 h-4 w-4 rounded-full border ${
                          selectedWorldClass === cls.name ? "border-primary bg-primary" : "border-border bg-background"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{cls.name}</p>
                        <p className="text-sm text-muted-foreground">{cls.description}</p>
                      </div>
                    </button>
                  ))
                : (
                  <div className="surface-gradient inner-highlight rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      This world&apos;s game bible does not define fixed classes. Enter any role/title you want, or leave it blank.
                    </p>
                    <label htmlFor="custom-role" className="mt-3 mb-1 block text-sm font-medium">
                      Role / Title (optional)
                    </label>
                    <input
                      id="custom-role"
                      type="text"
                      value={customRoleTitle}
                      onChange={(e) => setCustomRoleTitle(e.target.value)}
                      placeholder="e.g. Relic Diver, Street Oracle, Court Attaché"
                      className="surface-gradient inner-highlight w-full rounded-lg border border-input px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                )}
            </div>
            <button
              onClick={handleClassSubmit}
              disabled={world.classes && world.classes.length > 0 ? !selectedWorldClass : false}
              className="surface-active-glow w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground motion-cta hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              Continue with {(selectedWorldClass ?? customRoleTitle.trim()) || "your character"} →
            </button>
          </section>
        )}

        {/* Step: Backstory */}
        {step === "backstory" && (
          <section aria-labelledby="step-backstory-heading">
            <h2 id="step-backstory-heading" className="mb-4 text-lg font-semibold">
              Step 3: Character details + backstory (optional)
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Add a quick profile so the Game Master can address your character more naturally.
            </p>
            {world.backgrounds && world.backgrounds.length > 0 && (
              <div className="surface-gradient inner-highlight mb-4 rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Available Backgrounds
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {world.backgrounds.map((bg) => (
                    <li key={bg.name}>
                      <span className="font-medium text-foreground">{bg.name}</span> — {bg.description}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Mention your background in the backstory field below.
                </p>
              </div>
            )}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="char-pronouns" className="mb-1 block text-sm font-medium">
                  Pronouns (optional)
                </label>
                <input
                  id="char-pronouns"
                  type="text"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="e.g. she/her, he/him, they/them"
                  className="surface-gradient inner-highlight w-full rounded-lg border border-input px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="char-age" className="mb-1 block text-sm font-medium">
                  Age (optional)
                </label>
                <input
                  id="char-age"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 29"
                  className="surface-gradient inner-highlight w-full rounded-lg border border-input px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="char-short-description" className="mb-1 block text-sm font-medium">
                  Appearance / Looks (optional)
                </label>
                <input
                  id="char-short-description"
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="e.g. Lean ex-scout with a scar over one eye and close-cropped silver hair"
                  className="surface-gradient inner-highlight w-full rounded-lg border border-input px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="surface-gradient inner-highlight mb-4 rounded-lg border border-border p-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Customize Stat Points
                </p>
                {corePointsBudget !== null ? (
                  <p
                    className={`text-xs font-medium ${overBudget ? "text-red-500" : "text-muted-foreground"}`}
                    aria-live="polite"
                  >
                    Points: {corePointsSpent} / {corePointsBudget}
                    {corePointsRemaining !== null && corePointsRemaining > 0 && (
                      <span className="ml-1 text-muted-foreground">({corePointsRemaining} remaining)</span>
                    )}
                  </p>
                ) : null}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Each stat is capped at {statRules.perStatMax} (min {statRules.perStatMin}).
                {corePointsBudget !== null && " Reallocate within the point pool — you can't max every stat."}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  ["Strength", "strength"],
                  ["Agility", "dexterity"],
                  ["Intellect", "intelligence"],
                  ["Charisma", "charisma"],
                ] as const).map(([label, key]) => (
                  <label key={key} className="text-xs text-muted-foreground">
                    {label}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={statRules.perStatMin}
                      max={statRules.perStatMax}
                      value={draftCoreStats[key]}
                      onChange={(e) =>
                        setDraftCoreStats((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      onBlur={(e) => {
                        const clamped = clampCoreStat(key, Number.parseInt(e.target.value, 10), coreStatOverrides[key]);
                        setCoreStatOverrides((prev) => ({ ...prev, [key]: clamped }));
                        setDraftCoreStats((prev) => ({ ...prev, [key]: String(clamped) }));
                      }}
                      className="surface-gradient inner-highlight mt-1 w-full rounded border border-input px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                ))}
              </div>

              {Object.keys(customStatOverrides).length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    World-defined Stats
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.entries(customStatOverrides).map(([label]) => (
                      <label key={label} className="text-xs text-muted-foreground">
                        {label}
                        <input
                          type="number"
                          inputMode="numeric"
                          min={statRules.perStatMin}
                          max={statRules.perStatMax}
                          value={draftCustomStats[label] ?? String(customStatOverrides[label] ?? statRules.perStatMin)}
                          onChange={(e) =>
                            setDraftCustomStats((prev) => ({ ...prev, [label]: e.target.value }))
                          }
                          onBlur={(e) => {
                            const clamped = clampCustomStat(Number.parseInt(e.target.value, 10), customStatOverrides[label] ?? statRules.perStatMin);
                            setCustomStatOverrides((prev) => ({ ...prev, [label]: clamped }));
                            setDraftCustomStats((prev) => ({ ...prev, [label]: String(clamped) }));
                          }}
                          className="surface-gradient inner-highlight mt-1 w-full rounded border border-input px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Tell the Game Master about your character&apos;s past. This shapes how NPCs and the world respond to you.
              You can skip this step if you prefer to discover your story as you play.
            </p>
            <div className="mb-4">
              <label htmlFor="backstory" className="sr-only">
                Character backstory
              </label>
              <textarea
                id="backstory"
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                rows={5}
                placeholder="e.g. A disgraced soldier seeking redemption after a failed siege…"
                className="surface-gradient inner-highlight w-full rounded-lg border border-input px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {overBudget && (
              <p
                className="mb-3 text-sm text-red-500"
                role="alert"
                aria-live="polite"
              >
                You&apos;ve spent more stat points than this world allows. Lower a stat before starting.
              </p>
            )}
            <button
              onClick={() => void handleStartMultiplayer()}
              disabled={isStarting || overBudget}
              aria-label="Create a multiplayer lobby so friends can join"
              className="surface-active-glow mb-3 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground motion-cta hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              {isStarting ? <span className="motion-loading">Setting up…</span> : "Start Multiplayer →"}
            </button>
            <div className="relative mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or play solo</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void handleStart({ skipBackstory: true })}
                disabled={isStarting || overBudget}
                aria-label="Begin adventure without writing a backstory"
                className="surface-gradient inner-highlight flex-1 rounded-lg border border-border py-3 text-sm motion-cta hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                Skip backstory & begin
              </button>
              <button
                onClick={() => void handleStart()}
                disabled={isStarting || overBudget}
                aria-label={
                  backstory.trim()
                    ? "Begin adventure with the backstory you wrote"
                    : "Begin adventure"
                }
                className="surface-active-glow flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground motion-cta hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                {isStarting ? <span className="motion-loading">Starting…</span> : "Begin Adventure →"}
              </button>
            </div>
          </section>
        )}
        </section>
        <section className="surface-gradient inner-highlight rounded-xl border border-border/80 bg-background/50 px-4 py-3 sm:px-5">
          <Link
            href="/library"
            className="inline-block text-sm text-muted-foreground motion-cta hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Back to Library
          </Link>
        </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>}>
      <CreateCharacterPage />
    </Suspense>
  );
}
