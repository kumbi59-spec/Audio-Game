import { describe, expect, it } from "vitest";
import { APPROVED_ANTHROPIC_MODELS, modelRequestParams } from "./model-policy.js";

describe("model policy", () => {
  it("approves Claude Sonnet 5.5 and keeps Sonnet 4.6 for rollback", () => {
    expect(APPROVED_ANTHROPIC_MODELS).toContain("claude-sonnet-5-5");
    expect(APPROVED_ANTHROPIC_MODELS).toContain("claude-sonnet-4-6");
  });

  it("never sends a temperature to Sonnet 5.5, and turns its thinking off", () => {
    expect(modelRequestParams("claude-sonnet-5-5", 0.7)).toEqual({
      thinking: { type: "between_tools" },
      output_config: { effort: "high" },
    });
  });

  it("keeps the style temperature on older models", () => {
    expect(modelRequestParams("claude-sonnet-4-6", 0.7)).toEqual({ temperature: 0.7 });
    expect(modelRequestParams("claude-haiku-4-5-20251001")).toEqual({});
  });
});
