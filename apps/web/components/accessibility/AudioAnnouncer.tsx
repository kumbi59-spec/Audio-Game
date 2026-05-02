"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { isTTSAudible, speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";

interface AnnouncerContextValue {
  announce: (message: string, priority?: "polite" | "assertive") => void;
  announceError: (message: string) => void;
  announceAction: (action: string) => void;
  /**
   * Narrate a message to the user using the appropriate audio channel:
   * - If TTS is audible (volume > 0), speak via TTS only — DOES NOT also
   *   write to the screen-reader live region, to prevent VoiceOver / TalkBack
   *   from reading the same message on top of the TTS voice.
   * - If TTS is muted, route the message to the polite screen-reader live
   *   region so the user still hears it.
   *
   * Use this for narration, step prompts, and other contextual messages
   * that the user expects to hear spoken. Use plain announce() for UI
   * feedback like form validation that should always reach the screen
   * reader regardless of TTS state.
   */
  narrate: (message: string, priority?: "polite" | "assertive") => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

export function useAnnouncer(): AnnouncerContextValue {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) throw new Error("useAnnouncer must be used within AudioAnnouncer");
  return ctx;
}

export function AudioAnnouncer({ children }: { children: React.ReactNode }) {
  const [politeMsg, setPoliteMsg] = useState("");
  const [assertiveMsg, setAssertiveMsg] = useState("");
  const politeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assertiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (priority === "assertive") {
        setAssertiveMsg("");
        if (assertiveTimer.current) clearTimeout(assertiveTimer.current);
        assertiveTimer.current = setTimeout(() => {
          setAssertiveMsg(message);
        }, 50);
      } else {
        setPoliteMsg("");
        if (politeTimer.current) clearTimeout(politeTimer.current);
        politeTimer.current = setTimeout(() => {
          setPoliteMsg(message);
        }, 50);
      }
    },
    []
  );

  const announceError = useCallback(
    (message: string) => announce(message, "assertive"),
    [announce]
  );

  const announceAction = useCallback(
    (action: string) => announce(`You chose: ${action}`, "polite"),
    [announce]
  );

  const narrate = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (isTTSAudible()) {
        const { ttsSpeed, volume } = useAudioStore.getState();
        void speak(message, { rate: ttsSpeed, volume });
      } else {
        announce(message, priority);
      }
    },
    [announce]
  );

  useEffect(() => {
    return () => {
      if (politeTimer.current) clearTimeout(politeTimer.current);
      if (assertiveTimer.current) clearTimeout(assertiveTimer.current);
    };
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce, announceError, announceAction, narrate }}>
      {children}
      {/* Polite live region — non-urgent announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMsg}
      </div>
      {/* Assertive live region — urgent interruptions (combat, danger) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMsg}
      </div>
    </AnnouncerContext.Provider>
  );
}
