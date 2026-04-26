import { getUserPushTokens } from "./tokens";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

let vapidConfigured = false;
type WebPushLib = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload?: string,
  ) => Promise<unknown>;
};

let webPushLib: WebPushLib | null = null;

async function ensureVapid() {
  if (vapidConfigured) return;
  if (!webPushLib) {
    const mod = await import("web-push");
    webPushLib = (mod.default ?? mod) as WebPushLib;
  }
  const publicKey = process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:support@echoquest.app";
  if (!publicKey || !privateKey) return;
  webPushLib?.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

async function sendExpoNotifications(tokens: string[], payload: PushPayload): Promise<void> {
  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: { url: payload.url ?? "/" },
    sound: "default" as const,
  }));

  const chunks: (typeof messages)[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk),
    });
  }
}

async function sendWebPushNotification(
  endpoint: string,
  authJson: string,
  payload: PushPayload,
): Promise<void> {
  await ensureVapid();
  if (!vapidConfigured) return;

  const keys = JSON.parse(authJson) as { p256dh: string; auth: string };
  await webPushLib?.sendNotification(
    { endpoint, keys },
    JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/" }),
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const tokens = await getUserPushTokens(userId);
  if (tokens.length === 0) return;

  const expoTokens = tokens.filter((t) => t.type === "expo").map((t) => t.token);
  const webTokens = tokens.filter((t) => t.type === "web" && t.webAuth);

  const tasks: Promise<void>[] = [];

  if (expoTokens.length > 0) {
    tasks.push(sendExpoNotifications(expoTokens, payload).catch(console.error));
  }
  for (const t of webTokens) {
    tasks.push(sendWebPushNotification(t.token, t.webAuth!, payload).catch(console.error));
  }

  await Promise.allSettled(tasks);
}
