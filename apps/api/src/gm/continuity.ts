export interface ContinuityHeuristicResult {
  contradictionFlags: string[];
  omissionFlags: string[];
}

export function continuityHeuristics(memoryFacts: string[], narration: string): ContinuityHeuristicResult {
  const low = narration.toLowerCase();
  const contradictionFlags: string[] = [];
  const omissionFlags: string[] = [];
  for (const fact of memoryFacts) {
    const f = fact.toLowerCase();
    // A cleared condition (cured poison, healed wound) is no longer an anchor.
    if (f.includes("condition_state|") && /\|(?:false|0)$/.test(f)) continue;
    if (f.includes("quest_complete|") && /quest|mission|job/.test(low) && /still|not yet|unfinished|pending/.test(low)) {
      contradictionFlags.push(`quest_status:${fact}`);
    }
    if (f.includes("condition_state|") && f.endsWith("|true") && /healthy|fully recovered|unharmed/.test(low)) {
      contradictionFlags.push(`condition_status:${fact}`);
    }
    if (f.includes("irreversible_loss|") && /returns|restored|alive again|rebuilt/.test(low)) {
      contradictionFlags.push(`irreversible_loss:${fact}`);
    }
    // Keys are snake_case ("oath_to_mara"); narration says "oath to mara".
    const anchorKey = (f.split("|")[1] ?? "").replace(/_/g, " ");
    if ((f.includes("oath_or_debt_created|") || f.includes("condition_state|")) && !low.includes(anchorKey)) {
      omissionFlags.push(`anchor_unmentioned:${fact}`);
    }
    if (f.includes("item_loss|")) {
      const parts = f.split("|");
      const itemName = (parts[1] ?? "").replace(/_/g, " ");
      if (itemName.length >= 2 && low.includes(itemName) && /\b(use|draw|wield|throw|consume|equip)\b/.test(low)) {
        contradictionFlags.push(`item_loss_used:${fact}`);
      }
    }
    if (f.includes("irreversible_loss|")) {
      const rawKey = (f.split("|")[1] ?? "").replace(/^(?:dead_|killed_)/, "").replace(/_/g, " ");
      if (rawKey.length >= 2 && low.includes(rawKey) && /\b(says|tells|offers|appears|walks|enters|hands|asks)\b/.test(low)) {
        contradictionFlags.push(`dead_npc_active:${fact}`);
      }
    }
  }
  return { contradictionFlags, omissionFlags };
}

