"use client";

import { useEffect } from "react";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";

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

  useEffect(() => {
    narrate("Welcome to EchoQuest. Audio-first interactive storytelling with an AI Game Master.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const upgraded = new URLSearchParams(window.location.search).get("upgraded");
    if (upgraded === "true") {
      void fetch("/api/auth/refresh-tier", { method: "POST" });
      narrate("Your plan has been upgraded! Enjoy unlimited play.", "assertive");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
