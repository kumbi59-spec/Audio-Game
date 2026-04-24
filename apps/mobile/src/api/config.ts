import { Platform } from "react-native";

/** Resolves the API base URL for each runtime. */
export function apiBaseUrl(): string {
  const envBase = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.["EXPO_PUBLIC_API_BASE_URL"];
  if (envBase) return envBase;
  if (Platform.OS === "android") return "http://10.0.2.2:4000";
  return "http://localhost:4000";
}

/** Same host, but ws(s) scheme. */
export function apiWebSocketUrl(path: string): string {
  const http = apiBaseUrl().replace(/\/$/, "");
  const ws = http.replace(/^http/, "ws");
  return `${ws}${path.startsWith("/") ? path : `/${path}`}`;
}
