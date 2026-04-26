/**
 * Web stub — expo-notifications has no web implementation and importing it on
 * web crashes with "LegacyEventEmitter is not a constructor".
 * Metro resolves .web.ts before .ts when bundling for web, so this file
 * completely replaces the native version for the web export.
 */

export async function registerForPushNotifications(_authToken: string): Promise<string | null> {
  return null;
}

export function addNotificationResponseListener(
  _handler: (response: unknown) => void,
): { remove: () => void } {
  return { remove: () => undefined };
}
