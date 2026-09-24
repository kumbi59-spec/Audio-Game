/**
 * Creates a multiplayer lobby on the server and returns the host's lobby URL
 * (including the invite code the lobby page shares with other players).
 */
export async function createLobbyPath(): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  try {
    const res = await fetch("/api/game/lobbies", { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as {
      lobbyId?: string;
      inviteCode?: string;
      error?: string;
    };
    if (!res.ok || !body.lobbyId || !body.inviteCode) {
      return { ok: false, message: body.error ?? "Could not create a multiplayer lobby. Please try again." };
    }
    return {
      ok: true,
      path: `/campaign/${encodeURIComponent(body.lobbyId)}/lobby?invite=${encodeURIComponent(body.inviteCode)}`,
    };
  } catch {
    return { ok: false, message: "Could not create a multiplayer lobby. Check your connection and try again." };
  }
}
