import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AccessibilityStore {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  audioOnlyMode: boolean;
  keyboardHelpOpen: boolean;
  operationsManualSeen: boolean;
  operationsManualOpen: boolean;
  lastAnnouncement: string;
  /**
   * Where to land focus after a turn finalises:
   *   "choices" — first choice button (default; best for screen-reader users
   *               navigating the choice list).
   *   "input"   — the action text input (best for players who mostly type
   *               freeform actions; saves a Tab from choices back to input).
   */
  focusAfterTurn: "choices" | "input";

  setHighContrast: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setAudioOnlyMode: (value: boolean) => void;
  setKeyboardHelpOpen: (value: boolean) => void;
  openOperationsManual: () => void;
  closeOperationsManual: () => void;
  markOperationsManualSeen: () => void;
  setFocusAfterTurn: (value: "choices" | "input") => void;
  announce: (message: string) => void;
}

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set) => ({
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      audioOnlyMode: false,
      keyboardHelpOpen: false,
      operationsManualSeen: false,
      operationsManualOpen: false,
      lastAnnouncement: "",
      focusAfterTurn: "choices",

      setHighContrast: (value) => set({ highContrast: value }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setLargeText: (value) => set({ largeText: value }),
      setAudioOnlyMode: (value) => set({ audioOnlyMode: value }),
      setKeyboardHelpOpen: (value) => set({ keyboardHelpOpen: value }),
      openOperationsManual: () => set({ operationsManualOpen: true }),
      closeOperationsManual: () => set({ operationsManualOpen: false }),
      markOperationsManualSeen: () => set({ operationsManualSeen: true }),
      setFocusAfterTurn: (value) => set({ focusAfterTurn: value }),
      announce: (message) => set({ lastAnnouncement: message }),
    }),
    { name: "audio-game-a11y" }
  )
);
