# ADR 0002: Session WebSocket Contract and Ordering

- **Status**: Accepted
- **Date**: 2026-05-03

## Context
Session gameplay uses a WebSocket channel with typed client/server events. Reliable UX requires clear event ordering and error semantics across web and mobile clients.

## Decision
The session transport contract is:
1. Client MUST send `join` before any gameplay event.
2. Server validates all inbound/outbound events against shared schemas.
3. Entitlements are enforced server-side before turn execution.
4. Errors are sent as typed events with recoverability metadata.
5. `pause` and `leave` terminate the connection.

## Consequences
### Positive
- Uniform behavior across clients.
- Predictable user-visible errors and reconnect behavior.
- Easier compatibility testing via shared event schemas.

### Tradeoffs
- Clients must implement stricter state machines.
- Future reconnect/idempotency enhancements require versioned contract updates.

## Follow-up
- Introduce event IDs and idempotency keys for replay-safe retries.
- Add contract tests for join/order/invalid-event scenarios.
