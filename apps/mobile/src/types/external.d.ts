declare module "@siteed/expo-audio-stream" {
  export interface RecordingConfig {
    sampleRate: number;
    channels: number;
    encoding: string;
    interval: number;
    enableProcessing: boolean;
    keepAwake: boolean;
    showNotification: boolean;
    ios?: {
      audioSession?: {
        category?: string;
        mode?: string;
        categoryOptions?: string[];
      };
    };
  }

  export const ExpoAudioStreamModule: {
    requestPermissionsAsync(): Promise<{ granted: boolean } & Record<string, unknown>>;
    startRecording(config: RecordingConfig): Promise<unknown>;
    stopRecording(): Promise<unknown>;
    pauseRecording?(): Promise<unknown>;
    resumeRecording?(): Promise<unknown>;
  };
}

declare module "@siteed/expo-audio-stream/build/events" {
  export interface AudioEventPayload {
    encoded?: string;
    buffer?: Float32Array;
  }

  export function addAudioEventListener(
    listener: (event: AudioEventPayload) => Promise<void>,
  ): { remove(): void };
}

declare module "@playwright/test" {
  export interface Page {
    goto(url: string): Promise<void>;
    on(event: "pageerror", listener: (err: unknown) => void): void;
    getByRole(
      role: string,
      options?: { name?: string; level?: number },
    ): { toBeVisible?: () => Promise<void>; waitFor: () => Promise<void> };
  }

  export const test: {
    (name: string, fn: (args: { page: Page }) => Promise<void>): void;
    beforeEach(fn: (args: { page: Page }) => Promise<void>): void;
  };

  export function expect(actual: unknown, message?: string): {
    toBeVisible(): Promise<void>;
    toEqual(expected: unknown): void;
  };

  export function defineConfig(config: unknown): unknown;
  export const devices: Record<string, Record<string, unknown>>;
}

declare module "@axe-core/playwright" {
  import type { Page } from "@playwright/test";

  export default class AxeBuilder {
    constructor(options: { page: Page });
    withTags(tags: string[]): this;
    disableRules(rules: string[]): this;
    analyze(): Promise<{
      violations: Array<{ impact?: string | null }>;
    }>;
  }
}

declare const process: {
  env: Record<string, string | undefined>;
};
