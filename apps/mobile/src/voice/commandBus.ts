import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Global voice-command bus. Every screen registers its own command handlers;
 * the STT pipeline (Deepgram stream or on-device Whisper) normalizes the
 * player's speech into a phrase and dispatches it here. Utility commands
 * ("repeat", "inventory", "help") are registered once at the app root so
 * they work on every screen.
 */

export type CommandHandler = (transcript: string) => void | Promise<void>;

interface Command {
  phrases: string[];
  handler: CommandHandler;
}

interface Registration {
  commands: Command[];
}

const registrations = new Set<Registration>();
const listeners = new Set<(transcript: string) => void>();

export function registerCommands(
  handlers: Record<string, CommandHandler>,
): () => void {
  const reg: Registration = {
    commands: Object.entries(handlers).map(([pattern, handler]) => ({
      phrases: pattern.split("|").map((s) => s.trim().toLowerCase()),
      handler,
    })),
  };
  registrations.add(reg);
  return () => {
    registrations.delete(reg);
  };
}

/**
 * Registers a screen's commands while it is focused. A stack keeps
 * screens mounted underneath the current one, and their commands must
 * not fire from there.
 */
export function useVoiceCommands(handlers: Record<string, CommandHandler>): void {
  useFocusEffect(useCallback(() => registerCommands(handlers), [handlers]));
}

export interface DispatchOptions {
  /**
   * Match only a transcript that is exactly a command phrase, not one that
   * merely starts with it. Screens use this for speech that is otherwise a
   * player's answer, so "speak to the guard" isn't the "speak" command.
   */
  exact?: boolean;
}

/** Entry point for the STT pipeline to dispatch recognized speech. */
export async function dispatchTranscript(
  transcript: string,
  options: DispatchOptions = {},
): Promise<boolean> {
  const normalized = normalizeTranscript(transcript);
  if (!normalized) return false;

  for (const listener of listeners) listener(transcript);

  const matches = (p: string): boolean =>
    normalized === p || (!options.exact && normalized.startsWith(`${p} `));
  for (const reg of Array.from(registrations).reverse()) {
    const command = reg.commands.find((c) => c.phrases.some(matches));
    if (command) {
      await command.handler(transcript);
      return true;
    }
  }
  return false;
}

/** The first phrase of every active command, newest registration first. */
export function listCommandPhrases(): string[] {
  const phrases: string[] = [];
  for (const reg of Array.from(registrations).reverse()) {
    for (const command of reg.commands) {
      const phrase = command.phrases[0];
      if (phrase && !phrases.includes(phrase)) phrases.push(phrase);
    }
  }
  return phrases;
}

// Recognizers punctuate ("Repeat."), which would defeat exact matching.
function normalizeTranscript(transcript: string): string {
  return transcript
    .trim()
    .toLowerCase()
    .replace(/^[\s"'.,!?]+|[\s"'.,!?]+$/g, "");
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
