import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

export interface OfficialCampaign {
  id: string;
  name: string;
  /** The first sentence of the world's description. */
  summary: string;
  /** Character creation for this world, where play starts. */
  playHref: string;
}

/** Every official (prebuilt) campaign. All of them are free to play, with or without an account. */
export const OFFICIAL_CAMPAIGNS: OfficialCampaign[] = PREBUILT_WORLDS.map((world) => ({
  id: world.id,
  name: world.name,
  summary: world.description.split(/(?<=[.!?])\s+/)[0] ?? world.description,
  playHref: `/create?worldId=${encodeURIComponent(world.id)}`,
}));

export const OFFICIAL_CAMPAIGN_COUNT = OFFICIAL_CAMPAIGNS.length;
