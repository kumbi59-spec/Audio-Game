import { deletePushTokens, getUserPushTokens } from "./tokens";

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

  const unregistered: string[] = [];
  for (const chunk of chunks) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk),
    });
    // One ticket per message, in order. DeviceNotRegistered means the app
    // was uninstalled or the token expired, so it will never deliver again.
    const tickets = ((await res.json().catch(() => null)) as {
      data?: Array<{ status?: string; details?: { error?: string } }>;
    } | null)?.data;
    if (!Array.isArray(tickets)) continue;
    tickets.forEach((ticket, i) => {
      const to = chunk[i]?.to;
      if (to && ticket?.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        unregistered.push(to);
      }
    });
  }
  await deletePushTokens(unregistered);
}

async function sendWebPushNotification(
  endpoint: string,
  authJson: string,
  payload: PushPayload,
): Promise<void> {
  await ensureVapid();
  if (!vapidConfigured) return;

  const keys = JSON.parse(authJson) as { p256dh: string; auth: string };
  try {
    await webPushLib?.sendNotification(
      { endpoint, keys },
      JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/" }),
    );
  } catch (err) {
    // 404/410 from the push service: the subscription is gone for good.
    const statusCode = (err as { statusCode?: unknown } | null)?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await deletePushTokens([endpoint]);
      return;
    }
    throw err;
  }
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
