# ADR 0001: Reducer Owns Canonical State

- **Status**: Accepted
- **Date**: 2026-05-03

## Context
Gameplay turns are model-generated and may include narration plus state mutation proposals (inventory, quests, relationships, flags, stats, and scene updates). Unconstrained model ownership of state can introduce drift and non-deterministic bugs.

## Decision
Canonical campaign state is owned by deterministic reducer logic in `packages/gm-engine`. The model may propose mutations, but the reducer applies them to produce the single source of truth.

## Consequences
### Positive
- Deterministic state transitions for replayability and testing.
- Reduced risk of malformed or inconsistent state from model output.
- Centralized mutation semantics simplify audits and balancing.

### Tradeoffs
- New gameplay mechanics require explicit mutation and reducer updates.
- Additional adapter logic may be required when integrating new model providers.

## Follow-up
- Add invariant/property tests for reducer mutation sequences.
- Document mutation extension checklist for future features.
