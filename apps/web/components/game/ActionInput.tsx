"use client";

import { useRef, useState } from "react";
import { VoiceCommandListener } from "@/components/accessibility/VoiceCommandListener";
import type { PlayerAction } from "@/types/game";

/** Longest action the server accepts (app/api/game/action ActionSchema). */
export const MAX_ACTION_LENGTH = 2000;

/** Voice meta commands ("pause", "where am I", "save game"); see VoiceCommandListener. */
export type VoiceMetaCommand = "inventory" | "quests" | "status" | "location" | "replay" | "pause" | "resume" | "save";

interface ActionInputProps {
  /** Resolves false when the turn didn't go through, so the text can be restored. */
  onAction: (action: PlayerAction) => void | Promise<boolean | void>;
  choices?: string[];
  onMeta?: (command: VoiceMetaCommand) => void;
  disabled?: boolean;
  id?: string;
}

export function ActionInput({ onAction, choices = [], onMeta, disabled = false, id = "action-input" }: ActionInputProps) {
  const [text, setText] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText("");
    const landed = await onAction({ type: "free_text", content: trimmed });
    // The turn failed: put the player's words back unless they've already
    // started typing something new.
    if (landed === false) setText((current) => current || trimmed);
  }

  function handleVoiceAction(transcript: string) {
    onAction({ type: "voice_command", content: transcript });
  }

  return (
    <div id={id} className="space-y-3">
      <form
        onSubmit={handleSubmit}
        className="flex gap-2"
        aria-label="Type your action"
      >
        <label htmlFor="action-text-input" className="sr-only">
          Type your action or speak
        </label>
        <input
          id="action-text-input"
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder="Type or speak your action…"
          autoComplete="off"
          maxLength={MAX_ACTION_LENGTH}
          className="min-h-[44px] flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="Submit action"
          className="min-h-[44px] min-w-[44px] rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          Go
        </button>
      </form>
      <div className="mt-2 flex justify-center">
        <VoiceCommandListener
          onAction={handleVoiceAction}
          onChoiceSelect={(i) => {
            const label = choices[i];
            if (label) onAction({ type: "choice", content: label, choiceIndex: i });
          }}
          onMeta={onMeta ? (command) => onMeta(command as VoiceMetaCommand) : undefined}
          choiceCount={choices.length}
          isActive={!disabled}
        />
      </div>
    </div>
  );
}
