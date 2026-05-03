# Turn Lifecycle

## Scope
This document describes the canonical flow for one gameplay turn initiated from a connected client.

## Sequence
1. **Connect and join session**
   - Client opens WebSocket connection to `/session`.
   - Client sends `join` event with campaign/auth context.
   - API loads session state and responds with `session_ready`.

2. **Submit player input**
   - Client sends `player_input` event.
   - API validates event payload against shared schemas.
   - API enforces entitlement constraints (e.g., free-tier turn limit).

3. **Run orchestration**
   - API invokes `runTurn(...)` with current session, player input, memory/persistence adapters, and event emitter.
   - Orchestrator calls model-backed turn generation and obtains narration, choices, and proposed mutations.

4. **Apply state mutations**
   - Reducer applies model-proposed mutations deterministically.
   - Reducer output becomes the next canonical campaign state.

5. **Persist and emit**
   - Updated state and turn artifacts are persisted through configured adapters.
   - Server emits streaming/completion events back to client.

6. **Client presentation**
   - Client updates transcript, choices, status, and optional narration playback.

## Failure Handling
- Bad JSON or invalid events return recoverable typed errors.
- Join failures return non-recoverable errors and close socket.
- Turn failures log server-side and return recoverable user-facing errors.
- Recap failures return a fallback summary derived from current state.

## Contract Notes
- `join` must occur before gameplay events.
- `pause` and `leave` close socket; state persistence is expected per turn.
- Event payload shapes are governed by `@audio-rpg/shared` schemas.

## Compatibility Policy
- The WebSocket transport currently supports canonical event schema version `v1`.
- Incoming client events are normalized through a `v1` adapter:
  - Missing `v` is treated as legacy-compatible `v1`.
  - Explicit `v1` is accepted unchanged.
- Unknown/future versions (for example `v2`) are explicitly rejected with a recoverable typed error (`unsupported_event_version`) so clients can reconnect after upgrade/downgrade.
- Outbound server events are serialized by a single transport serializer that always stamps `v1`, even if route handlers omit `v` in local event objects.
- Backward compatibility target: non-versioned clients remain functional during the `v1` window; forward compatibility is opt-in via explicit version rollout.
