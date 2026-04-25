"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { pauseSpeech, resumeSpeech, stopSpeech } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";

export const SHORTCUT_HELP = [
  { key: "Space / P", description: "Pause or resume narration" },
  { key: "R", description: "Replay last narration" },
  { key: "[", description: "Slow down speech" },
  { key: "]", description: "Speed up speech" },
  { key: "M", description: "Toggle ambient sound" },
  { key: "H", description: "Open / close keyboard help" },
  { key: "1–9", description: "Select a numbered choice" },
  { key: "T", description: "Focus the action input" },
  { key: "V", description: "Activate voice input" },
  { key: "I", description: "Toggle inventory" },
  { key: "Q", description: "Toggle quest log" },
  { key: "L", description: "Read current location" },
  { key: "S", description: "Read character status" },
  { key: "Escape", description: "Close open panel / cancel input" },
];

interface KeyboardShortcutsProps {
  onChoiceSelect?: (index: number) => void;
  onReplayLast?: () => void;
  onToggleInventory?: () => void;
  onToggleQuestLog?: () => void;
  onFocusInput?: () => void;
  onToggleVoice?: () => void;
  onReadLocation?: () => void;
  onReadStatus?: () => void;
  isSpeaking?: boolean;
}

export function KeyboardShortcuts({
  onChoiceSelect,
  onReplayLast,
  onToggleInventory,
  onToggleQuestLog,
  onFocusInput,
  onToggleVoice,
  onReadLocation,
  onReadStatus,
  isSpeaking = false,
}: KeyboardShortcutsProps) {
  const { keyboardHelpOpen, setKeyboardHelpOpen } = useAccessibilityStore();
  const { ttsSpeed, setTTSSpeed, ambientEnabled, setAmbientEnabled } = useAudioStore();
  const [_paused, setPaused] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || tag === "select";

      // Allow Escape from inputs
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
        setKeyboardHelpOpen(false);
        return;
      }

      // Don't intercept while typing
      if (isInput) return;

      switch (e.key) {
        case " ":
        case "p":
        case "P":
          e.preventDefault();
          if (isSpeaking) {
            pauseSpeech();
            setPaused(true);
          } else {
            resumeSpeech();
            setPaused(false);
          }
          break;
        case "r":
        case "R":
          e.preventDefault();
          onReplayLast?.();
          break;
        case "[":
          e.preventDefault();
          setTTSSpeed(ttsSpeed - 0.1);
          break;
        case "]":
          e.preventDefault();
          setTTSSpeed(ttsSpeed + 0.1);
          break;
        case "m":
        case "M":
          e.preventDefault();
          setAmbientEnabled(!ambientEnabled);
          break;
        case "h":
        case "H":
          e.preventDefault();
          setKeyboardHelpOpen(!keyboardHelpOpen);
          break;
        case "t":
        case "T":
          e.preventDefault();
          onFocusInput?.();
          break;
        case "v":
        case "V":
          e.preventDefault();
          onToggleVoice?.();
          break;
        case "i":
        case "I":
          e.preventDefault();
          onToggleInventory?.();
          break;
        case "q":
          e.preventDefault();
          onToggleQuestLog?.();
          break;
        case "l":
        case "L":
          e.preventDefault();
          onReadLocation?.();
          break;
        case "s":
        case "S":
          e.preventDefault();
          onReadStatus?.();
          break;
        default:
          if (e.key >= "1" && e.key <= "9") {
            e.preventDefault();
            onChoiceSelect?.(parseInt(e.key) - 1);
          }
      }
    },
    [
      isSpeaking, ttsSpeed, ambientEnabled, keyboardHelpOpen,
      onChoiceSelect, onReplayLast, onToggleInventory, onToggleQuestLog,
      onFocusInput, onToggleVoice, onReadLocation, onReadStatus,
      setTTSSpeed, setAmbientEnabled, setKeyboardHelpOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!keyboardHelpOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold" id="help-title">
          Keyboard Shortcuts
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {SHORTCUT_HELP.map(({ key, description }) => (
            <div key={key} className="contents">
              <dt>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                  {key}
                </kbd>
              </dt>
              <dd className="text-muted-foreground">{description}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={() => setKeyboardHelpOpen(false)}
          className="mt-6 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Close (Escape)
        </button>
      </div>
    </div>
  );
}
