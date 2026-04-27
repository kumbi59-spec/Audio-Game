"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { useGameStore } from "@/store/game-store";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";
import { CLASS_DESCRIPTIONS } from "@/types/character";
import type { CharacterClass, CharacterData } from "@/types/character";
import type { InMemorySession } from "@/types/game";
import Link from "next/link";

type Step = "name" | "class" | "backstory" | "starting";

const CLASSES = Object.entries(CLASS_DESCRIPTIONS) as [CharacterClass, typeof CLASS_DESCRIPTIONS[CharacterClass]][];

function CreateCharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const worldId = searchParams.get("worldId") ?? PREBUILT_WORLDS[0].id;
  const world = PREBUILT_WORLDS.find((w) => w.id === worldId) ?? PREBUILT_WORLDS[0];

  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const { setSession, setCharacter, setWorld, setDbSessionId } = useGameStore();

  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("warrior");
  const [pronouns, setPronouns] = useState("");
  const [age, setAge] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [backstory, setBackstory] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const msg = `Character creation for ${world.name}. Step 1: Enter your character's name.`;
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const msg = `Name set to ${name}. Step 2: Choose your class.`;
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
    setStep("class");
  }

  function handleClassSelect(cls: CharacterClass) {
    setSelectedClass(cls);
    const info = CLASS_DESCRIPTIONS[cls];
    const msg = `${info.name} selected. ${info.description}. Press Continue to proceed or choose a different class.`;
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
  }

  function handleClassSubmit() {
    const msg = `Class confirmed as ${CLASS_DESCRIPTIONS[selectedClass].name}. Step 3: Optional backstory. Describe your character's history, or skip this step.`;
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
    setStep("backstory");
  }

  async function handleStart() {
    setIsStarting(true);
    const msg = "Starting your adventure. The Game Master is preparing your world…";
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });

    const classData = CLASS_DESCRIPTIONS[selectedClass];
    const parsedAge = Number.parseInt(age.trim(), 10);
    const character: CharacterData = {
      id: `char-${Date.now()}`,
      name: name.trim(),
      pronouns: pronouns.trim() || null,
      age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : null,
      shortDescription: shortDescription.trim() || null,
      class: selectedClass,
      backstory: backstory.trim(),
      stats: { ...classData.startingStats },
      inventory: classData.startingItems.map((item, i) => ({
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
    };

    setWorld(world);
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

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Link
          href="/library"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Back to Library
        </Link>

        <h1 className="mb-1 text-2xl font-bold" tabIndex={-1} data-focus-on-mount>
          Create Your Character
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          World: <strong>{world.name}</strong>
        </p>

        {/* Progress */}
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step === "name" ? 1 : step === "class" ? 2 : 3}
          aria-label="Character creation progress"
          className="mb-8 flex gap-2"
        >
          {["name", "class", "backstory"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                i < (step === "name" ? 0 : step === "class" ? 1 : 2)
                  ? "bg-primary"
                  : i === (step === "name" ? 0 : step === "class" ? 1 : 2)
                  ? "bg-primary/60"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

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
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
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
              Step 2: Choose your class, {name}
            </h2>
            <div className="mb-4 space-y-3" role="radiogroup" aria-label="Character class">
              {CLASSES.map(([cls, info]) => (
                <label
                  key={cls}
                  htmlFor={`class-${cls}`}
                  aria-label={`${info.name}: ${info.description}`}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                    selectedClass === cls
                      ? "border-primary bg-accent"
                      : "border-border bg-secondary hover:border-primary/50"
                  }`}
                >
                  <input
                    id={`class-${cls}`}
                    type="radio"
                    name="class"
                    value={cls}
                    checked={selectedClass === cls}
                    onChange={() => handleClassSelect(cls)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <div>
                    <p className="font-medium">{info.name}</p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      HP: {info.startingStats.hp} · STR: {info.startingStats.strength} · DEX:{" "}
                      {info.startingStats.dexterity} · INT: {info.startingStats.intelligence} · CHA:{" "}
                      {info.startingStats.charisma}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleClassSubmit}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Continue with {CLASS_DESCRIPTIONS[selectedClass].name} →
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
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="char-short-description" className="mb-1 block text-sm font-medium">
                  Short description (optional)
                </label>
                <input
                  id="char-short-description"
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="e.g. Lean ex-scout with a scar over one eye"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
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
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleStart()}
                disabled={isStarting}
                className="flex-1 rounded-lg border border-border py-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                Skip backstory
              </button>
              <button
                onClick={() => handleStart()}
                disabled={isStarting}
                className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                {isStarting ? "Starting…" : "Begin Adventure →"}
              </button>
            </div>
          </section>
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
