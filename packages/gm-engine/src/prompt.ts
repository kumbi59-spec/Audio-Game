import type { CampaignState, GameBible, PlayerInput } from "@audio-rpg/shared";
import { STYLE_PROFILES } from "./styles.js";
import type { MemoryBundle } from "./memory.js";
import { summarizeBibleForSystem } from "./memory.js";

/**
 * The system prompt is the primary cacheable block (Bible + style +
 * invariant instructions). It should be identical across turns of a
 * campaign so prompt caching can amortize its cost.
 */
export function buildSystemPrompt(bible: GameBible): string {
  const style = STYLE_PROFILES[bible.style_mode];
  const [minChoices, maxChoices] = style.preferredChoiceCount;

  return [
    "You are the AI Game Master for an accessibility-first audio RPG.",
    "This experience is designed for blind and low-vision players, so your output must be clear, structured, and friendly to screen readers and TTS.",
    "",
    "## Output contract",
    "You MUST return exactly one JSON object matching the GmTurn schema. No prose outside JSON.",
    "- `narration` is the single block of text that will be spoken aloud. Keep paragraphs short. Never exceed 220 words.",
    "- `presented_choices` should usually have " +
      `${minChoices}–${maxChoices} options. Each label must be a complete, ` +
      "actionable sentence the player can pick by voice (e.g. 'Ask Kael why he followed you').",
    "- `accepts_freeform` should default to true so the player can attempt custom actions.",
    "- `state_mutations` are the SINGLE source of truth for changes to inventory, quests, relationships, stats, flags, and codex. Never describe a state change in narration without also emitting the mutation.",
    "- `ruling_rationale` (optional, not narrated) briefly cites the rule or lore you applied when resolving a freeform action.",
    "- `sound_cues` pick from the enumerated set. Use sparingly.",
    "- `narration_voice_plan` may assign spans of narration to distinct voice ids (e.g. narrator, or an NPC name) for multi-voice TTS.",
    "",
    "## Accessibility-first narration rules",
    "- Never rely on visual layout. Describe what matters through sound, smell, touch, and action.",
    "- Avoid dense walls of text. Prefer 2–4 short paragraphs.",
    "- At the end of narration, do NOT list the choices in prose — the client will read them separately.",
    "- When describing the environment, name sounds and spatial cues first ('to your left, the dripping'; 'somewhere above, a bell').",
    "",
    "## Continuity rules",
    "- Treat the provided CampaignState as ground truth. Do not invent inventory items or relationships that are not there.",
    "- Respect the World Bible's hard_constraints and forbidden_topics at all times.",
    "- Preserve established tone and named characters exactly.",
    "",
    "## Style directive",
    style.directive,
    "",
    "## World Bible",
    summarizeBibleForSystem(bible),
  ].join("\n");
}

/**
 * The user-turn prompt contains only the dynamic, non-cacheable tail:
 * current state, retrieved memories, and the player's latest input.
 */
export function buildTurnUserPrompt(opts: {
  state: CampaignState;
  memory: MemoryBundle;
  input: PlayerInput;
  presentedChoices?: { id: string; label: string }[];
}): string {
  const { state, memory, input, presentedChoices } = opts;
  const parts: string[] = [];

  parts.push("## Current campaign state");
  parts.push(`Scene: ${state.scene.name}`);
  if (state.scene.summary) parts.push(`Scene summary: ${state.scene.summary}`);
  parts.push(`Turn number: ${state.turn_number}`);
  parts.push(`Character: ${state.character.name}`);
  if (state.character.pronouns) parts.push(`Pronouns: ${state.character.pronouns}`);
  if (Object.keys(state.character.stats).length) {
    parts.push(`Stats: ${JSON.stringify(state.character.stats)}`);
  }
  if (state.inventory.length) {
    parts.push("Inventory:");
    for (const i of state.inventory) parts.push(`  - ${i.name} x${i.quantity}`);
  }
  const activeQuests = state.quests.filter((q) => q.status === "active");
  if (activeQuests.length) {
    parts.push("Active quests:");
    for (const q of activeQuests) {
      const open = q.objectives.filter((o) => !o.done).map((o) => o.text);
      parts.push(`  - ${q.name}${open.length ? ` — next: ${open[0]}` : ""}`);
    }
  }
  if (state.relationships.length) {
    parts.push("Relationships:");
    for (const r of state.relationships) {
      parts.push(`  - ${r.npc}: ${r.standing >= 0 ? "+" : ""}${r.standing}`);
    }
  }
  const flagKeys = Object.keys(state.flags);
  if (flagKeys.length) {
    parts.push(`Flags: ${JSON.stringify(state.flags)}`);
  }

  if (memory.scenes.length) {
    parts.push("\n## Recent scene summaries");
    for (const s of memory.scenes.slice(-3)) {
      parts.push(`Scene ${s.sceneNumber}: ${s.summary}`);
    }
  }

  if (memory.recent.length) {
    parts.push("\n## Last turns");
    for (const t of memory.recent) {
      parts.push(`[${t.role} t${t.turnNumber}] ${t.text}`);
    }
  }

  if (memory.retrieved.length) {
    parts.push("\n## Retrieved memories");
    for (const t of memory.retrieved) {
      parts.push(`[t${t.turnNumber}] ${t.text}`);
    }
  }

  if (memory.bibleHits.length) {
    parts.push("\n## Relevant world lore");
    for (const b of memory.bibleHits) {
      parts.push(`- (${b.categories.join(",")}) ${b.text}`);
    }
  }

  parts.push("\n## Player input");
  switch (input.kind) {
    case "choice": {
      const picked = presentedChoices?.find((c) => c.id === input.choiceId);
      parts.push(
        picked
          ? `Player picked choice: "${picked.label}"`
          : `Player picked choice id: ${input.choiceId}`,
      );
      break;
    }
    case "freeform":
      parts.push(`Player attempts a custom action: "${input.text}"`);
      parts.push(
        "Resolve it fairly using the world's rules and tone. If the action violates hard_constraints or forbidden_topics, redirect gracefully without breaking immersion.",
      );
      break;
    case "utility":
      parts.push(`Utility command: ${input.command}`);
      break;
  }

  parts.push("\nReturn the next GmTurn JSON.");
  return parts.join("\n");
}
