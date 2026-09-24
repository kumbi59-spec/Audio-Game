"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether the server wrote Adsterra scripts into this page's HTML (free tier,
 * decided from the session). Client ad components use it to render markup
 * that matches the server HTML.
 */
const AdsServerContext = createContext(false);

export function AdsServerProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <AdsServerContext.Provider value={value}>{children}</AdsServerContext.Provider>;
}

export function useServerShowsAds(): boolean {
  return useContext(AdsServerContext);
}
