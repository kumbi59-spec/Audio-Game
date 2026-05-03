import type { SessionState, SessionTrigger } from "@audio-rpg/shared";

export interface SessionMetricsSnapshot {
  connectionsOpened: number;
  connectionsClosed: number;
  turnRequests: number;
  turnFailures: number;
  duplicateInputs: number;
  recapRequests: number;
  recapFailures: number;
  turnLimitRejected: number;
  turnResolvedEvents: number;
  turnFailureTimeout: number;
  turnFailureRateLimit: number;
  turnFailureSafetyRefusal: number;
  turnFailureMalformedOutput: number;
  turnFailureNetworkFailure: number;
  turnFailureProviderError: number;
  turnFallbackSafeContinueChoices: number;
}

export interface SessionTransitionTelemetry {
  from_state: SessionState;
  to_state: SessionState;
  trigger: SessionTrigger;
  accepted: boolean;
  rejection_reason?: string;
}

const metrics: SessionMetricsSnapshot = {
  connectionsOpened: 0,
  connectionsClosed: 0,
  turnRequests: 0,
  turnFailures: 0,
  duplicateInputs: 0,
  recapRequests: 0,
  recapFailures: 0,
  turnLimitRejected: 0,
  turnResolvedEvents: 0,
  turnFailureTimeout: 0,
  turnFailureRateLimit: 0,
  turnFailureSafetyRefusal: 0,
  turnFailureMalformedOutput: 0,
  turnFailureNetworkFailure: 0,
  turnFailureProviderError: 0,
  turnFallbackSafeContinueChoices: 0,
};

const transitionEvents: SessionTransitionTelemetry[] = [];
const MAX_TRANSITION_EVENTS = 1_000;

export function incrementSessionMetric(
  key: keyof SessionMetricsSnapshot,
): void {
  metrics[key] += 1;
}

export function recordSessionTransition(
  event: SessionTransitionTelemetry,
): void {
  transitionEvents.push(event);
  if (transitionEvents.length > MAX_TRANSITION_EVENTS) {
    transitionEvents.splice(0, transitionEvents.length - MAX_TRANSITION_EVENTS);
  }
}

export function getSessionTransitionTelemetry(): SessionTransitionTelemetry[] {
  return transitionEvents.map((evt) => ({ ...evt }));
}

export function getSessionMetricsSnapshot(): SessionMetricsSnapshot {
  return { ...metrics };
}

export function resetSessionMetrics(): void {
  (Object.keys(metrics) as Array<keyof SessionMetricsSnapshot>).forEach((k) => {
    metrics[k] = 0;
  });
  transitionEvents.splice(0, transitionEvents.length);
}
