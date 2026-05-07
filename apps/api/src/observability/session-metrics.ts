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
  continuityContradictionFlags: number;
  continuityOmissionFlags: number;
  continuityChecks: number;
}

export interface ContinuityAlertThresholds {
  contradictionRateWarn: number;
  contradictionRateCritical: number;
  omissionRateWarn: number;
  omissionRateCritical: number;
  minSamples: number;
}

export interface ContinuityAlertSnapshot {
  contradictionRate: number;
  omissionRate: number;
  checks: number;
  alerts: Array<{ level: "warn" | "critical"; kind: "contradiction" | "omission"; threshold: number }>;
}

export const DEFAULT_CONTINUITY_ALERT_THRESHOLDS: ContinuityAlertThresholds = {
  contradictionRateWarn: 0.06,
  contradictionRateCritical: 0.12,
  omissionRateWarn: 0.1,
  omissionRateCritical: 0.2,
  minSamples: 25,
};

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
  continuityContradictionFlags: 0,
  continuityOmissionFlags: 0,
  continuityChecks: 0,
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

export function getContinuityAlertSnapshot(
  thresholds: ContinuityAlertThresholds = DEFAULT_CONTINUITY_ALERT_THRESHOLDS,
): ContinuityAlertSnapshot {
  const checks = metrics.continuityChecks;
  const contradictionRate = checks > 0 ? metrics.continuityContradictionFlags / checks : 0;
  const omissionRate = checks > 0 ? metrics.continuityOmissionFlags / checks : 0;
  const alerts: ContinuityAlertSnapshot["alerts"] = [];
  if (checks >= thresholds.minSamples) {
    if (contradictionRate >= thresholds.contradictionRateCritical) {
      alerts.push({ level: "critical", kind: "contradiction", threshold: thresholds.contradictionRateCritical });
    } else if (contradictionRate >= thresholds.contradictionRateWarn) {
      alerts.push({ level: "warn", kind: "contradiction", threshold: thresholds.contradictionRateWarn });
    }
    if (omissionRate >= thresholds.omissionRateCritical) {
      alerts.push({ level: "critical", kind: "omission", threshold: thresholds.omissionRateCritical });
    } else if (omissionRate >= thresholds.omissionRateWarn) {
      alerts.push({ level: "warn", kind: "omission", threshold: thresholds.omissionRateWarn });
    }
  }
  return { contradictionRate, omissionRate, checks, alerts };
}
