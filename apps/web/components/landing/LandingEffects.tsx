"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Tier } from "@audio-rpg/shared";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useEntitlementsStore } from "@/store/entitlements-store";

/**
 * Client-side side effects for the landing page:
 * - announces a welcome message via TTS / live region on mount
 * - if the URL contains ?upgraded=true (post-Stripe checkout), refreshes
 *   the user's tier and announces the upgrade.
 *
 * Rendered as a leaf inside the server-rendered landing page so the bulk
 * of the marketing HTML ships in the initial response.
 */
export function LandingEffects() {
  const { narrate } = useAnnouncer();
  const { update } = useSession();
  const setTier = useEntitlementsStore((s) => s.setTier);

  useEffect(() => {
    narrate("Welcome to EchoQuest. Audio-first interactive storytelling with an AI Game Master.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const upgraded = new URLSearchParams(window.location.search).get("upgraded");
    if (upgraded !== "true") return;
    // update() with a payload makes the session re-read the tier from the
    // database (a bare update() keeps the token's cached one). The webhook can
    // land after the redirect back, so only a paid tier counts as done.
    void update({})
      .then((fresh) => {
        if (!fresh) return;
        const tier = (fresh.user as { tier?: Tier } | undefined)?.tier;
        if (tier && tier !== "free") {
          setTier(tier);
          narrate("Your plan has been upgraded! Enjoy unlimited play.", "assertive");
        } else {
          narrate("Thanks! Your payment is still being confirmed. Your plan will update shortly.");
        }
      })
      .catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
