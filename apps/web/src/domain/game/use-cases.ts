export function selectChoice(choiceLabel: string): string {
  return choiceLabel.replace(/\s+/g, " ").trim();
}

export function normalizeChoiceList(choices: string[]): string[] {
  return choices
    .map(selectChoice)
    .filter((choice, index, arr) => choice.length > 0 && arr.indexOf(choice) === index);
}
