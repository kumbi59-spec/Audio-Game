import { useGameStore } from "@/store/game-store";
import type { CharacterData } from "@/types/character";
import type { InMemorySession, NarrationEntry } from "@/types/game";
import type { WorldData } from "@/types/world";

/** A game saved on the server, as listed by GET /api/game/session. */
export interface ServerSaveSummary {
  id: string;
  worldId: string;
  worldName: string;
  worldGenre: string;
  lastPlayedAt: string;
  turnCount: number;
}

/** The caller's saved games (signed-in account, or this browser's guest). */
export async function fetchServerSaves(): Promise<ServerSaveSummary[]> {
  const res = await fetch("/api/game/session");
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as ServerSaveSummary[]) : [];
}

interface ServerSavePayload {
  session: Omit<InMemorySession, "narrationLog"> & {
    narrationLog: Array<Omit<NarrationEntry, "timestamp"> & { timestamp: string }>;
  };
  character: CharacterData;
  world: WorldData;
}

export type LoadServerSaveResult = { ok: true } | { ok: false; message: string };

/**
 * Loads a server save into the game store as the current game, replacing
 * whatever was being played in this browser.
 */
export async function loadServerSave(sessionId: string): Promise<LoadServerSaveResult> {
  let res: Response;
  try {
    res = await fetch(`/api/game/session?sessionId=${encodeURIComponent(sessionId)}`);
  } catch {
    return { ok: false, message: "Couldn't reach the server to load that game." };
  }
  if (!res.ok) {
    return {
      ok: false,
      message: res.status === 404 ? "That saved game no longer exists." : "Couldn't load that saved game.",
    };
  }
  const data = (await res.json()) as ServerSavePayload;
  useGameStore.setState({
    session: {
      ...data.session,
      narrationLog: data.session.narrationLog.map((e) => ({ ...e, timestamp: new Date(e.timestamp) })),
      isGenerating: false,
    },
    character: data.character,
    world: data.world,
    dbSessionId: sessionId,
    previousTurn: null,
  });
  return { ok: true };
}
