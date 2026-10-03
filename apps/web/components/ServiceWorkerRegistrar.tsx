"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production builds, with the build id so
 * each deploy gets its own cache. In development, where chunk names aren't
 * content-hashed, a cache-first worker serves stale code, so any worker left
 * over from an earlier production visit is removed instead.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
        .catch(() => undefined);
      return;
    }
    const build = encodeURIComponent(process.env.NEXT_PUBLIC_BUILD_ID ?? "dev");
    navigator.serviceWorker.register(`/sw.js?v=${build}`, { scope: "/" }).catch(() => undefined);
  }, []);

  return null;
}
