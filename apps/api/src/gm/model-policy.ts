import { config } from "../config.js";

export const APPROVED_ANTHROPIC_MODELS = [
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
] as const;

type ApprovedModel = (typeof APPROVED_ANTHROPIC_MODELS)[number];

export interface ModelPolicy {
  gmTurnModel: ApprovedModel;
  summaryModel: ApprovedModel;
}

function isApprovedModel(value: string): value is ApprovedModel {
  return (APPROVED_ANTHROPIC_MODELS as readonly string[]).includes(value);
}

export function resolveModelPolicy(): ModelPolicy {
  const gmTurnModel = config.CLAUDE_GM_MODEL;
  const summaryModel = config.CLAUDE_SUMMARY_MODEL;

  if (!isApprovedModel(gmTurnModel)) {
    throw new Error(`CLAUDE_GM_MODEL is not approved: ${gmTurnModel}`);
  }
  if (!isApprovedModel(summaryModel)) {
    throw new Error(`CLAUDE_SUMMARY_MODEL is not approved: ${summaryModel}`);
  }

  return { gmTurnModel, summaryModel };
}
