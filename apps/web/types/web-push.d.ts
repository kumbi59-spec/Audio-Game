declare module "web-push" {
  interface SubscriptionKeys {
    p256dh: string;
    auth: string;
  }

  interface PushSubscription {
    endpoint: string;
    keys: SubscriptionKeys;
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(subscription: PushSubscription, payload?: string): Promise<unknown>;

  const api: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
  };

  export default api;
  export { setVapidDetails, sendNotification };
}
