"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type PushState = "unsupported" | "denied" | "granted" | "default" | "loading";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

async function getVapidKey(): Promise<string | null> {
  try {
    const r = await fetch("/api/push/vapid-public-key");
    if (!r.ok) return null;
    const { key } = (await r.json()) as { key?: string };
    return key ?? null;
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  const { data: session } = useSession();
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as PushState);
  }, []);

  async function subscribe(): Promise<boolean> {
    if (!session?.user) return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    const permission = await Notification.requestPermission();
    setState(permission as PushState);
    if (permission !== "granted") return false;

    const vapidKey = await getVapidKey();
    if (!vapidKey) return false;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const json = sub.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
    if (!json.keys) return false;

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "web", endpoint: json.endpoint, keys: json.keys }),
    });

    setState("granted");
    return true;
  }

  async function unsubscribe(): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: sub.endpoint }),
    });
    await sub.unsubscribe();
    setState("default");
  }

  return { state, subscribe, unsubscribe };
}
