export interface DiscussionComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface DiscussionThread {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  comments: DiscussionComment[];
}

// In-memory store — persists for the server process lifetime.
// A future PR can migrate this to a database table.
export const threads: DiscussionThread[] = [
  {
    id: "best-audio-rpg-builds-2026",
    title: "Best Audio RPG Character Builds in 2026 (Screen Reader Friendly)",
    body: "Share your strongest and most accessible character builds for voice-first campaigns.",
    author: "EchoQuest Team",
    createdAt: "2026-01-01T00:00:00.000Z",
    comments: [
      { id: "c1", text: "My best build is high charisma + stealth for puzzle-heavy worlds.", author: "player1", createdAt: "2026-01-02T00:00:00.000Z" },
    ],
  },
  {
    id: "how-to-master-voice-text-adventure",
    title: "How to Master Voice Text Adventure Games: Beginner to Pro Guide",
    body: "Post your tips for faster command phrasing, better narration recaps, and smarter combat choices.",
    author: "EchoQuest Team",
    createdAt: "2026-01-01T00:00:00.000Z",
    comments: [
      { id: "c2", text: "Using short intent statements improved my turns a lot.", author: "player2", createdAt: "2026-01-02T00:00:00.000Z" },
    ],
  },
];
