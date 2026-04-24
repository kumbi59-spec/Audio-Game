import { useEffect } from "react";

/**
 * Global voice-command bus. Every screen registers its own command handlers;
 * the STT pipeline (Deepgram stream or on-device Whisper) normalizes the
 * player's speech into a phrase and dispatches it here. Utility commands
 * ("repeat", "inventory", "help") are registered once at the app root so
 * they work on every screen.
 */

export type CommandHandler = (transcript: string) => void | Promise<void>;

interface Registration {
  phrases: string[];
  handler: CommandHandler;
}

const registrations = new Set<Registration>();
const listeners = new Set<(transcript: string) => void>();

export function registerCommands(
  handlers: Record<string, CommandHandler>,
): () => void {
  const reg: Registration = {
    phrases: Object.keys(handlers).flatMap((phrase) =>
      phrase.split("|").map((s) => s.trim().toLowerCase()),
    ),
    handler: (transcript) => {
      const normalized = transcript.trim().toLowerCase();
      for (const [pattern, handler] of Object.entries(handlers)) {
        const alts = pattern.split("|").map((s) => s.trim().toLowerCase());
        if (alts.some((a) => normalized === a || normalized.startsWith(`${a} `))) {
          return handler(transcript);
        }
      }
    },
  };
  registrations.add(reg);
  return () => {
    registrations.delete(reg);
  };
}

export function useVoiceCommands(handlers: Record<string, CommandHandler>): void {
  useEffect(() => registerCommands(handlers), [handlers]);
}

/** Entry point for the STT pipeline to dispatch recognized speech. */
export async function dispatchTranscript(transcript: string): Promise<boolean> {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;

  for (const listener of listeners) listener(transcript);

  for (const reg of Array.from(registrations).reverse()) {
    if (
      reg.phrases.some(
        (p) => normalized === p || normalized.startsWith(`${p} `),
      )
    ) {
      await reg.handler(transcript);
      return true;
    }
  }
  return false;
}

export function onAnyTranscript(
  listener: (transcript: string) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetCommandBusForTests(): void {
  registrations.clear();
  listeners.clear();
}
