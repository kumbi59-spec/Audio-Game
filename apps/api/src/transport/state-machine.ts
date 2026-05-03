import { SessionStates, SessionTriggers, type SessionState, type SessionTrigger } from "@audio-rpg/shared";

export const TransportStates = SessionStates;
export const TransportEvents = SessionTriggers;

export type TransportGuardFailureReason =
  | "invalid_transition"
  | "already_terminal"
  | "state_mismatch"
  | "missing_prerequisite"
  | "timeout"
  | "incompatible_transport_version";

export interface TransportGuardContext {
  hasSession?: boolean;
  requestTimedOut?: boolean;
  transportVersionSupported?: boolean;
}

export interface TransportTransitionEvent {
  from: SessionState;
  trigger: SessionTrigger;
  context?: TransportGuardContext;
}

export interface TransportTransitionAllowed {
  ok: true;
  from: SessionState;
  to: SessionState;
  trigger: SessionTrigger;
}

export interface TransportTransitionBlocked {
  ok: false;
  from: SessionState;
  to: SessionState;
  trigger: SessionTrigger;
  reason: TransportGuardFailureReason;
}

export type TransportTransitionResult = TransportTransitionAllowed | TransportTransitionBlocked;

const transitionsByEvent: Record<SessionTrigger, SessionState> = {
  socket_opened: "connected",
  join: "joined",
  player_input: "awaiting_gm",
  turn_completed: "turn_complete",
  turn_failed: "joined",
  request_recap: "awaiting_recap",
  recap_completed: "joined",
  recap_completed_to_turn_complete: "turn_complete",
  pause: "closed",
  leave: "closed",
  socket_closed: "closed",
  join_failed: "closed",
};

const allowedTransitions: Record<SessionState, ReadonlySet<SessionState>> = {
  disconnected: new Set(["connected"]),
  connected: new Set(["joined", "closed"]),
  joined: new Set(["awaiting_gm", "awaiting_recap", "closed"]),
  awaiting_gm: new Set(["turn_complete", "joined", "closed"]),
  awaiting_recap: new Set(["joined", "turn_complete", "closed"]),
  turn_complete: new Set(["awaiting_gm", "awaiting_recap", "closed"]),
  closed: new Set(),
};

export function nextStateForTransportEvent(trigger: SessionTrigger): SessionState {
  return transitionsByEvent[trigger];
}

export function evaluateTransportTransition(
  event: TransportTransitionEvent,
): TransportTransitionResult {
  const to = nextStateForTransportEvent(event.trigger);
  const context = event.context ?? {};

  if (context.transportVersionSupported === false) {
    return { ok: false, from: event.from, to, trigger: event.trigger, reason: "incompatible_transport_version" };
  }
  if (context.requestTimedOut) {
    return { ok: false, from: event.from, to, trigger: event.trigger, reason: "timeout" };
  }
  if (event.trigger === "player_input" && context.hasSession === false) {
    return { ok: false, from: event.from, to, trigger: event.trigger, reason: "missing_prerequisite" };
  }
  if (event.from === "closed") {
    return { ok: false, from: event.from, to, trigger: event.trigger, reason: "already_terminal" };
  }
  if (event.from !== to && !allowedTransitions[event.from].has(to)) {
    return { ok: false, from: event.from, to, trigger: event.trigger, reason: "invalid_transition" };
  }

  return { ok: true, from: event.from, to, trigger: event.trigger };
}

export function declaredTransportMatrix() {
  return TransportStates.flatMap((from) =>
    TransportEvents.map((trigger) => {
      const result = evaluateTransportTransition({ from, trigger });
      return {
        from,
        trigger,
        to: nextStateForTransportEvent(trigger),
        allowed: result.ok,
        reason: result.ok ? null : result.reason,
      };
    }),
  );
}
