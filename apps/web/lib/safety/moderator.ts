const HARD_BLOCK: RegExp[] = [
  /(how to (make|build|create|synthesize) (a |)(bomb|explosive|bioweapon|chemical weapon))/i,
  /(suicide|self.harm) (method|instruction|how.to|step)/i,
  /(sexual|nude|explicit|pornograph).{0,30}(child|minor|underage|kid)/i,
  /(child|minor|underage|kid).{0,30}(sexual|nude|explicit|pornograph)/i,
];

const JAILBREAK: RegExp[] = [
  /ignore (all |your |previous |any )?(instructions|directives|rules)/i,
  /pretend (you are|to be) (a |an )?(different|evil|unfiltered|unrestricted)/i,
  /you are now (an?|the) .{0,40}(AI|model|assistant|GPT|Claude)/i,
  /(developer|jailbreak|DAN|god) mode/i,
  /disregard (your|all|the) (guidelines|rules|instructions|training)/i,
  /\[INST\]|\[\/INST\]|<\|system\|>|<\|im_start\|>/i,
  /forget (everything|all|your) (you|I|we) (said|told|taught)/i,
];

export type ModerationResult = { safe: true } | { safe: false; reason: "hard_block" | "jailbreak" };

export function moderatePlayerInput(text: string): ModerationResult {
  for (const re of HARD_BLOCK) {
    if (re.test(text)) return { safe: false, reason: "hard_block" };
  }
  for (const re of JAILBREAK) {
    if (re.test(text)) return { safe: false, reason: "jailbreak" };
  }
  return { safe: true };
}

export function moderateGMOutput(text: string): ModerationResult {
  for (const re of HARD_BLOCK) {
    if (re.test(text)) return { safe: false, reason: "hard_block" };
  }
  return { safe: true };
}

export const SAFETY_FALLBACK =
  "The ancient magic swirls unpredictably. Something about your action disrupts the flow of the story — perhaps try a different approach.";
