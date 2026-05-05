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

  setHighContrast: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setAudioOnlyMode: (value: boolean) => void;
  setKeyboardHelpOpen: (value: boolean) => void;
  openOperationsManual: () => void;
  closeOperationsManual: () => void;
  markOperationsManualSeen: () => void;
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

      setHighContrast: (value) => set({ highContrast: value }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setLargeText: (value) => set({ largeText: value }),
      setAudioOnlyMode: (value) => set({ audioOnlyMode: value }),
      setKeyboardHelpOpen: (value) => set({ keyboardHelpOpen: value }),
      openOperationsManual: () => set({ operationsManualOpen: true }),
      closeOperationsManual: () => set({ operationsManualOpen: false }),
      markOperationsManualSeen: () => set({ operationsManualSeen: true }),
      announce: (message) => set({ lastAnnouncement: message }),
    }),
    { name: "audio-game-a11y" }
  )
);
