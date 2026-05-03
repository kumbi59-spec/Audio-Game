export const ReliabilityErrorCode = {
  DeadlineExceeded: "deadline_exceeded",
  UpstreamTimeout: "upstream_timeout",
  CircuitOpen: "circuit_open",
  GmDegradedMode: "gm_degraded_mode",
} as const;

export type ReliabilityErrorCode =
  (typeof ReliabilityErrorCode)[keyof typeof ReliabilityErrorCode];

export const DEGRADED_MODE_COPY: Record<ReliabilityErrorCode, string> = {
  deadline_exceeded: "The turn hit a reliability deadline. Showing safe fallback behavior.",
  upstream_timeout: "The narrator took too long to respond. Showing safe fallback behavior.",
  circuit_open: "Narration is in degraded mode due to instability. Please retry shortly.",
  gm_degraded_mode: "Narrator degraded mode is active. We preserved your current choices.",
};
