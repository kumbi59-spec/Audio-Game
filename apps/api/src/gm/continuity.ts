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
    if (f.includes("quest_complete|") && /quest|mission|job/.test(low) && /still|not yet|unfinished|pending/.test(low)) {
      contradictionFlags.push(`quest_status:${fact}`);
    }
    if (f.includes("condition_state|") && f.endsWith("|true") && /healthy|fully recovered|unharmed/.test(low)) {
      contradictionFlags.push(`condition_status:${fact}`);
    }
    if (f.includes("irreversible_loss|") && /returns|restored|alive again|rebuilt/.test(low)) {
      contradictionFlags.push(`irreversible_loss:${fact}`);
    }
    if ((f.includes("oath_or_debt_created|") || f.includes("condition_state|")) && !low.includes(f.split("|")[1] ?? "")) {
      omissionFlags.push(`anchor_unmentioned:${fact}`);
    }
  }
  return { contradictionFlags, omissionFlags };
}

