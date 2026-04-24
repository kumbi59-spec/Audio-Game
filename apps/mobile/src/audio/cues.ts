import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import type { SoundCue } from "@audio-rpg/shared";

/**
 * Short, distinguishable sound cues. Each cue fires alongside a matching
 * haptic pattern for deaf-blind accessibility. Cues are individually
 * disableable in the Accessibility Center.
 */

interface CuePreset {
  hapticStyle: Haptics.ImpactFeedbackStyle | "notification";
  notificationType?: Haptics.NotificationFeedbackType;
}

const PRESETS: Record<SoundCue, CuePreset> = {
  choice_available: { hapticStyle: Haptics.ImpactFeedbackStyle.Light },
  tension_low: { hapticStyle: Haptics.ImpactFeedbackStyle.Light },
  tension_high: { hapticStyle: Haptics.ImpactFeedbackStyle.Heavy },
  danger: {
    hapticStyle: "notification",
    notificationType: Haptics.NotificationFeedbackType.Warning,
  },
  success: {
    hapticStyle: "notification",
    notificationType: Haptics.NotificationFeedbackType.Success,
  },
  failure: {
    hapticStyle: "notification",
    notificationType: Haptics.NotificationFeedbackType.Error,
  },
  discovery: { hapticStyle: Haptics.ImpactFeedbackStyle.Medium },
  scene_change: { hapticStyle: Haptics.ImpactFeedbackStyle.Medium },
  save_complete: {
    hapticStyle: "notification",
    notificationType: Haptics.NotificationFeedbackType.Success,
  },
};

let prefs = {
  soundEnabled: true,
  hapticsEnabled: true,
  volume: 0.7,
};

export function setCuePreferences(next: Partial<typeof prefs>): void {
  prefs = { ...prefs, ...next };
}

export async function playCue(cue: SoundCue): Promise<void> {
  const preset = PRESETS[cue];
  if (prefs.hapticsEnabled) {
    try {
      if (preset.hapticStyle === "notification" && preset.notificationType) {
        await Haptics.notificationAsync(preset.notificationType);
      } else if (preset.hapticStyle !== "notification") {
        await Haptics.impactAsync(preset.hapticStyle);
      }
    } catch {
      /* haptics unavailable on this platform */
    }
  }
  if (prefs.soundEnabled) {
    // Audio assets land in Phase 3 polish. For now we log so dev can verify
    // the cue dispatched at the right moment in the loop.
    if (__DEV__) console.log(`[cue] ${cue}`);
    void Audio; // placeholder retaining the import for future wiring
  }
}
