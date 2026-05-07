import type {
  AchievementEntry,
  CampaignState,
  InventoryItem,
  Quest,
  Relationship,
  StateMutation,
} from "@audio-rpg/shared";

/**
 * Deterministic reducer that applies GM-proposed mutations to canonical
 * campaign state. The model never owns inventory, quests, or relationships
 * directly — it proposes mutations, this applies them. Single source of
 * truth for "what does the player actually have right now".
 */
export function applyMutation(
  state: CampaignState,
  m: StateMutation,
): CampaignState {
  switch (m.op) {
    case "inventory.add":
      return { ...state, inventory: addItem(state.inventory, m) };
    case "inventory.remove":
      return { ...state, inventory: removeItem(state.inventory, m) };
    case "relationship.adjust":
      return { ...state, relationships: adjustRel(state.relationships, m, state.turn_number) };
    case "quest.start":
      return { ...state, quests: startQuest(state.quests, m) };
    case "quest.update":
      return { ...state, quests: updateQuest(state.quests, m) };
    case "quest.complete":
      return { ...state, quests: completeQuest(state.quests, m) };
    case "flag.set":
      return { ...state, flags: { ...state.flags, [m.key]: m.value } };
    case "codex.unlock":
      return {
        ...state,
        codex: state.codex.some((e) => e.key === m.key)
          ? state.codex
          : [
              ...state.codex,
              {
                key: m.key,
                title: m.title,
                body: m.body,
                unlocked_turn: state.turn_number,
              },
            ],
      };
    case "stat.adjust": {
      const current = state.character.stats[m.stat] ?? 0;
      const newValue = current + m.delta;
      let newStats = { ...state.character.stats, [m.stat]: newValue };

      if (m.stat === "experience") {
        const currentLevel = newStats["level"] ?? 1;
        const xpThreshold = currentLevel * currentLevel * 100;
        if (newValue >= xpThreshold) {
          const nextLevel = currentLevel + 1;
          newStats["level"] = nextLevel;
          const newMaxHp = (newStats["maxHp"] ?? 10) + 5;
          newStats["maxHp"] = newMaxHp;
          newStats["hp"] = Math.min((newStats["hp"] ?? 0) + 5, newMaxHp);
          // Alternate bonus: odd levels boost STR+DEX, even levels boost INT+CHA
          if (nextLevel % 2 !== 0) {
            newStats["strength"] = (newStats["strength"] ?? 10) + 1;
            newStats["dexterity"] = (newStats["dexterity"] ?? 10) + 1;
          } else {
            newStats["intelligence"] = (newStats["intelligence"] ?? 10) + 1;
            newStats["charisma"] = (newStats["charisma"] ?? 10) + 1;
          }
        }
      }

      return {
        ...state,
        character: { ...state.character, stats: newStats },
      };
    }
    case "scene.set":
      return {
        ...state,
        scene: { name: m.name, summary: m.summary ?? state.scene.summary },
      };
    case "achievement.unlock":
      return {
        ...state,
        achievements: unlockAchievement(state.achievements, m, state.turn_number),
      };
  }
}

export function applyMutations(
  state: CampaignState,
  mutations: readonly StateMutation[],
): CampaignState {
  return mutations.reduce<CampaignState>(applyMutation, state);
}

function addItem(
  inv: readonly InventoryItem[],
  m: Extract<StateMutation, { op: "inventory.add" }>,
): InventoryItem[] {
  const existing = inv.find((i) => i.name.toLowerCase() === m.item.toLowerCase());
  if (existing) {
    return inv.map((i) =>
      i === existing ? { ...i, quantity: i.quantity + m.quantity } : i,
    );
  }
  return [
    ...inv,
    {
      name: m.item,
      quantity: m.quantity,
      description: m.description,
      tags: m.tags ?? [],
    },
  ];
}

function removeItem(
  inv: readonly InventoryItem[],
  m: Extract<StateMutation, { op: "inventory.remove" }>,
): InventoryItem[] {
  return inv
    .map((i) =>
      i.name.toLowerCase() === m.item.toLowerCase()
        ? { ...i, quantity: Math.max(0, i.quantity - m.quantity) }
        : i,
    )
    .filter((i) => i.quantity > 0);
}

function adjustRel(
  rels: readonly Relationship[],
  m: Extract<StateMutation, { op: "relationship.adjust" }>,
  turnNumber: number,
): Relationship[] {
  const existing = rels.find((r) => r.npc.toLowerCase() === m.npc.toLowerCase());
  if (existing) {
    return rels.map((r) =>
      r === existing
        ? {
            ...r,
            standing: Math.max(-100, Math.min(100, r.standing + m.delta)),
            notes: m.note ?? r.notes,
            last_interaction_turn: turnNumber,
          }
        : r,
    );
  }
  return [
    ...rels,
    {
      npc: m.npc,
      standing: Math.max(-100, Math.min(100, m.delta)),
      notes: m.note,
      last_interaction_turn: turnNumber,
    },
  ];
}

function startQuest(
  quests: readonly Quest[],
  m: Extract<StateMutation, { op: "quest.start" }>,
): Quest[] {
  if (quests.some((q) => q.name === m.name)) return [...quests];
  return [
    ...quests,
    {
      name: m.name,
      status: "active",
      objectives: m.objectives.map((text) => ({ text, done: false })),
      log: [],
    },
  ];
}

function updateQuest(
  quests: readonly Quest[],
  m: Extract<StateMutation, { op: "quest.update" }>,
): Quest[] {
  return quests.map((q) =>
    q.name === m.name
      ? {
          ...q,
          objectives: q.objectives.map((o) =>
            o.text === m.objective ? { ...o, done: m.done } : o,
          ),
        }
      : q,
  );
}

function completeQuest(
  quests: readonly Quest[],
  m: Extract<StateMutation, { op: "quest.complete" }>,
): Quest[] {
  return quests.map((q) => {
    if (q.name !== m.name) return q;
    const openObjectives = q.objectives.filter((o) => !o.done);
    if (openObjectives.length > 0) {
      console.warn(JSON.stringify({
        event: "quest_complete_with_open_objectives",
        quest: m.name,
        openObjectives: openObjectives.map((o) => o.text),
      }));
    }
    return { ...q, status: "complete" };
  });
}

function unlockAchievement(
  achievements: readonly AchievementEntry[],
  m: Extract<StateMutation, { op: "achievement.unlock" }>,
  turnNumber: number,
): AchievementEntry[] {
  if (achievements.some((a) => a.key === m.key)) return [...achievements];
  return [
    ...achievements,
    { key: m.key, title: m.title, description: m.description, unlocked_turn: turnNumber },
  ];
}
