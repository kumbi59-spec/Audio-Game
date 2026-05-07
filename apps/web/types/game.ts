export type ActionType = "choice" | "free_text" | "voice_command" | "meta";

export interface PlayerAction {
  type: ActionType;
  content: string;
  choiceIndex?: number;
}

export interface AchievementUnlock {
  key: string;
  title: string;
  description: string;
  unlockedAt: number;
}

export interface NpcRelationship {
  npcId: string;
  name: string;
  standing: number; // -100 (enemy) to +100 (ally), 0 = neutral
  notes?: string;
  lastSeenTurn: number;
}

export interface CodexEntry {
  key: string;
  title: string;
  body: string;
  unlockedAt: number;
}

export interface GMResponse {
  narration: string;
  choices: string[];
  soundCue?: string | null;
  stateChanges?: Partial<GameStateUpdate>;
  npcAction?: NPCAction | null;
  skill_check?: { stat: string; dc: number; label: string } | null;
}

export interface ItemMutation {
  op: "add" | "remove";
  name: string;
  quantity: number;
  description?: string;
  category?: "weapon" | "armor" | "consumable" | "key" | "misc";
}

export interface QuestMutation {
  op: "start" | "update" | "complete" | "fail";
  title: string;
  description?: string;
  /** Objectives array — used when op is "start" */
  objectives?: string[];
  /** Single objective text — used when op is "update" */
  objective?: string;
  done?: boolean;
}

export interface GameStateUpdate {
  sceneTransition?: SceneTransition;
  hp?: number;
  /** Arbitrary stat deltas — e.g. { mp: -10, stamina: -5 } */
  statDeltas?: Record<string, number>;
  flags?: Record<string, unknown>;
  locationId?: string;
  timeOfDay?: string;
  weather?: string;
  npcStates?: Record<string, unknown>;
  inventoryChanges?: ItemMutation[];
  questChanges?: QuestMutation[];
  achievementUnlocks?: AchievementUnlock[];
  npcRelationshipChanges?: Array<{ npcId: string; name: string; standing: number; notes?: string }>;
  codexEntries?: CodexEntry[];
  passiveBonuses?: PassiveBonus[];
  passiveBonusNarration?: string[];
}

export interface PassiveBonus {
  sourceStat: string;
  value: number;
  reason: string;
  targetRoll: string;
}


export interface SceneTransition {
  type: string;
  title: string;
  subtitle?: string;
  durationMs?: number;
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
  achievements: AchievementUnlock[];
  relationships: NpcRelationship[];
  codex: CodexEntry[];
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export type SoundCue =
  // Client-side cues (triggered by game logic / state mutations)
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
  | "click"
  // GM-facing cues (sent by the AI via the shared schema)
  | "tension_low"
  | "tension_high"
  | "danger"
  | "failure"
  | "scene_change"
  | "save_complete"
  | "choice_available";
