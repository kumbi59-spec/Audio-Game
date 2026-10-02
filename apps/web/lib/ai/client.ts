import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    });
  }
  return _client;
}

// The web game's GM model. Its own variable, separate from CLAUDE_GM_MODEL,
// which the api service validates against its own allowlist.
export const MODEL = process.env["CLAUDE_WEB_GM_MODEL"] || "claude-sonnet-5-5";

/**
 * Model-specific request settings for every Claude call that uses MODEL.
 * Claude Sonnet 5.5 thinks before replying by default, which delays the
 * first token and spends max_tokens on thinking; these calls write short
 * structured replies, so they run with no extended thinking
 * ("between_tools", the model's lowest thinking setting). Other models get
 * the API defaults, so overriding CLAUDE_WEB_GM_MODEL can't send a field
 * they reject.
 */
export function modelParams(model: string = MODEL): {
  thinking?: Anthropic.ThinkingConfigParam;
  output_config?: Anthropic.OutputConfig;
} {
  if (model === "claude-sonnet-5-5") {
    return {
      // Not yet in this SDK version's ThinkingConfigParam union.
      thinking: { type: "between_tools" } as unknown as Anthropic.ThinkingConfigParam,
      output_config: { effort: "high" },
    };
  }
  return {};
}
// A ceiling, not a target — billing is for the tokens actually generated. At
// 1024 the JSON reply (narration + choices + stateChanges + codex) was often
// cut off, which lost that turn's state changes to the parse fallback.
export const MAX_TOKENS = 4096;

/**
 * The reply's text. Read by block type, never as content[0]: a reply can
 * open with a thinking block.
 */
export function messageText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export type ProviderErrorClass =
  | "timeout"
  | "rate_limit"
  | "safety_refusal"
  | "malformed_output"
  | "network_failure"
  | "provider_error";

export function classifyProviderError(error: unknown): ProviderErrorClass {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (error instanceof Anthropic.RateLimitError) return "rate_limit";
  if (error instanceof Anthropic.APIConnectionError) return "network_failure";

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("timeout") || message.includes("timed out")) return "timeout";
  if (message.includes("rate limit") || message.includes("429")) return "rate_limit";
  if (message.includes("safety") || message.includes("refus")) return "safety_refusal";
  if (message.includes("json") || message.includes("malformed")) return "malformed_output";
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("econn") ||
    message.includes("enotfound")
  ) {
    return "network_failure";
  }
  return "provider_error";
}

/**
 * Whether retrying the same request could succeed. Client errors (bad
 * request, auth, permission, not found) fail identically on every attempt.
 */
export function isRetryableProviderError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError && typeof error.status === "number") {
    return error.status === 408 || error.status === 409 || error.status === 429 || error.status >= 500;
  }
  return true;
}
