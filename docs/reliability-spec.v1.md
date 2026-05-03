# Reliability Spec v1

## SLOs and error budgets

- **Turn latency (API session turn)**
  - P95 end-to-end turn completion: **<= 4.0s**
  - P99 end-to-end turn completion: **<= 8.0s**
- **Turn success rate SLO**: **99.5%** successful turn completion over rolling 30 days.
- **Error budget**: **0.5%** failed turns per 30-day window.

## Timeout thresholds

- Request deadline budget: **9000ms** total.
- Provider attempt timeout: **3500ms**.
- Retry attempts: **1** additional attempt with **250ms** linear backoff.
- Client-visible timeout classification: `deadline_exceeded` or `upstream_timeout`.

## Fallback mode behavior

When budgets are exceeded or downstream instability is detected, server emits a structured degraded error and clients apply this deterministic sequence:

1. **Partial response**: surface streamed narration received before timeout.
2. **Cached hint**: if available, show latest recap/context hint.
3. **Deterministic safe reply**: show a stable fallback copy and retain current actionable choices.

## Degraded UX contract matrix

| Error code | Web UX | Mobile UX | Recoverability |
| --- | --- | --- | --- |
| `deadline_exceeded` | Banner + system transcript entry, keep existing choices | Toast/system message + keep choices | Retry allowed |
| `upstream_timeout` | Same as above | Same as above | Retry allowed |
| `circuit_open` | "Degraded mode" banner, disable rapid retries for cooldown | Same behavior/copy | Retry after cooldown |
| `gm_degraded_mode` | Show deterministic safe copy and preserve progression controls | Same behavior/copy | Retry allowed |

## Release gates

- Block production release when 6-hour burn rate projects >100% budget consumption for 30-day window.
- Warning gate at 50% projected burn.
