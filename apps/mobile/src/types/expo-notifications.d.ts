declare module "expo-notifications" {
  export type PermissionStatus = "undetermined" | "denied" | "granted";

  export interface NotificationResponse {
    notification: {
      request: {
        content: {
          data?: Record<string, unknown>;
        };
      };
    };
    actionIdentifier: string;
  }

  export interface ExpoPushToken {
    data: string;
    type?: string;
  }

  export interface Subscription {
    remove(): void;
  }

  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner?: boolean;
      shouldShowList?: boolean;
    }>;
  }): void;

  export function getPermissionsAsync(): Promise<{ status: PermissionStatus }>;
  export function requestPermissionsAsync(): Promise<{ status: PermissionStatus }>;
  export function getExpoPushTokenAsync(): Promise<ExpoPushToken>;
  export function addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void,
  ): Subscription;
}
