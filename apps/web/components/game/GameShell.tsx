"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NarrationPanel } from "./NarrationPanel";
import { ChoiceList } from "./ChoiceList";
import { ActionInput } from "./ActionInput";
import { StatusBar } from "./StatusBar";
import { AudioControls } from "@/components/audio/AudioControls";
import { AmbientPlayer } from "@/components/audio/AmbientPlayer";
import { KeyboardShortcuts } from "@/components/accessibility/KeyboardShortcuts";
import { useGameSession } from "@/hooks/useGameSession";
import { useAudioStore } from "@/store/audio-store";
import { speak, isSpeaking } from "@/lib/audio/tts-provider";
import type { PlayerAction } from "@/types/game";

export function GameShell() {
  const { session, character, world, submitAction, replayLast, speakText } =
    useGameSession();
  const { ttsSpeed, volume } = useAudioStore();
  const inputRef = useRef<HTMLElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setSpeaking(isSpeaking()), 200);
    return () => clearInterval(interval);
  }, []);

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
    const loc = world.locations.find(
      (l) => l.id === session.currentLocationId
    );
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

  return (
    <>
      <AmbientPlayer />
      <KeyboardShortcuts
        onChoiceSelect={handleChoiceSelect}
        onReplayLast={replayLast}
        onFocusInput={handleFocusInput}
        onReadLocation={handleReadLocation}
        onReadStatus={handleReadStatus}
        isSpeaking={speaking}
      />

      <main
        id="main-content"
        className="flex h-full flex-col gap-3 p-3 md:p-4"
        aria-label={`${world.name} — Active game session`}
      >
        {/* World title */}
        <h1 className="text-lg font-bold" data-focus-on-mount tabIndex={-1}>
          {world.name}
        </h1>

        {/* Status bar */}
        <StatusBar character={character} session={session} world={world} />

        {/* Audio controls */}
        <AudioControls onReplayLast={replayLast} />

        {/* Narration */}
        <NarrationPanel
          entries={session.narrationLog}
          isGenerating={session.isGenerating}
        />

        {/* Choices */}
        <ChoiceList
          choices={session.choices}
          onSelect={handleChoiceSelect}
          disabled={session.isGenerating}
        />

        {/* Action input */}
        <div ref={(el) => { inputRef.current = el; }}>
          <ActionInput
            onAction={handleAction}
            choices={session.choices}
            disabled={session.isGenerating}
          />
        </div>
      </main>
    </>
  );
}
