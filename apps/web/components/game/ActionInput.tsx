"use client";

import { useRef, useState } from "react";
import { VoiceCommandListener } from "@/components/accessibility/VoiceCommandListener";
import type { PlayerAction } from "@/types/game";

interface ActionInputProps {
  onAction: (action: PlayerAction) => void;
  choices?: string[];
  disabled?: boolean;
  id?: string;
}

export function ActionInput({ onAction, choices = [], disabled = false, id = "action-input" }: ActionInputProps) {
  const [text, setText] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onAction({ type: "free_text", content: trimmed });
    setText("");
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
            const label = choices[i] ?? `Option ${i + 1}`;
            onAction({ type: "choice", content: label, choiceIndex: i });
          }}
          isActive={!disabled}
        />
      </div>
    </div>
  );
}
