export const SessionStates = [
  "disconnected",
  "connected",
  "joined",
  "awaiting_gm",
  "turn_complete",
  "closed",
] as const;

export type SessionState = (typeof SessionStates)[number];

export function canTransition(from: SessionState, to: SessionState): boolean {
  if (from === to) return true;
  const allowed: Record<SessionState, SessionState[]> = {
    disconnected: ["connected"],
    connected: ["joined", "closed"],
    joined: ["awaiting_gm", "closed"],
    awaiting_gm: ["turn_complete", "closed"],
    turn_complete: ["awaiting_gm", "closed"],
    closed: [],
  };
  return allowed[from].includes(to);
}
