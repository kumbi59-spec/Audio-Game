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

export const MODEL = "claude-sonnet-4-6";
export const MAX_TOKENS = 1024;

export type ProviderErrorClass =
  | "timeout"
  | "rate_limit"
  | "safety_refusal"
  | "malformed_output"
  | "network_failure"
  | "provider_error";

export function classifyProviderError(error: unknown): ProviderErrorClass {
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
