"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { NarrationPanel } from "./NarrationPanel";
import { ChoiceList } from "./ChoiceList";
import { ActionInput, type VoiceMetaCommand } from "./ActionInput";
import { StatusBar } from "./StatusBar";
import dynamic from "next/dynamic";

// The sheet is big and only shown on demand, so it loads when first opened.
const CharacterSheet = dynamic(() => import("./CharacterSheet").then((m) => m.CharacterSheet), { ssr: false });
import { AudioControls } from "@/components/audio/AudioControls";
import { AmbientPlayer } from "@/components/audio/AmbientPlayer";
import { AudioUnlocker } from "@/components/audio/AudioUnlocker";
import { inferAmbientTrack, inferAmbientTrackSticky } from "@/lib/audio/ambient-inference";
import { queueUpgradeNudge } from "@/components/entitlements/UpgradeNudge";
import { KeyboardShortcuts } from "@/components/accessibility/KeyboardShortcuts";
import { OperationsManual } from "@/components/game/OperationsManual";
import { SceneTransitionLayer } from "@/components/game/SceneTransitionLayer";
import { useGameSession } from "@/hooks/useGameSession";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useGameStore } from "@/store/game-store";
import { useAudioStore } from "@/store/audio-store";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { useReducedMotion } from "@/lib/a11y/use-reduced-motion";
import { speak, isSpeaking, onTtsNotice, pauseSpeech, resumeSpeech, stopSpeech } from "@/lib/audio/tts-provider";
import { canPlayAudioNow, whenAudioUnlocked } from "@/lib/audio/unlock";
import type { PlayerAction, SceneTransition } from "@/types/game";

/**
 * Speaks a short readout (location, status) once the narrator is quiet, so it
 * doesn't cut a sentence off or get cut off by the next one.
 */
function speakWhenQuiet(text: string): void {
  if (!isSpeaking()) {
    void speak(text);
    return;
  }
  const timer = setInterval(() => {
    if (isSpeaking()) return;
    clearInterval(timer);
    void speak(text);
  }, 250);
}

export function GameShell() {
  const {
    session,
    character,
    world,
    submitAction,
    replayLast,
    recapRecentTurns,
    speakNarration,
    sceneTransitionHint,
    clearSceneTransitionHint,
    canUndo,
    undoLastTurn,
  } =
    useGameSession();
  const { ttsSpeed, setTTSSpeed, setCurrentAmbient } = useAudioStore();
  const {
    operationsManualSeen,
    operationsManualOpen,
    openOperationsManual,
    closeOperationsManual,
    markOperationsManualSeen,
    audioOnlyMode,
  } = useAccessibilityStore();
  const reducedMotion = useReducedMotion();
  const { announce } = useAnnouncer();
  const saveCurrentCampaign = useGameStore((s) => s.saveCurrentCampaign);
  const addNarrationEntry = useGameStore((s) => s.addNarrationEntry);
  const [helpHintVisible, setHelpHintVisible] = useState(false);
  const lastAutoSaveTurnRef = useRef<number>(-1);
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

  // Tell the player when narration falls back to the browser voice.
  useEffect(
    () =>
      onTtsNotice((message) => {
        announce(message, "polite");
        addNarrationEntry({ id: `tts-notice-${Date.now()}`, text: message, type: "system", timestamp: new Date() });
      }),
    [announce, addNarrationEntry],
  );

  // Pick the most recent NARRATION entry to feed into ambient inference. We
  // narrow what the next effect depends on so it only re-runs when the
  // narration text actually changes — not on every state ping from the GM.
  const latestNarrationText = useMemo(() => {
    if (!session) return "";
    for (let i = session.narrationLog.length - 1; i >= 0; i -= 1) {
      const e = session.narrationLog[i];
      if (e?.type === "narration") return e.text;
    }
    return "";
  }, [session]);

  // Auto-trigger ambient sound based on the current scene. We try, in order:
  //   1. An explicit ambientSound on the current world location.
  //   2. Keyword inference from the location's name + description.
  //   3. Keyword inference from the most recent GM narration text.
  // Step 3 is what saves us when the GM never emits a locationId update or
  // when the location's stored description is too sparse to classify — the
  // previous version fell through to "none" in those cases and the bed
  // stayed silent for the entire session, which is the "ambient never plays"
  // report from the user.
  const { currentAmbient: currentAmbientTrack } = useAudioStore();
  useEffect(() => {
    if (!world) return;
    const loc = session?.currentLocationId
      ? world.locations.find((l) => l.id === session.currentLocationId)
      : null;
    const explicit = loc?.ambientSound as import("@/types/audio").AmbientTrack | undefined;
    const fromLocation = loc ? inferAmbientTrack(loc.name, loc.description) : null;
    // Sticky-infer from narration so a single off-topic mention doesn't flip
    // the bed mid-scene. Passes the current track as the "stay unless beaten
    // by ≥2 points" anchor.
    const fromNarration = latestNarrationText
      ? inferAmbientTrackSticky("", latestNarrationText, currentAmbientTrack)
      : null;
    const track = explicit ?? fromLocation ?? fromNarration ?? "none";
    setCurrentAmbient(track as import("@/types/audio").AmbientTrack);
  // currentAmbientTrack intentionally omitted from deps: it's only read as
  // the sticky anchor for inference. Including it would re-run this effect
  // every time the bed track changes, racing with the change we just made.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.currentLocationId, world, latestNarrationText, setCurrentAmbient]);

  // Speak the most recent narration that was pre-loaded before navigation.
  // This ensures resumed sessions continue from the latest narrated section.
  useEffect(() => {
    if (openingSpokenRef.current) return;
    const latestNarration = [...(session?.narrationLog ?? [])]
      .reverse()
      .find((entry) => entry.type === "narration");
    if (latestNarration) {
      openingSpokenRef.current = true;
      // After a reload the browser won't play sound until the player
      // interacts with the page, so the scene waits for that first tap.
      if (!canPlayAudioNow()) announce("Press any key or tap anywhere to hear the story.", "polite");
      void whenAudioUnlocked().then(() => speakNarration(latestNarration.text));
    }
  }, [session, speakNarration, announce]);

  // First-time players: a non-blocking hint announces help availability and
  // shows a dismissable toast. Previously this auto-opened the modal, which
  // forced every new user to dismiss a dialog before they could start playing.
  useEffect(() => {
    if (!session || operationsManualSeen) return;
    setHelpHintVisible(true);
    announce("Press H or use the Help button at any time to open the Operations Manual.", "polite");
  }, [session, operationsManualSeen, announce]);

  // Auto-save every AUTO_SAVE_INTERVAL turns. Tracks last-saved turn in a
  // ref so a turn count change in either direction (undo can decrease it
  // back to a multiple) doesn't double-save.
  const AUTO_SAVE_INTERVAL = 5;
  useEffect(() => {
    if (!session) return;
    const turn = session.turnCount;
    if (turn === 0) return;
    if (turn === lastAutoSaveTurnRef.current) return;
    if (turn % AUTO_SAVE_INTERVAL !== 0) return;
    lastAutoSaveTurnRef.current = turn;
    saveCurrentCampaign();
    announce(`Auto-saved at turn ${turn}.`, "polite");
  }, [session, saveCurrentCampaign, announce]);

  const handleManualSave = useCallback(() => {
    if (!session) return;
    saveCurrentCampaign();
    lastAutoSaveTurnRef.current = session.turnCount;
    announce(`Saved at turn ${session.turnCount}.`, "polite");
  }, [session, saveCurrentCampaign, announce]);

  const dismissHelpHint = useCallback(() => {
    setHelpHintVisible(false);
    if (!operationsManualSeen) markOperationsManualSeen();
  }, [operationsManualSeen, markOperationsManualSeen]);

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
    // Opening the manual implicitly dismisses the help toast — the user has
    // discovered the feature one way or another.
    setHelpHintVisible(false);
    if (operationsManualOpen) {
      handleCloseOperationsManual();
      return;
    }
    openOperationsManual();
  }, [operationsManualOpen, handleCloseOperationsManual, openOperationsManual]);

  const handleAction = useCallback(
    (action: PlayerAction): Promise<boolean> => {
      if (session?.isGenerating) return Promise.resolve(false);
      return submitAction(action);
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
    speakWhenQuiet(text);
  }, [session, world]);

  const handleReadStatus = useCallback(() => {
    if (!character || !session || !world) return;
    const loc = world.locations.find((l) => l.id === session.currentLocationId);
    const text = `${character.name}, ${character.roleTitle ?? character.class}. Health: ${character.stats.hp} of ${character.stats.maxHp}. At ${loc?.name ?? "unknown location"}. Turn ${session.turnCount}.`;
    speakWhenQuiet(text);
  }, [character, session, world]);

  // Voice commands that aren't actions ("pause", "where am I", "save game").
  const handleVoiceMeta = useCallback((command: VoiceMetaCommand) => {
    switch (command) {
      case "pause": pauseSpeech(); break;
      case "resume": resumeSpeech(); break;
      case "replay": if (!session?.isGenerating) replayLast(); break;
      case "location": handleReadLocation(); break;
      case "status": handleReadStatus(); break;
      case "inventory": handleOpenSheetTab("inventory"); break;
      case "quests": handleOpenSheetTab("quests"); break;
      case "save": handleManualSave(); break;
    }
  // handleOpenSheetTab is declared below and stable (useCallback).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.isGenerating, replayLast, handleReadLocation, handleReadStatus, handleManualSave]);

  // Headset and lock-screen buttons: play/pause the narrator, "previous"
  // replays the last scene, "next" skips the rest of it.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => resumeSpeech()],
      ["pause", () => pauseSpeech()],
      ["previoustrack", () => replayLast()],
      ["nexttrack", () => stopSpeech()],
    ];
    for (const [action, handler] of handlers) {
      try { ms.setActionHandler(action, handler); } catch { /* unsupported action */ }
    }
    if (world && typeof MediaMetadata !== "undefined") {
      ms.metadata = new MediaMetadata({ title: world.name, artist: "EchoQuest" });
    }
    return () => {
      for (const [action] of handlers) {
        try { ms.setActionHandler(action, null); } catch { /* unsupported action */ }
      }
    };
  }, [replayLast, world]);

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
  // Show the degraded banner only when the most recent degraded-mode system
  // entry is more recent than the most recent successful narration. Without
  // this guard the banner stuck around forever — the matched system message
  // lives in narrationLog permanently, so the previous "find latest match"
  // approach always returned a hit even after the next turn succeeded.
  const degradedRegex = /fallback|unstable|degraded/i;
  const lastDegradedIdx = (() => {
    for (let i = session.narrationLog.length - 1; i >= 0; i -= 1) {
      const e = session.narrationLog[i];
      if (e?.type === "system" && (e.degraded || degradedRegex.test(e.text))) return i;
    }
    return -1;
  })();
  const lastNarrationIdx = (() => {
    for (let i = session.narrationLog.length - 1; i >= 0; i -= 1) {
      if (session.narrationLog[i]?.type === "narration") return i;
    }
    return -1;
  })();
  const degradedMessage =
    lastDegradedIdx >= 0 && lastDegradedIdx > lastNarrationIdx
      ? session.narrationLog[lastDegradedIdx]?.text
      : undefined;

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
        onReplayLast={session.isGenerating ? undefined : replayLast}
        onFocusInput={handleFocusInput}
        onReadLocation={handleReadLocation}
        onReadStatus={handleReadStatus}
        onToggleCharacterSheet={() => setSheetOpen((o) => !o)}
        onToggleInventory={() => handleOpenSheetTab("inventory")}
        onToggleQuestLog={() => handleOpenSheetTab("quests")}
        onToggleHelpManual={handleToggleOperationsManual}
        onUndo={canUndo ? undoLastTurn : undefined}
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
          relationships={session?.relationships ?? []}
          codex={session?.codex ?? []}
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
            <div className="mb-2 rounded border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
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
                className="flex h-11 w-11 items-center justify-center rounded text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring"
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
            onMeta={handleVoiceMeta}
            choices={session.choices}
            disabled={session.isGenerating}
          />
        </div>

        {helpHintVisible && (
          <div
            role="status"
            aria-live="polite"
            className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            <span>
              Tip: press <kbd className="rounded bg-background/50 px-1.5 py-0.5 font-mono">H</kbd>
              {" "}or the Help button for keyboard shortcuts and gameplay tips.
            </span>
            <button
              type="button"
              onClick={dismissHelpHint}
              aria-label="Dismiss help tip"
              className="rounded text-muted-foreground hover:text-foreground focus-ring"
            >
              ✕
            </button>
          </div>
        )}

        {/* No ads on the play screen: nothing competes with the narration. */}

        {/* Bottom toolbar */}
        <div
          id="game-toolbar"
          tabIndex={-1}
          role="toolbar"
          aria-label="Game controls"
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/10 px-4 py-2"
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
                  : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground"
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
                  : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground"
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
                  : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              HUD
            </button>
            {/* Secondary buttons — visible on md+ screens */}
            <button
              onClick={() => handleOpenSheetTab("inventory")}
              aria-label={`Open inventory (I). ${character.inventory.length} items.`}
              className="toolbar-btn relative hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring md:inline-flex"
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
              className="toolbar-btn relative hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring md:inline-flex"
            >
              Quest Book
              {activeQuestCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary" aria-hidden="true">
                  {activeQuestCount}
                </span>
              )}
            </button>
            <button
              onClick={() => recapRecentTurns(3)}
              aria-label="Catch up — recap the last 3 scenes"
              className="toolbar-btn hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring md:inline-flex"
            >
              Recap
            </button>
            <button
              onClick={undoLastTurn}
              disabled={!canUndo}
              aria-label="Undo last turn (U)"
              className="toolbar-btn hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring disabled:opacity-40 md:inline-flex"
            >
              Undo
            </button>
            <button
              onClick={handleManualSave}
              aria-label="Save current campaign"
              className="toolbar-btn hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring md:inline-flex"
            >
              Save
            </button>
            <button
              onClick={shareRecap}
              aria-label="Share your session recap"
              className="toolbar-btn hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring md:inline-flex"
            >
              Share Recap
            </button>
            {/* Mobile overflow menu — hidden on md+ */}
            <details className="relative md:hidden">
              <summary className="toolbar-btn inline-flex min-h-[44px] list-none cursor-pointer items-center rounded border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring">
                ⋯ More
              </summary>
              <div className="absolute bottom-full right-0 z-50 mb-1 flex flex-col gap-1 rounded-lg border border-border bg-background p-2 shadow-lg">
                <button onClick={() => handleOpenSheetTab("inventory")} aria-label={`Open inventory. ${character.inventory.length} items.`} className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                  Briefcase {character.inventory.length > 0 && `(${character.inventory.length})`}
                </button>
                <button onClick={() => handleOpenSheetTab("quests")} aria-label={`Open quest log. ${activeQuestCount} active quests.`} className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                  Quest Book {activeQuestCount > 0 && `(${activeQuestCount})`}
                </button>
                <button onClick={() => recapRecentTurns(3)} aria-label="Catch up — recap the last 3 scenes" className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                  Recap
                </button>
                <button onClick={undoLastTurn} disabled={!canUndo} aria-label="Undo last turn" className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-40">
                  Undo
                </button>
                <button onClick={handleManualSave} aria-label="Save current campaign" className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                  Save
                </button>
                <button onClick={shareRecap} aria-label="Share session recap" className="toolbar-btn rounded border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                  Share Recap
                </button>
              </div>
            </details>
            <Link
              href="/library"
              onClick={queueUpgradeNudge}
              aria-label="Exit game and return to library"
              className="inline-flex items-center justify-center toolbar-btn rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-ring"
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
