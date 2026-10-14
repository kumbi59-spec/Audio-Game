// Shared by the contact page and POST /api/contact. No server imports, so
// the page can use it.

export const CONTACT_TOPICS = ["Bug report", "Having a problem", "Suggestion"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MAX_CONTACT_MESSAGE_CHARS = 5_000;
