export type ActionType = "choice" | "free_text" | "voice_command" | "meta";

export interface PlayerAction {
  type: ActionType;
  content: string;
  choiceIndex?: number;
}

export interface GMResponse {
  narration: string;
  choices: string[];
  soundCue?: string | null;
  stateChanges?: Partial<GameStateUpdate>;
  npcAction?: NPCAction | null;
}

export interface GameStateUpdate {
  hp?: number;
  flags?: Record<string, unknown>;
  locationId?: string;
  timeOfDay?: string;
  weather?: string;
  npcStates?: Record<string, unknown>;
}

export interface NPCAction {
  npcId: string;
  action: string;
  dialogue?: string;
}

export interface NarrationEntry {
  id: string;
  text: string;
  type: "narration" | "player_action" | "system" | "recap";
  timestamp: Date;
}

export interface InMemorySession {
  id: string;
  worldId: string;
  characterId: string;
  status: "active" | "paused" | "completed";
  turnCount: number;
  currentLocationId: string | null;
  timeOfDay: string;
  weather: string;
  globalFlags: Record<string, unknown>;
  npcStates: Record<string, unknown>;
  memorySummary: string;
  history: HistoryMessage[];
  narrationLog: NarrationEntry[];
  choices: string[];
  isGenerating: boolean;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export type SoundCue =
  | "combat_start"
  | "combat_end"
  | "level_up"
  | "item_pickup"
  | "door_open"
  | "door_locked"
  | "discovery"
  | "danger_near"
  | "npc_friendly"
  | "npc_hostile"
  | "quest_complete"
  | "quest_fail"
  | "magic_cast"
  | "spell_fail"
  | "treasure_found"
  | "death_nearby"
  | "success"
  | "error"
  | "click";
