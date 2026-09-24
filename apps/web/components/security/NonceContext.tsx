"use client";

import { createContext, useContext, type ReactNode } from "react";

/** The page's CSP nonce, for client components that render <script> markup. */
const NonceContext = createContext<string | undefined>(undefined);

export function NonceProvider({ nonce, children }: { nonce: string | undefined; children: ReactNode }) {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}

export function useNonce(): string | undefined {
  return useContext(NonceContext);
}

/** ` nonce="…"` for script tags built as HTML strings, or "" without a nonce. */
export function nonceAttr(nonce: string | undefined): string {
  return nonce ? ` nonce="${nonce.replace(/[^A-Za-z0-9+/=]/g, "")}"` : "";
}
