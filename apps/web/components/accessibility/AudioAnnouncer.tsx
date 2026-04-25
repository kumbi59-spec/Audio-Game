"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AnnouncerContextValue {
  announce: (message: string, priority?: "polite" | "assertive") => void;
  announceError: (message: string) => void;
  announceAction: (action: string) => void;
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

  useEffect(() => {
    return () => {
      if (politeTimer.current) clearTimeout(politeTimer.current);
      if (assertiveTimer.current) clearTimeout(assertiveTimer.current);
    };
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce, announceError, announceAction }}>
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
