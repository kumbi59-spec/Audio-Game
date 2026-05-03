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
};

export function incrementSessionMetric(
  key: keyof SessionMetricsSnapshot,
): void {
  metrics[key] += 1;
}

export function getSessionMetricsSnapshot(): SessionMetricsSnapshot {
  return { ...metrics };
}

export function resetSessionMetrics(): void {
  (Object.keys(metrics) as Array<keyof SessionMetricsSnapshot>).forEach((k) => {
    metrics[k] = 0;
  });
}
