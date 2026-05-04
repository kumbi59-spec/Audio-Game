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
import { useGameSession } from "@/hooks/useGameSession";
import { useAudioStore } from "@/store/audio-store";
import { speak, isSpeaking } from "@/lib/audio/tts-provider";
import { AdBanner } from "@/components/ads/AdBanner";
import type { PlayerAction } from "@/types/game";

export function GameShell() {
  const { session, character, world, submitAction, replayLast, speakText } =
    useGameSession();
  const { ttsSpeed, volume, setTTSSpeed, setCurrentAmbient } = useAudioStore();
  const inputRef = useRef<HTMLElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [choicesMinimized, setChoicesMinimized] = useState(false);
  const openingSpokenRef = useRef(false);

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

  if (!session || !character || !world) {
    return (
      <div role="status" className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  const hasChoices = session.choices.length > 0;
  const degradedMessage = [...session.narrationLog]
    .reverse()
    .find((e) => e.type === "system" && /fallback|unstable|degraded/i.test(e.text))?.text;

  return (
    <>
      <AmbientPlayer
        isNarratorSpeaking={speaking}
        isNarratorLoading={session.isGenerating}
      />
      <AudioUnlocker />
      <KeyboardShortcuts
        onChoiceSelect={handleChoiceSelect}
        onReplayLast={replayLast}
        onFocusInput={handleFocusInput}
        onReadLocation={handleReadLocation}
        onReadStatus={handleReadStatus}
        onToggleCharacterSheet={() => setSheetOpen((o) => !o)}
        isSpeaking={speaking}
      />

      {sheetOpen && (
        <CharacterSheet character={character} onClose={() => setSheetOpen(false)} />
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
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <StatusBar character={character} session={session} world={world} />
              <AudioControls onReplayLast={replayLast} />
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
                className="rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <AdBanner />

        {/* Bottom toolbar */}
        <div
          role="toolbar"
          aria-label="Game controls"
          className="flex shrink-0 items-center justify-between border-t border-border bg-muted/10 px-4 py-2"
        >
          {/* Speed controls */}
          <div className="flex items-center gap-1" aria-label="Narration speed">
            <button
              onClick={() =>
                setTTSSpeed(Math.max(0.5, parseFloat((ttsSpeed - 0.1).toFixed(1))))
              }
              aria-label="Decrease narration speed"
              className="flex h-8 w-8 items-center justify-center rounded border border-border text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              −
            </button>
            <span
              aria-label={`Speed ${ttsSpeed.toFixed(1)} times`}
              className="min-w-[2.75rem] text-center text-xs tabular-nums text-muted-foreground"
            >
              {ttsSpeed.toFixed(1)}×
            </span>
            <button
              onClick={() =>
                setTTSSpeed(Math.min(2, parseFloat((ttsSpeed + 0.1).toFixed(1))))
              }
              aria-label="Increase narration speed"
              className="flex h-8 w-8 items-center justify-center rounded border border-border text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              +
            </button>
          </div>

          {/* HUD / Sheet / Recap / Exit */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSheetOpen((o) => !o)}
              aria-pressed={sheetOpen}
              aria-label={sheetOpen ? "Close character sheet" : "Open character sheet (C)"}
              className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
              className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                hudOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              HUD
            </button>
            <button
              onClick={replayLast}
              aria-label="Replay last narration (R)"
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Recap
            </button>
            <button
              onClick={shareRecap}
              aria-label="Share your session recap"
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Share Recap
            </button>
            <Link
              href="/library"
              aria-label="Exit game and return to library"
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ← Exit
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
