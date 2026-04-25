import { ExpoAudioStreamModule as RawModule } from "@siteed/expo-audio-stream";
import {
  addAudioEventListener as rawAddAudioEventListener,
  type AudioEventPayload as RawAudioEventPayload,
} from "@siteed/expo-audio-stream/build/events";
import type { RecordingConfig as RawRecordingConfig } from "@siteed/expo-audio-stream";

/**
 * Narrow adapter around @siteed/expo-audio-stream. The package's own
 * `ExpoAudioStreamModule` is declared as `any` in its .d.ts (the usual
 * shape for expo-modules-core turbo modules), so we re-type it here with
 * only the methods we actually call. This keeps the rest of the app on
 * a stable, typed surface even if the package bumps a major version.
 */

export interface ExpoAudioStreamNative {
  requestPermissionsAsync(): Promise<{ granted: boolean } & Record<string, unknown>>;
  startRecording(config: RawRecordingConfig): Promise<unknown>;
  stopRecording(): Promise<unknown>;
  pauseRecording?(): Promise<unknown>;
  resumeRecording?(): Promise<unknown>;
}

export type RecordingConfig = RawRecordingConfig;
export type AudioEventPayload = RawAudioEventPayload;

export interface EventSubscription {
  remove(): void;
}

export const ExpoAudioStreamModule: ExpoAudioStreamNative = RawModule;

export function addAudioEventListener(
  listener: (event: AudioEventPayload) => Promise<void>,
): EventSubscription {
  return rawAddAudioEventListener(listener);
}
