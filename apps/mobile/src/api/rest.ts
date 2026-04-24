import type { CampaignState } from "@audio-rpg/shared";
import { apiBaseUrl } from "./config";

export interface CreateCampaignResponse {
  campaignId: string;
  title: string;
  worldId: string;
  authToken: string;
  state: CampaignState;
}

export async function createCampaign(opts: {
  world?: "sunken_bell";
  characterName?: string;
}): Promise<CreateCampaignResponse> {
  const res = await fetch(`${apiBaseUrl()}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      world: opts.world ?? "sunken_bell",
      characterName: opts.characterName ?? "Wren",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create campaign: ${res.status}`);
  }
  return res.json() as Promise<CreateCampaignResponse>;
}
