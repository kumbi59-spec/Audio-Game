"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NarrationPanel } from "./NarrationPanel";
import { ChoiceList } from "./ChoiceList";
import { ActionInput } from "./ActionInput";
import { StatusBar } from "./StatusBar";
import { CharacterSheet } from "./CharacterSheet";
import { AudioControls } from "@/components/audio/AudioControls";
import { AmbientPlayer } from "@/components/audio/AmbientPlayer";
import { AudioUnlocker } from "@/components/audio/AudioUnlocker";
import { inferAmbientTrack } from "@/lib/audio/ambient-inference";
import { KeyboardShortcuts } from "@/components/accessibility/KeyboardShortcuts";
import { OperationsManual } from "@/components/game/OperationsManual";
import { SceneTransitionLayer } from "@/components/game/SceneTransitionLayer";
import { useGameSession } from "@/hooks/useGameSession";
import { useAudioStore } from "@/store/audio-store";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { speak, isSpeaking } from "@/lib/audio/tts-provider";
import { AdBanner } from "@/components/ads/AdBanner";
import type { PlayerAction, SceneTransition } from "@/types/game";

export function GameShell() {
  const {
    session,
    character,
    world,
    submitAction,
    replayLast,
    speakText,
    sceneTransitionHint,
    clearSceneTransitionHint,
  } =
    useGameSession();
  const { ttsSpeed, volume, setTTSSpeed, setCurrentAmbient } = useAudioStore();
  const {
    operationsManualSeen,
    operationsManualOpen,
    openOperationsManual,
    closeOperationsManual,
    markOperationsManualSeen,
    reducedMotion,
    audioOnlyMode,
  } = useAccessibilityStore();
  const inputRef = useRef<HTMLElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"stats" | "inventory" | "quests" | "bio">("stats");
  const [choicesMinimized, setChoicesMinimized] = useState(false);
  const panelHeadingRef = useRef<HTMLSpanElement>(null);
  const openingSpokenRef = useRef(false);
  const previousLocationIdRef = useRef<string | null>(null);
  const [sceneTransition, setSceneTransition] = useState<SceneTransition | null>(null);

  const shareRecap = useCallback(async () => {
    if (!session || !world) return;
    const recap = session.narrationLog
      .filter((entry) => entry.type === "narration")
      .slice(-3)
      .map((entry) => entry.text)
      .join(" ")
      .slice(0, 220);
    const playUrl = `${window.location.origin}/create?worldId=${world.id}`;
    const text = `I just played ${world.name} on EchoQuest. ${recap || "Come explore this world with me."}`;

    if (navigator.share) {
      await navigator.share({ title: `${world.name} recap`, text, url: playUrl });
      return;
    }

    const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(playUrl)}`;
    window.open(twitterIntent, "_blank", "noopener,noreferrer");
  }, [session, world]);

  useEffect(() => {
    const interval = setInterval(() => setSpeaking(isSpeaking()), 200);
    return () => clearInterval(interval);
  }, []);

  // Auto-trigger ambient sound when the player moves to a new location.
  useEffect(() => {
    if (!session?.currentLocationId || !world) return;
    const loc = world.locations.find((l) => l.id === session.currentLocationId);
    const track = loc?.ambientSound
      ?? (loc ? inferAmbientTrack(loc.name, loc.description) : null)
      ?? "none";
    setCurrentAmbient(track as import("@/types/audio").AmbientTrack);
  }, [session?.currentLocationId, world, setCurrentAmbient]);

  // Speak the most recent narration that was pre-loaded before navigation.
  // This ensures resumed sessions continue from the latest narrated section.
  useEffect(() => {
    if (openingSpokenRef.current) return;
    const latestNarration = [...(session?.narrationLog ?? [])]
      .reverse()
      .find((entry) => entry.type === "narration");
    if (latestNarration) {
      openingSpokenRef.current = true;
      speakText(latestNarration.text);
    }
  }, [session, speakText]);

  useEffect(() => {
    if (!session || operationsManualSeen) return;
    openOperationsManual();
  }, [session, operationsManualSeen, openOperationsManual]);

  const currentLocationId = session?.currentLocationId ?? null;

  useEffect(() => {
    if (!currentLocationId || !world) return;
    const prevLocationId = previousLocationIdRef.current;
    const nextLocationId = currentLocationId;
    previousLocationIdRef.current = nextLocationId;
    if (!prevLocationId || !nextLocationId || prevLocationId === nextLocationId) return;
    const from = world.locations.find((l) => l.id === prevLocationId);
    const to = world.locations.find((l) => l.id === nextLocationId);
    setSceneTransition({
      type: "location",
      title: to?.name ?? "Unknown Location",
      subtitle: from ? `${from.name} → ${to?.name ?? "Unknown Location"}` : to?.shortDesc,
    });
  }, [currentLocationId, world]);

  useEffect(() => {
    if (!sceneTransitionHint) return;
    setSceneTransition(sceneTransitionHint);
    clearSceneTransitionHint();
  }, [sceneTransitionHint, clearSceneTransitionHint]);

  const handleCloseOperationsManual = useCallback(() => {
    closeOperationsManual();
    if (!operationsManualSeen) {
      markOperationsManualSeen();
    }
  }, [closeOperationsManual, operationsManualSeen, markOperationsManualSeen]);

  const handleToggleOperationsManual = useCallback(() => {
    if (operationsManualOpen) {
      handleCloseOperationsManual();
      return;
    }
    openOperationsManual();
  }, [operationsManualOpen, handleCloseOperationsManual, openOperationsManual]);

  const handleAction = useCallback(
    (action: PlayerAction) => {
      if (session?.isGenerating) return;
      submitAction(action);
    },
    [session, submitAction]
  );

  const handleChoiceSelect = useCallback(
    (index: number) => {
      if (!session?.choices[index]) return;
      const choice = session.choices[index];
      handleAction({ type: "choice", content: choice, choiceIndex: index });
    },
    [session, handleAction]
  );

  const handleFocusInput = useCallback(() => {
    document.getElementById("action-text-input")?.focus();
  }, []);

  const handleReadLocation = useCallback(() => {
    if (!session || !world) return;
    const loc = world.locations.find((l) => l.id === session.currentLocationId);
    const text = loc
      ? `You are at ${loc.name}. ${loc.description}`
      : "Your current location is unknown.";
    speak(text, { rate: ttsSpeed, volume });
  }, [session, world, ttsSpeed, volume]);

  const handleReadStatus = useCallback(() => {
    if (!character || !session || !world) return;
    const loc = world.locations.find((l) => l.id === session.currentLocationId);
    const text = `${character.name}, ${character.class}. Health: ${character.stats.hp} of ${character.stats.maxHp}. At ${loc?.name ?? "unknown location"}. Turn ${session.turnCount}.`;
    speak(text, { rate: ttsSpeed, volume });
  }, [character, session, world, ttsSpeed, volume]);

  const focusPanelHeading = useCallback(() => {
    requestAnimationFrame(() => panelHeadingRef.current?.focus());
  }, []);

  const handleOpenSheetTab = useCallback((tab: "inventory" | "quests") => {
    setSheetTab(tab);
    setSheetOpen(true);
    focusPanelHeading();
  }, [focusPanelHeading]);

  const activeQuestCount = character?.quests.filter((q) => q.status === "active").length ?? 0;

  if (!session || !character || !world) {
    return (
      <div role="status" className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  const hasChoices = session.choices.length > 0;
  const shouldShowAdBanner = session.turnCount > 0 && session.turnCount % 11 === 0;
  const degradedMessage = [...session.narrationLog]
    .reverse()
    .find((e) => e.type === "system" && /fallback|unstable|degraded/i.test(e.text))?.text;

  return (
    <>
      <AmbientPlayer
        isNarratorSpeaking={speaking}
        isNarratorLoading={session.isGenerating}
      />
      <SceneTransitionLayer
        transition={sceneTransition}
        reducedMotion={reducedMotion}
        instantMode={audioOnlyMode}
        onComplete={() => setSceneTransition(null)}
      />
      <AudioUnlocker />
      <KeyboardShortcuts
        onChoiceSelect={handleChoiceSelect}
        onReplayLast={replayLast}
        onFocusInput={handleFocusInput}
        onReadLocation={handleReadLocation}
        onReadStatus={handleReadStatus}
        onToggleCharacterSheet={() => setSheetOpen((o) => !o)}
        onToggleInventory={() => handleOpenSheetTab("inventory")}
        onToggleQuestLog={() => handleOpenSheetTab("quests")}
        onToggleHelpManual={handleToggleOperationsManual}
        isSpeaking={speaking}
      />
      <OperationsManual
        open={operationsManualOpen}
        onClose={handleCloseOperationsManual}
      />

      {sheetOpen && (
        <CharacterSheet
          character={character}
          achievements={session?.achievements ?? []}
          onClose={() => setSheetOpen(false)}
          initialTab={sheetTab}
          headingId="character-sheet-heading"
          headingRef={panelHeadingRef}
        />
      )}

      <div
        className="flex h-full flex-col"
        id="main-content"
        aria-label={`${world.name} — Active game session`}
      >
        {/* World name */}
        <h1
          className="shrink-0 px-4 pt-3 pb-1 text-sm font-semibold text-muted-foreground"
          tabIndex={-1}
          data-focus-on-mount
        >
          {world.name}
        </h1>

        {/* Narration — fills available space */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {degradedMessage && (
            <div className="mb-2 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {degradedMessage}
            </div>
          )}
          <NarrationPanel
            entries={session.narrationLog}
            isGenerating={session.isGenerating}
          />
        </div>

        {/* HUD panel — status + audio settings */}
        {hudOpen && (
          <div className="shrink-0 max-h-60 overflow-y-auto border-t border-border bg-muted/20 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Status &amp; Audio
              </span>
              <button
                type="button"
                onClick={() => setHudOpen(false)}
                aria-label="Close HUD"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus-ring"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <StatusBar character={character} session={session} world={world} />
              <AudioControls onReplayLast={replayLast} disableReplay={session.isGenerating || speaking} />
            </div>
          </div>
        )}

        {/* Choices */}
        {hasChoices && (
          <div className="shrink-0 border-t border-border">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Choose Your Action
              </span>
              <button
                onClick={() => setChoicesMinimized((m) => !m)}
                aria-expanded={!choicesMinimized}
                aria-controls="choices-panel"
                className="rounded text-xs text-muted-foreground hover:text-foreground focus-ring"
              >
                {choicesMinimized ? "Expand ▼" : "Minimize ▲"}
              </button>
            </div>
            {!choicesMinimized && (
              <div id="choices-panel" className="px-4 pb-3">
                <ChoiceList
                  choices={session.choices}
                  onSelect={handleChoiceSelect}
                  disabled={session.isGenerating}
                />
              </div>
            )}
          </div>
        )}

        {/* Action input */}
        <div
          className="shrink-0 border-t border-border px-4 py-3"
          ref={(el) => {
            inputRef.current = el;
          }}
        >
          <ActionInput
            onAction={handleAction}
            choices={session.choices}
            disabled={session.isGenerating}
          />
        </div>

        {/* Ad banner — free tier only */}
        <AdBanner visible={shouldShowAdBanner} />

        {/* Bottom toolbar */}
        <div
          role="toolbar"
          aria-label="Game controls"
          className="flex shrink-0 items-center justify-between border-t border-border bg-muted/10 px-4 py-2"
        >
          {/* A11y motion checklist: labels/icons communicate state without animation; all controls are keyboard/focus operable; reduced-motion uses static visuals. */}
          {/* Speed control — compact slider replaces ± buttons */}
          <div className="flex min-w-[110px] items-center gap-2" aria-label="Narration speed">
            <label htmlFor="speed-slider" className="sr-only">Narration speed</label>
            <input
              id="speed-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={ttsSpeed}
              onChange={(e) => setTTSSpeed(parseFloat(e.target.value))}
              aria-valuetext={`${ttsSpeed.toFixed(1)} times`}
              className="w-full cursor-pointer accent-[var(--accent)]"
            />
            <span aria-hidden="true" className="min-w-[2.5rem] text-right text-xs tabular-nums text-muted-foreground">
              {ttsSpeed.toFixed(1)}×
            </span>
          </div>

          {/* Primary toolbar buttons — always visible */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleOperationsManual}
              aria-pressed={operationsManualOpen}
              aria-label={operationsManualOpen ? "Close Help / Operations Manual" : "Open Help / Operations Manual (H)"}
              className={`toolbar-btn rounded border px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                operationsManualOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Help
            </button>
            <button
              onClick={() => setSheetOpen((o) => !o)}
              aria-pressed={sheetOpen}
              aria-label={sheetOpen ? "Close character sheet" : "Open character sheet (C)"}
              className={`toolbar-btn rounded border px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                sheetOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Sheet
            </button>
            <button
              onClick={() => setHudOpen((h) => !h)}
              aria-pressed={hudOpen}
              aria-label={hudOpen ? "Close HUD" : "Open HUD — status and audio settings"}
              className={`toolbar-btn rounded border px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                hudOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              HUD
            </button>
            {/* Secondary buttons — visible on md+ screens */}
            <button
              onClick={() => handleOpenSheetTab("inventory")}
              aria-label={`Open inventory (I). ${character.inventory.length} items.`}
              className="toolbar-btn relative hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-ring md:inline-flex"
            >
              Briefcase
              {character.inventory.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary" aria-hidden="true">
                  {character.inventory.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleOpenSheetTab("quests")}
              aria-label={`Open quest log (Q). ${activeQuestCount} active quests.`}
              className="toolbar-btn relative hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-ring md:inline-flex"
            >
              Quest Book
              {activeQuestCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary" aria-hidden="true">
                  {activeQuestCount}
                </span>
              )}
            </button>
            <button
              onClick={replayLast}
              aria-label="Replay last narration (R)"
              className="toolbar-btn hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-ring md:inline-flex"
            >
              Recap
            </button>
            <button
              onClick={shareRecap}
              aria-label="Share your session recap"
              className="toolbar-btn hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-ring md:inline-flex"
            >
              Share Recap
            </button>
            {/* Mobile overflow menu — hidden on md+ */}
            <details className="relative md:hidden">
              <summary className="toolbar-btn list-none cursor-pointer rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-ring">
                ⋯ More
              </summary>
              <div className="absolute bottom-full right-0 z-50 mb-1 flex flex-col gap-1 rounded-lg border border-border bg-background p-2 shadow-lg">
                <button onClick={() => handleOpenSheetTab("inventory")} aria-label={`Open inventory. ${character.inventory.length} items.`} className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                  Briefcase {character.inventory.length > 0 && `(${character.inventory.length})`}
                </button>
                <button onClick={() => handleOpenSheetTab("quests")} aria-label={`Open quest log. ${activeQuestCount} active quests.`} className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                  Quest Book {activeQuestCount > 0 && `(${activeQuestCount})`}
                </button>
                <button onClick={replayLast} aria-label="Replay last narration" className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                  Recap
                </button>
                <button onClick={shareRecap} aria-label="Share session recap" className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                  Share Recap
                </button>
              </div>
            </details>
            <Link
              href="/library"
              aria-label="Exit game and return to library"
              className="toolbar-btn rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-ring"
            >
              ← Exit
            </Link>
          </div>
        </div>
        <style jsx>{`
          @media (prefers-reduced-motion: no-preference) {
            .toolbar-btn {
              transition:
                transform var(--motion-fast) var(--ease-decelerate),
                opacity var(--motion-fast) var(--ease-standard),
                background-color var(--motion-medium) var(--ease-standard);
            }
            .toolbar-btn:hover {
              transform: translateY(-1px);
            }
            .toolbar-btn:active {
              transform: scale(0.98);
              opacity: 0.95;
            }
            .toolbar-btn:focus-visible {
              animation: focusPulse var(--motion-medium) var(--ease-standard) 1;
            }
          }
        `}</style>
      </div>
    </>
  );
}
