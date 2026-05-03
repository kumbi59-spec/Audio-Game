export const SessionStates = [
  "disconnected",
  "connected",
  "joined",
  "awaiting_gm",
  "awaiting_recap",
  "turn_complete",
  "closed",
] as const;

export type SessionState = (typeof SessionStates)[number];

export const SessionTriggers = [
  "socket_opened",
  "join",
  "player_input",
  "turn_completed",
  "turn_failed",
  "request_recap",
  "recap_completed",
  "pause",
  "leave",
  "socket_closed",
  "join_failed",
] as const;

export type SessionTrigger = (typeof SessionTriggers)[number];

export type SessionTransitionEvent = {
  trigger: SessionTrigger;
  from: SessionState;
};

export interface TransitionFailure {
  ok: false;
  from: SessionState;
  to: SessionState;
  trigger: SessionTrigger;
  reason:
    | "invalid_transition"
    | "already_terminal"
    | "state_mismatch";
}

export interface TransitionSuccess {
  ok: true;
  from: SessionState;
  to: SessionState;
  trigger: SessionTrigger;
}

export type TransitionResult = TransitionSuccess | TransitionFailure;

const allowed: Record<SessionState, ReadonlyArray<SessionState>> = {
  disconnected: ["connected"],
  connected: ["joined", "closed"],
  joined: ["awaiting_gm", "awaiting_recap", "closed"],
  awaiting_gm: ["turn_complete", "joined", "closed"],
  awaiting_recap: ["joined", "turn_complete", "closed"],
  turn_complete: ["awaiting_gm", "awaiting_recap", "closed"],
  closed: [],
};

const transitionsByTrigger: Record<SessionTrigger, SessionState> = {
  socket_opened: "connected",
  join: "joined",
  player_input: "awaiting_gm",
  turn_completed: "turn_complete",
  turn_failed: "joined",
  request_recap: "awaiting_recap",
  recap_completed: "joined",
  pause: "closed",
  leave: "closed",
  socket_closed: "closed",
  join_failed: "closed",
};

export function canTransition(from: SessionState, to: SessionState): boolean {
  return from === to || allowed[from].includes(to);
}

export function nextStateForTrigger(trigger: SessionTrigger): SessionState {
  return transitionsByTrigger[trigger];
}

export function transitionSession(event: SessionTransitionEvent): TransitionResult {
  const to = nextStateForTrigger(event.trigger);
  if (event.from === "closed") {
    return { ok: false, from: event.from, to, trigger: event.trigger, reason: "already_terminal" };
  }
  if (!canTransition(event.from, to)) {
    return { ok: false, from: event.from, to, trigger: event.trigger, reason: "invalid_transition" };
  }
  return { ok: true, from: event.from, to, trigger: event.trigger };
}
