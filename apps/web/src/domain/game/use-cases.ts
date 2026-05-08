import type { GMResponse, ItemMutation, NarrationEntry, PlayerAction, QuestMutation, SoundCue } from "@/types/game";

export function selectChoice(choiceLabel: string): string {
  return choiceLabel.replace(/\s+/g, " ").trim();
}

export function normalizeChoiceList(choices: string[]): string[] {
  const seen = new Set<string>();
  const normalizedChoices: string[] = [];

  for (const choice of choices) {
    const normalizedChoice = selectChoice(choice);

    if (normalizedChoice.length === 0 || seen.has(normalizedChoice)) {
      continue;
    }

    seen.add(normalizedChoice);
    normalizedChoices.push(normalizedChoice);
  }

  return normalizedChoices;
}

export interface TurnState {
  isGenerating: boolean;
  narrationLog: NarrationEntry[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
  choices: string[];
}

export interface TurnPatch {
  hp?: number;
  statDeltas?: Record<string, number>;
  flags?: Record<string, unknown>;
  locationId?: string;
  inventoryChanges?: ItemMutation[];
  questChanges?: QuestMutation[];
}

export interface OptimisticTurn {
  next: TurnState;
  rollback: TurnState;
  playerEntry: NarrationEntry;
}

export function createOptimisticTurn(state: TurnState, action: PlayerAction, now = new Date()): OptimisticTurn {
  const playerEntry: NarrationEntry = {
    id: now.getTime().toString(),
    text: action.content,
    type: "player_action",
    timestamp: now,
  };

  return {
    rollback: state,
    playerEntry,
    next: {
      ...state,
      isGenerating: true,
      narrationLog: [...state.narrationLog, playerEntry],
    },
  };
}

export function rollbackTurn(_: TurnState, snapshot: TurnState): TurnState {
  return snapshot;
}

export function finalizeTurn(state: TurnState, action: PlayerAction, narration: string, choices: string[], now = new Date()): TurnState {
  const narrationEntry: NarrationEntry = {
    id: (now.getTime() + 1).toString(),
    text: narration,
    type: "narration",
    timestamp: now,
  };

  return {
    ...state,
    isGenerating: false,
    choices: normalizeChoiceList(choices),
    narrationLog: [...state.narrationLog, narrationEntry],
    history: [...state.history, { role: "user", content: action.content }, { role: "assistant", content: narration }],
  };
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts = 2, delayMs = 120): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

/**
 * Maximum length of player input we'll forward to the GM. The server-side
 * Zod schema in /api/game/action enforces 2000 chars; we trim earlier here
 * so paste-bombs are caught before they leave the client (cheaper feedback,
 * less UI lag). Keep in sync with the server cap.
 */
const MAX_ACTION_CHARS = 2000;

// C0 control characters (except TAB \x09, LF \x0A, CR \x0D) plus DEL \x7F.
// Some recogniser / keyboard combinations emit stray control bytes that
// confuse the LLM tokeniser without adding meaning. Whitespace is then
// collapsed to single spaces so the surviving TAB/LF/CRs aren't repeated.
const CONTROL_CHAR_RE = new RegExp(
  "[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]",
  "g",
);


export function sanitizeAction(action: PlayerAction): PlayerAction | null {
  let content = action.content
    .replace(CONTROL_CHAR_RE, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!content) return null;
  if (content.length > MAX_ACTION_CHARS) {
    content = content.slice(0, MAX_ACTION_CHARS);
  }
  if (action.type === "choice" && typeof action.choiceIndex === "number" && action.choiceIndex < 0) {
    return null;
  }
  return { ...action, content };
}

export function extractNarrationFromChoiceEvent(data: Pick<GMResponse, "narration" | "choices">): { narration: string; choices: string[] } {
  return { narration: data.narration, choices: normalizeChoiceList(data.choices) };
}

export function shouldPlaySoundCue(soundCuesEnabled: boolean, eventType: string, cue: SoundCue | null): cue is SoundCue {
  return soundCuesEnabled && eventType === "sound_cue" && Boolean(cue);
}
