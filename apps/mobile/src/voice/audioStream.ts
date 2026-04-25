export interface ExpoAudioStreamNative {
  requestPermissionsAsync(): Promise<{ granted: boolean } & Record<string, unknown>>;
  startRecording(config: RecordingConfig): Promise<unknown>;
  stopRecording(): Promise<unknown>;
  pauseRecording?(): Promise<unknown>;
  resumeRecording?(): Promise<unknown>;
}

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

export interface AudioEventPayload {
  encoded?: string;
  buffer?: Float32Array;
}

export interface EventSubscription {
  remove(): void;
}

export const ExpoAudioStreamModule: ExpoAudioStreamNative = {
  async requestPermissionsAsync() {
    return { granted: false };
  },
  async startRecording() {
    throw new Error("Native audio stream is unavailable on web.");
  },
  async stopRecording() {
    /* no-op on web */
  },
};

export function addAudioEventListener(
  _listener: (event: AudioEventPayload) => Promise<void>,
): EventSubscription {
  return { remove() {} };
}
