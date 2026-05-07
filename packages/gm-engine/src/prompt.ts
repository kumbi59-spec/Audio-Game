import type { CampaignState, GameBible, PlayerInput } from "@audio-rpg/shared";
import { STYLE_PROFILES } from "./styles.js";
import type { MemoryBundle } from "./memory.js";
import { summarizeBibleForSystem, formatFactForPrompt } from "./memory.js";

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
      "actionable sentence the player can pick by voice (e.g. 'Ask Kael why he followed you'). " +
      "When continuity applies, labels should clearly signal follow-through on prior commitments, relationships, or quest threads.",
    "- `accepts_freeform` should default to true so the player can attempt custom actions.",
    "- `state_mutations` are the SINGLE source of truth for changes to inventory, quests, relationships, stats, flags, and codex. Never describe a state change in narration without also emitting the mutation.",
    "- `ruling_rationale` (optional, not narrated) briefly cites the rule or lore you applied when resolving a freeform action.",
    "- `memory_anchors_used` (optional, internal only and never narrated/shown to the player) may list concise references to the critical facts or retrieved memories that informed this turn.",
    "- `sound_cues` pick from the enumerated set. Use sparingly.",
    "- `narration_voice_plan` should tag NPC dialogue spans. When an NPC speaks dialogue, write it inline in the narration as `[NpcName]: \"their words here\"` (include the brackets and colon). Populate `narration_voice_plan` with an entry for each such span: `voice` = the NPC's name, `span` = [charStart, charEnd] of the full `[NpcName]: \"...\"` segment including brackets.",
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
    "## Memory usage contract",
    "- Before generating output, consult critical continuity facts and retrieved memories.",
    "- When narratively appropriate, explicitly integrate relevant prior events into narration and/or choice framing.",
    "- Do not contradict established relationship history, quest history, or prior commitments.",
    "",
    "## Experience & leveling",
    "Reward XP by emitting a `stat.adjust` mutation on `experience`. Guidance:",
    "- Exploring a new area or making a significant discovery: 25–75 XP",
    "- Defeating or outsmarting a foe: 50–200 XP (scale with danger)",
    "- Completing a quest objective: 100–300 XP",
    "- Completing a full quest: 200–500 XP",
    "The level system is handled automatically — just grant XP. Do not narrate a level-up directly; the game announces it. Do emit `stat.adjust` for `experience` whenever a milestone is reached.",
    "",
    "## Skill checks",
    "When the player attempts an action with meaningful risk and uncertainty, declare a `skill_check`.",
    "Set `stat` to the most relevant attribute and `dc` (difficulty class, 5–25) based on challenge:",
    "  strength: forcing, lifting, melee — dexterity: stealth, acrobatics, finesse",
    "  intelligence: puzzles, lore, investigation — charisma: persuasion, deception, performance",
    "  DC guide: trivial=5, easy=8, moderate=12, hard=16, very hard=20, near-impossible=24",
    "Set `label` to a short description (max 8 words, e.g. 'Slip through the guards undetected').",
    "The system resolves the roll (d20 + modifier) and stores it in `flags.last_skill_check`.",
    "On your NEXT turn, read `flags.last_skill_check` to narrate the outcome — do not decide success yourself.",
    "Do NOT declare a skill_check for routine actions or anything the player has already described succeeding at.",
    "",
    "## Choice quality rules",
    "- Always offer 3–4 choices unless `scene_ends` is true.",
    "- At least one choice must advance the active quest or main story thread.",
    "- If the player carries a relevant item, reference it by name in one choice label.",
    "- For risky actions that warrant a check, append '[STR check]', '[DEX check]', '[INT check]', or '[CHA check]' to the label.",
    "- Every label must be a complete, actionable sentence. Never repeat a choice from the previous turn.",
    "- Avoid vague non-choices ('Wait and see') unless waiting is genuinely tactically meaningful.",
    "",
    "## Achievements",
    "Emit `achievement.unlock` (with `key`, `title`, and `description`) the FIRST time each condition is met.",
    "Check `flags` and `achievements` in state to ensure you never emit the same key twice.",
    "Predefined achievement keys and their unlock conditions:",
    "  first_blood       — player defeats a foe for the first time",
    "  master_diplomat   — a relationship standing reaches +50 or above",
    "  nemesis_made      — a relationship standing drops to -50 or below",
    "  burden_of_riches  — inventory reaches 10 or more distinct items",
    "  quest_pioneer     — player completes their first quest",
    "  seasoned_hero     — character reaches level 5",
    "  legendary_hero    — character reaches level 10",
    "  lore_keeper       — 5 or more codex entries unlocked",
    "  polyglot          — meaningful dialogue with 5 or more distinct NPCs",
    "  second_chance     — character survives with HP at 1 or below and recovers",
    "  pack_rat          — inventory holds 15 or more items simultaneously",
    "  peacemaker        — hostile encounter resolved without violence",
    "  oath_keeper       — quest completed within 3 turns of accepting it",
    "  cartographer      — 8 or more distinct named scenes visited in one session",
    "  true_ending       — the campaign's final quest is completed",
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
      const standingStr = `${r.standing >= 0 ? "+" : ""}${r.standing}`;
      const lastTurn = r.last_interaction_turn != null ? ` (last: t${r.last_interaction_turn})` : "";
      const note = r.notes ? ` — ${r.notes}` : "";
      parts.push(`  - ${r.npc}: ${standingStr}${lastTurn}${note}`);
    }
  }
  if (state.achievements.length) {
    parts.push(`Unlocked achievements: ${state.achievements.map((a) => a.key).join(", ")}`);
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

  if (memory.criticalFacts.length) {
    parts.push("\n## Critical continuity facts");
    for (const fact of memory.criticalFacts.slice(0, 10)) {
      parts.push(`- [t${fact.turnNumber}] ${formatFactForPrompt(fact.text)}`);
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
