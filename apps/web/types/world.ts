export interface WorldData {
  id: string;
  name: string;
  description: string;
  genre: string;
  tone: string;
  systemPrompt: string;
  isPrebuilt: boolean;
  imageUrl?: string | null;
  locations: LocationData[];
  npcs: NPCData[];
  // World-specific mechanics extracted from the game bible (absent for prebuilt worlds)
  classes?: Array<{ name: string; description: string }>;
  backgrounds?: Array<{ name: string; description: string }>;
  rulesNotes?: string;
}

export interface LocationData {
  id: string;
  name: string;
  description: string;
  shortDesc: string;
  ambientSound?: string | null;
  connectedTo: string[];
  properties: Record<string, unknown>;
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  personality: string;
  voiceDescription: string;
  relationship: "friendly" | "hostile" | "neutral" | "allied";
  isAlive: boolean;
  locationId?: string | null;
}

export interface LibraryItemData {
  id: string;
  title: string;
  author?: string | null;
  description: string;
  genre: string;
  coverImageUrl?: string | null;
  durationMinutes?: number | null;
  difficulty: "beginner" | "intermediate" | "experienced";
  tags: string[];
  worldId: string;
}

export interface ParsedGameBible {
  worldName: string;
  genre: string;
  tone: string;
  synopsis: string;
  systemPromptCore: string;
  locations: Array<{
    name: string;
    description: string;
    shortDesc: string;
    ambientMood: string;
    connections: string[];
  }>;
  npcs: Array<{
    name: string;
    role: string;
    personality: string;
    voiceDescription: string;
    homeLocation: string;
  }>;
  factions: Array<{ name: string; description: string; disposition: string }>;
  startingLocation: string;
  openingNarration: string;
  campaignHooks: string[];
  importantItems: Array<{
    name: string;
    description: string;
    significance: string;
  }>;
  rulesNotes: string;
  // World-specific character mechanics (empty arrays if not applicable)
  classes: Array<{ name: string; description: string; role: string }>;
  backgrounds: Array<{ name: string; description: string }>;
}
