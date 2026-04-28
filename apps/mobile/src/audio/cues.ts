import * as Haptics from "expo-haptics";
import type { SoundCue } from "@audio-rpg/shared";

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

// Web Audio API synthesis — only available when running in a web browser (Expo web).
function synthCue(cue: SoundCue): void {
  if (typeof window === "undefined") return;
  // @ts-expect-error webkitAudioContext fallback for Safari
  const AudioCtx: typeof AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioCtx) return;

  const ac = new AudioCtx();
  if (ac.state === "suspended") void ac.resume();

  const t = ac.currentTime;

  function tone(freq: number, vol: number, start: number, dur: number, type: OscillatorType = "sine") {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(vol, t + start + 0.02);
    g.gain.linearRampToValueAtTime(0, t + start + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t + start); o.stop(t + start + dur + 0.05);
  }

  switch (cue) {
    case "choice_available":
      tone(880, 0.08, 0, 0.12);
      break;
    case "tension_low":
      tone(110, 0.12, 0, 0.5, "triangle");
      break;
    case "tension_high":
      tone(55, 0.18, 0, 0.6, "sawtooth");
      tone(110, 0.1, 0.1, 0.5, "sawtooth");
      break;
    case "danger":
      tone(58, 0.2, 0, 0.4, "sine");
      tone(58, 0.18, 0.45, 0.4, "sine");
      break;
    case "success":
      tone(392, 0.15, 0, 0.18);
      tone(523.3, 0.18, 0.18, 0.35);
      break;
    case "failure":
      tone(311, 0.16, 0, 0.2, "square");
      tone(277.2, 0.14, 0.22, 0.2, "square");
      break;
    case "discovery":
      tone(440, 0.12, 0, 0.15);
      tone(880, 0.12, 0.18, 0.15);
      tone(1760, 0.1, 0.36, 0.25);
      break;
    case "scene_change":
      tone(261.6, 0.1, 0, 0.35, "triangle");
      tone(329.6, 0.1, 0.15, 0.35, "triangle");
      break;
    case "save_complete":
      tone(523.3, 0.12, 0, 0.12);
      tone(659.3, 0.14, 0.12, 0.25);
      break;
  }
}

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
    synthCue(cue);
  }
}
