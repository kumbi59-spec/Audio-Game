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
