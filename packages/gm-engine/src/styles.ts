import type { StyleMode } from "@audio-rpg/shared";

export interface StyleProfile {
  directive: string;
  preferredChoiceCount: [min: number, max: number];
  temperature: number;
}

export const STYLE_PROFILES: Record<StyleMode, StyleProfile> = {
  cinematic: {
    directive:
      "Lean into vivid sensory detail and strong pacing. Short punchy paragraphs. Keep rules invisible unless they matter.",
    preferredChoiceCount: [3, 4],
    temperature: 0.8,
  },
  rules_light: {
    directive:
      "Resolve actions with a single clear outcome. Rarely ask for checks. Trust player intent when reasonable.",
    preferredChoiceCount: [3, 4],
    temperature: 0.7,
  },
  crunchy: {
    directive:
      "Name the rule being applied when relevant. Make stat and inventory consequences clear. Use the world's mechanics faithfully.",
    preferredChoiceCount: [3, 5],
    temperature: 0.5,
  },
  mystery: {
    directive:
      "Seed clues deliberately. Never resolve a mystery without letting the player piece it together. Reward careful observation.",
    preferredChoiceCount: [3, 4],
    temperature: 0.7,
  },
  horror: {
    directive:
      "Favor dread and restraint over gore. Withhold information when it serves tension. Let silence speak. Respect the player's chosen content rating.",
    preferredChoiceCount: [3, 4],
    temperature: 0.8,
  },
  political: {
    directive:
      "Emphasize factions, allegiances, and second-order consequences. Conversations matter as much as action.",
    preferredChoiceCount: [3, 5],
    temperature: 0.6,
  },
  adventure: {
    directive:
      "Keep momentum high. One discovery, one complication, one decision per scene.",
    preferredChoiceCount: [3, 4],
    temperature: 0.75,
  },
};
