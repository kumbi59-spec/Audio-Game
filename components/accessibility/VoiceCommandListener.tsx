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

export function VoiceCommandListener({
  onAction,
  onChoiceSelect,
  onMeta,
  isActive,
}: VoiceCommandListenerProps) {
  const { announce, announceError } = useAnnouncer();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const SpeechRecognitionClass = getSpeechRecognition();

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

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
          announce(`Action: ${parsed.value}`);
          onAction(parsed.value as string);
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
    </div>
  );
}
