export function selectChoice(choiceLabel: string): string {
  return choiceLabel.replace(/\s+/g, " ").trim();
}

export function normalizeChoiceList(choices: string[]): string[] {
  const seen = new Set<string>();
  const normalizedChoices: string[] = [];

  for (const choice of choices) {
    const normalizedChoice = selectChoice(choice);

    if (normalizedChoice.length === 0 || seen.has(normalizedChoice)) {
      continue;
    }

    seen.add(normalizedChoice);
    normalizedChoices.push(normalizedChoice);
  }

  return normalizedChoices;
}
