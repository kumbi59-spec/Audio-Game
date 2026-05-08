"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnnouncer } from "./AudioAnnouncer";

interface VoiceCommandListenerProps {
  onAction: (text: string) => void;
  onChoiceSelect?: (index: number) => void;
  onMeta?: (command: string) => void;
  isActive: boolean;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  readonly results: Iterable<SpeechRecognitionResultLike>;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

// Detect if browser supports SpeechRecognition
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition ||
    null
  );
}

const META_COMMANDS: Record<string, string> = {
  "open inventory": "inventory",
  "show inventory": "inventory",
  "open quest log": "quests",
  "show quests": "quests",
  "read status": "status",
  "my status": "status",
  "where am i": "location",
  "current location": "location",
  "read last": "replay",
  "replay": "replay",
  "pause": "pause",
  "stop": "pause",
  "continue": "resume",
  "save game": "save",
};

function parseVoiceInput(transcript: string): { type: "choice" | "meta" | "action"; value: string | number } {
  const lower = transcript.toLowerCase().trim();

  // Check for choice selection: "choose option 3", "select 2", "option 1", "number 3"
  const choiceMatch = lower.match(/(?:choose|select|option|number|pick)\s+(\w+)/);
  if (choiceMatch) {
    const word = choiceMatch[1];
    const num = parseInt(word);
    if (!isNaN(num) && num >= 1 && num <= 9) return { type: "choice", value: num - 1 };
  }
  const directNum = lower.match(/^(\d)$/);
  if (directNum) {
    return { type: "choice", value: parseInt(directNum[1]) - 1 };
  }

  // Check for meta commands
  for (const [phrase, command] of Object.entries(META_COMMANDS)) {
    if (lower.includes(phrase)) return { type: "meta", value: command };
  }

  return { type: "action", value: transcript.trim() };
}

// Auto-send delay for free-text voice actions. Long enough that a player
// who heard a misrecognised word ("attack the lizard" instead of "wizard")
// can hit Cancel; short enough not to feel sluggish for clean transcripts.
const FREE_TEXT_CONFIRM_MS = 3500;

export function VoiceCommandListener({
  onAction,
  onChoiceSelect,
  onMeta,
  isActive,
}: VoiceCommandListenerProps) {
  const { announce, announceError } = useAnnouncer();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  // Pending free-text action awaiting user confirmation. Choice and meta
  // commands still fire immediately — they're short and unambiguous, so the
  // confirmation friction isn't worth it there.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const SpeechRecognitionClass = getSpeechRecognition();

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const clearPending = useCallback(() => {
    if (pendingTimerRef.current !== null) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setPendingAction(null);
  }, []);

  const sendPending = useCallback(() => {
    if (!pendingAction) return;
    const text = pendingAction;
    clearPending();
    onAction(text);
  }, [pendingAction, clearPending, onAction]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass) {
      announceError("Voice input is not supported in your browser.");
      return;
    }
    if (listening) {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      announce("Listening… speak your action.");
    };

    recognition.onresult = (e: SpeechRecognitionEventLike) => {
      const result = Array.from(e.results).pop();
      if (!result) return;
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        const parsed = parseVoiceInput(text);
        setTranscript("");
        stopListening();

        if (parsed.type === "choice" && onChoiceSelect) {
          announce(`Selecting option ${(parsed.value as number) + 1}`);
          onChoiceSelect(parsed.value as number);
        } else if (parsed.type === "meta" && onMeta) {
          onMeta(parsed.value as string);
        } else {
          // Free-text action: stage for confirmation rather than firing
          // immediately, so a misrecognised transcript doesn't waste an
          // AI turn. Auto-sends after FREE_TEXT_CONFIRM_MS unless cancelled.
          const value = parsed.value as string;
          announce(`Heard: ${value}. Sending in ${Math.round(FREE_TEXT_CONFIRM_MS / 1000)} seconds. Say cancel or press cancel to stop.`);
          setPendingAction(value);
          if (pendingTimerRef.current !== null) clearTimeout(pendingTimerRef.current);
          pendingTimerRef.current = setTimeout(() => {
            pendingTimerRef.current = null;
            setPendingAction((current) => {
              if (current) onAction(current);
              return null;
            });
          }, FREE_TEXT_CONFIRM_MS);
        }
      }
    };

    recognition.onerror = () => {
      announceError("Voice recognition error. Please try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionClass, listening, announce, announceError, onAction, onChoiceSelect, onMeta, stopListening]);

  useEffect(() => {
    if (!isActive && listening) stopListening();
  }, [isActive, listening, stopListening]);

  // If the page becomes inactive (e.g. turn in flight) while a confirmation is
  // pending, cancel it — we don't want an auto-send to land on a stale frame.
  useEffect(() => {
    if (!isActive && pendingAction) clearPending();
  }, [isActive, pendingAction, clearPending]);

  // Cleanup any pending timer on unmount
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current !== null) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={startListening}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice input" : "Start voice input (V)"}
        disabled={!isActive}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 ${
          listening
            ? "animate-pulse-slow bg-red-500 text-white"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        🎤
      </button>
      {listening && (
        <p
          role="status"
          aria-live="polite"
          className="max-w-xs text-center text-sm text-muted-foreground italic"
        >
          {transcript || "Listening…"}
        </p>
      )}
      {pendingAction && (
        <div
          role="alertdialog"
          aria-label="Confirm voice action"
          className="flex max-w-xs flex-col items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-center"
        >
          <p className="text-sm font-medium text-amber-200">
            Heard: <span className="italic">&ldquo;{pendingAction}&rdquo;</span>
          </p>
          <p className="text-xs text-amber-200/70">
            Sending automatically — press Cancel to stop.
          </p>
          <div className="flex gap-2">
            <button
              onClick={sendPending}
              aria-label="Send voice action now"
              className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Send
            </button>
            <button
              onClick={() => {
                clearPending();
                announce("Voice action cancelled.");
              }}
              aria-label="Cancel voice action"
              className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
