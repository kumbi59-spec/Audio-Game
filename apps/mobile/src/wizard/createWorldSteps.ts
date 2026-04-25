import type { GameBible, StyleMode } from "@audio-rpg/shared";

/**
 * Audio-first Create World wizard. Each step is a single spoken question
 * with either freeform text or a small choice list. The wizard returns
 * a partial GameBible that is then submitted to POST /worlds (manual).
 */

export interface WizardStepFreeform {
  kind: "freeform";
  id: keyof Draft;
  prompt: string;
  helper?: string;
  required?: boolean;
}

export interface WizardStepChoice {
  kind: "choice";
  id: keyof Draft;
  prompt: string;
  options: { value: string; label: string }[];
}

export type WizardStep = WizardStepFreeform | WizardStepChoice;

export interface Draft {
  title: string;
  pitch: string;
  genre: string;
  setting: string;
  styleMode: StyleMode;
  contentRating: "family" | "teen" | "mature";
  toneVoice: string;
  hardConstraint: string;
  startingScenario: string;
  characterName: string;
}

export const EMPTY_DRAFT: Draft = {
  title: "",
  pitch: "",
  genre: "",
  setting: "",
  styleMode: "cinematic",
  contentRating: "teen",
  toneVoice: "",
  hardConstraint: "",
  startingScenario: "",
  characterName: "",
};

export const STEPS: WizardStep[] = [
  {
    kind: "freeform",
    id: "title",
    prompt: "What is the name of your world?",
    helper: "A short, evocative title.",
    required: true,
  },
  {
    kind: "freeform",
    id: "pitch",
    prompt: "Describe your world in one sentence.",
    helper: "Imagine a friend asking what kind of story this is.",
    required: true,
  },
  {
    kind: "freeform",
    id: "genre",
    prompt: "What genre is it?",
    helper: "Examples: dark fantasy, sci-fi noir, post-apocalyptic, cozy mystery.",
  },
  {
    kind: "freeform",
    id: "setting",
    prompt: "Where and when does it take place?",
    helper: "A region, era, or memorable location.",
  },
  {
    kind: "choice",
    id: "styleMode",
    prompt: "How should the game master run scenes?",
    options: [
      { value: "cinematic", label: "Cinematic and vivid" },
      { value: "rules_light", label: "Rules-light and breezy" },
      { value: "crunchy", label: "Crunchy with mechanics" },
      { value: "mystery", label: "Mystery — slow reveals" },
      { value: "horror", label: "Horror — dread and restraint" },
      { value: "political", label: "Political intrigue" },
      { value: "adventure", label: "Adventure — fast paced" },
    ],
  },
  {
    kind: "choice",
    id: "contentRating",
    prompt: "What content rating fits?",
    options: [
      { value: "family", label: "Family — safe for everyone" },
      { value: "teen", label: "Teen — some peril and conflict" },
      { value: "mature", label: "Mature — graphic content allowed" },
    ],
  },
  {
    kind: "freeform",
    id: "toneVoice",
    prompt: "Describe the narrator's tone in three words.",
    helper: "Examples: hushed and watchful, brash and witty, deliberate and dry.",
  },
  {
    kind: "freeform",
    id: "hardConstraint",
    prompt: "Name one hard rule of this world the game master must respect.",
    helper: "Examples: no firearms, magic always costs blood, the dead never speak.",
  },
  {
    kind: "freeform",
    id: "startingScenario",
    prompt: "Describe the opening scene in one or two sentences.",
    required: true,
  },
  {
    kind: "freeform",
    id: "characterName",
    prompt: "Finally — what is your character's name?",
    required: true,
  },
];

export function draftToBible(draft: Draft): GameBible {
  const pitch = draft.pitch.trim();
  const genre = draft.genre.trim();
  const setting = draft.setting.trim();
  const toneVoice = draft.toneVoice.trim();
  const constraint = draft.hardConstraint.trim();
  const opening = draft.startingScenario.trim();

  return {
    version: 1,
    title: draft.title.trim(),
    ...(pitch ? { pitch } : {}),
    ...(genre ? { genre } : {}),
    ...(setting ? { setting } : {}),
    style_mode: draft.styleMode,
    tone: {
      ...(toneVoice ? { voice: toneVoice } : {}),
      content_rating: draft.contentRating,
      forbidden_topics: [],
    },
    rules: {
      hard_constraints: constraint ? [constraint] : [],
    },
    entities: [],
    timeline: [],
    character_creation: {
      origins: [],
      classes: [],
      stats: [],
      starting_items: [],
    },
    ...(opening ? { starting_scenario: opening } : {}),
    win_states: [],
    fail_states: [],
  };
}
