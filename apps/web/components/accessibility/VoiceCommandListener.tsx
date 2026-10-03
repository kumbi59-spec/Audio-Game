"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnnouncer } from "./AudioAnnouncer";
import { isPaused, isSpeaking, pauseSpeech, resumeSpeech } from "@/lib/audio/tts-provider";

interface VoiceCommandListenerProps {
  onAction: (text: string) => void;
  onChoiceSelect?: (index: number) => void;
  onMeta?: (command: string) => void;
  /** How many choices are on offer, so "option 7" with four choices is caught. */
  choiceCount?: number;
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

const NUMBER_WORDS: Record<string, number> = {
  one: 1, first: 1, two: 2, to: 2, too: 2, second: 2, three: 3, third: 3, four: 4, for: 4, fourth: 4,
  five: 5, fifth: 5, six: 6, sixth: 6, seven: 7, seventh: 7, eight: 8, eighth: 8, nine: 9, ninth: 9,
};

function choiceNumber(word: string): number | null {
  const n = /^\d$/.test(word) ? parseInt(word, 10) : NUMBER_WORDS[word] ?? null;
  return n !== null && n >= 1 && n <= 9 ? n : null;
}

/**
 * Sorts a final transcript into a choice ("choose option 3", "pick two",
 * "number 1", "3"), a meta command (the whole phrase is a command, so
 * "stop" pauses but "stop the guard" is an action), or a free-text action.
 */
export function parseVoiceInput(transcript: string): { type: "choice" | "meta" | "action"; value: string | number } {
  const lower = transcript.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();

  const choiceMatch =
    lower.match(/^(?:i\s+)?(?:choose|select|pick|take)(?:\s+(?:option|number|choice))?\s+(\w+)$/) ??
    lower.match(/^(?:option|number|choice)\s+(\w+)$/) ??
    lower.match(/^(\w+)$/);
  const n = choiceMatch ? choiceNumber(choiceMatch[1]!) : null;
  if (n !== null) return { type: "choice", value: n - 1 };

  const phrase = lower.replace(/^please\s+/, "").replace(/\s+please$/, "");
  const command = META_COMMANDS[phrase];
  if (command) return { type: "meta", value: command };

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
  choiceCount,
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
  // Narration the mic paused, so it can pick up again if nothing was said.
  const pausedForMicRef = useRef(false);
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
      // The narrator would otherwise talk over the player (and into the mic).
      if (isSpeaking() && !isPaused()) {
        pauseSpeech();
        pausedForMicRef.current = true;
      }
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
          const index = parsed.value as number;
          if (choiceCount !== undefined && index >= choiceCount) {
            announce(choiceCount > 0 ? `There are only ${choiceCount} choices.` : "There are no choices right now.");
          } else {
            announce(`Selecting option ${index + 1}`);
            onChoiceSelect(index);
          }
        } else if (parsed.type === "meta" && onMeta) {
          onMeta(parsed.value as string);
        } else {
          // Free-text action: stage for confirmation rather than firing
          // immediately, so a misrecognised transcript doesn't waste an
          // AI turn. Auto-sends after FREE_TEXT_CONFIRM_MS unless cancelled.
          const value = parsed.value as string;
          announce(`Heard: ${value}. Sending in ${Math.round(FREE_TEXT_CONFIRM_MS / 1000)} seconds. Press Cancel to stop.`);
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
      // Nothing started a new turn: let the narrator carry on.
      if (pausedForMicRef.current) {
        pausedForMicRef.current = false;
        if (isPaused()) resumeSpeech();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionClass, listening, announce, announceError, onAction, onChoiceSelect, onMeta, choiceCount, stopListening]);

  useEffect(() => {
    if (!isActive && listening) stopListening();
  }, [isActive, listening, stopListening]);

  // If the page becomes inactive (e.g. turn in flight) while a confirmation is
  // pending, cancel it — we don't want an auto-send to land on a stale frame.
  useEffect(() => {
    if (!isActive && pendingAction) clearPending();
  }, [isActive, pendingAction, clearPending]);

  // Clean up on unmount: the pending timer, and the mic if it's still open.
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current !== null) clearTimeout(pendingTimerRef.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.stop();
      }
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
