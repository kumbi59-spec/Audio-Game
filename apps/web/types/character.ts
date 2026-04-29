export interface CharacterStats {
  hp: number;
  maxHp: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
  level: number;
  experience: number;
}

export interface CharacterData {
  id: string;
  name: string;
  pronouns?: string | null;
  age?: number | null;
  shortDescription?: string | null;
  class: CharacterClass;
  roleTitle?: string | null; // custom class name from uploaded world (overrides display of `class`)
  backstory: string;
  stats: CharacterStats;
  inventory: InventoryItemData[];
  quests: QuestData[];
}

export type CharacterClass = "warrior" | "rogue" | "mage" | "ranger" | "bard";

export interface InventoryItemData {
  id: string;
  name: string;
  description: string;
  category: "weapon" | "armor" | "consumable" | "key" | "misc";
  quantity: number;
  properties: Record<string, unknown>;
}

export interface QuestData {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "failed" | "abandoned";
  objectives: QuestObjective[];
  reward?: string | null;
}

export interface QuestObjective {
  id: string;
  text: string;
  completed: boolean;
}

export const CLASS_DESCRIPTIONS: Record<CharacterClass, {
  name: string;
  description: string;
  startingStats: CharacterStats;
  startingItems: string[];
}> = {
  warrior: {
    name: "Warrior",
    description: "A stalwart fighter, trained in combat and survival. High health and strength make you a formidable force in battle.",
    startingStats: { hp: 30, maxHp: 30, strength: 16, dexterity: 10, intelligence: 8, charisma: 10, level: 1, experience: 0 },
    startingItems: ["Iron Sword", "Leather Armor", "Torch"],
  },
  rogue: {
    name: "Rogue",
    description: "A nimble trickster who relies on speed and cunning over brute force. Excel at stealth, traps, and unexpected strikes.",
    startingStats: { hp: 22, maxHp: 22, strength: 10, dexterity: 16, intelligence: 12, charisma: 12, level: 1, experience: 0 },
    startingItems: ["Short Sword", "3 Lockpicks", "Shadow Cloak"],
  },
  mage: {
    name: "Mage",
    description: "A scholar of the arcane arts. Low physical resilience, but capable of powerful magic that can reshape reality itself.",
    startingStats: { hp: 16, maxHp: 16, strength: 6, dexterity: 10, intelligence: 18, charisma: 12, level: 1, experience: 0 },
    startingItems: ["Staff of Focus", "Spellbook", "Mana Potion"],
  },
  ranger: {
    name: "Ranger",
    description: "A wilderness expert who blends tracking, archery, and survival skills. Effective at range and against beasts.",
    startingStats: { hp: 24, maxHp: 24, strength: 12, dexterity: 14, intelligence: 12, charisma: 10, level: 1, experience: 0 },
    startingItems: ["Shortbow", "20 Arrows", "Hunting Knife", "Trail Rations"],
  },
  bard: {
    name: "Bard",
    description: "A charismatic performer who inspires allies and confounds enemies with music, stories, and silver-tongued persuasion.",
    startingStats: { hp: 20, maxHp: 20, strength: 8, dexterity: 12, intelligence: 14, charisma: 18, level: 1, experience: 0 },
    startingItems: ["Lute", "Dagger", "Performer's Costume", "Coin Purse"],
  },
};
