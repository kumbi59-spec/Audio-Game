import { AUTUMN_2026_A } from "./2026-autumn-a";
import { AUTUMN_2026_B } from "./2026-autumn-b";
import { AUTUMN_2026_C } from "./2026-autumn-c";
import type { ScheduledSeedPost } from "./types";

export { scheduledPublishDate } from "./types";
export type { ScheduledSeedPost } from "./types";

/** SEO series released one post per day, 24 Sep – 23 Oct 2026. */
export const SCHEDULED_SEED_POSTS: ScheduledSeedPost[] = [
  ...AUTUMN_2026_A,
  ...AUTUMN_2026_B,
  ...AUTUMN_2026_C,
];
