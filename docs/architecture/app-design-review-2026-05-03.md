# App Design Review — May 3, 2026

## Scope Reviewed
- Product and architecture documentation in `README.md` and `docs/architecture/overview.md`.
- Monorepo structure (web, mobile, API, shared contracts, deterministic GM engine).

## What’s Working Well
1. **Clear bounded contexts** across `apps/*` and `packages/*` reduce coupling and make ownership explicit.
2. **Shared schema contracts** (`packages/shared`) plus deterministic reducer (`packages/gm-engine`) are a strong foundation for consistency and testability.
3. **Accessibility-first posture** is explicit and repeated across surfaces.
4. **Graceful degradation** for optional services lowers operational fragility and onboarding friction.

## Design Improvement Opportunities

### 1) Introduce a formal frontend domain layer (High impact)
**Current risk:** Gameplay, account, entitlements, and media concerns appear split across routes/components/stores, which can lead to view-model drift and duplicated business logic over time.

**Recommendation:**
- Add a domain-oriented layer in both `apps/web` and `apps/mobile` (e.g., `src/domain/{game,world,account,audio}`) with use-case functions and mappers.
- Keep UI components “thin” (render + user intent), with orchestration in domain services.
- Centralize optimistic update policy and rollback behavior per use case.

**Expected outcome:** Lower regression risk, easier testing, faster feature iteration.

### 2) Standardize API contract versioning + compatibility policy (High impact)
**Current risk:** Shared schemas reduce drift, but explicit transport versioning strategy is not visible in top-level docs.

**Recommendation:**
- Version event envelopes for WebSocket + HTTP payloads (`v1`, `v1.1` compatibility windows).
- Define deprecation cadence and migration checklist.
- Add CI contract tests that replay historical fixtures against current validators.

**Expected outcome:** Safer multi-client evolution (especially web + mobile release skew).

### 3) Promote session lifecycle to an explicit state machine artifact (High impact)
**Current risk:** Lifecycle docs exist, but runtime transition invariants can still become implicit across handlers.

**Recommendation:**
- Declare session states/transitions as a shared machine spec (type-level union + transition guards).
- Emit transition metrics and invariant failures as structured telemetry.
- Add property-based tests for forbidden transitions.

**Expected outcome:** Fewer edge-case bugs in reconnect, resume, and narration handoff.

### 4) Separate write-model and read-model storage paths (Medium impact)
**Current risk:** As analytics and creator dashboards grow, query load can pressure gameplay write paths.

**Recommendation:**
- Keep authoritative gameplay writes in canonical store.
- Build denormalized read models for analytics/community browsing via async projection jobs.
- Define projection lag SLO and reconciliation jobs.

**Expected outcome:** Better performance isolation and simpler analytics queries.

### 5) Introduce an internal event bus abstraction (Medium impact)
**Current risk:** Feature growth (notifications, moderation, billing, email, recap, embeddings) can create hidden temporal coupling.

**Recommendation:**
- Publish domain events (`TurnResolved`, `WorldPublished`, `TierChanged`, etc.) from API core.
- Consume with idempotent handlers for side effects (email, push, billing sync, indexing).
- Record event IDs + dedupe keys.

**Expected outcome:** More reliable side effects and easier extensibility.

### 6) Add a reliability budget for AI provider interactions (Medium impact)
**Current risk:** AI orchestration is central; timeout/retry/fallback posture should be codified as product SLOs.

**Recommendation:**
- Define budgets per turn: max latency, retry count, downgrade path (short response, cached recap, local narration fallback).
- Surface user-facing degraded mode messaging consistently on web/mobile.
- Track provider failure classes separately (timeouts, safety blocks, malformed output).

**Expected outcome:** More predictable UX during provider instability.

### 7) Strengthen design-system convergence across web/mobile (Medium impact)
**Current risk:** Accessibility intent is strong, but component/token drift is likely in parallel app stacks.

**Recommendation:**
- Promote shared design tokens and interaction primitives to a cross-platform package.
- Add accessibility regression snapshots (focus order, landmark announcements, target-size checks) to CI for both platforms.

**Expected outcome:** Better parity and lower maintenance cost.

### 8) Security boundary hardening for creator content pipeline (Medium impact)
**Current risk:** Upload + parsing + AI transformation path is a high-risk boundary.

**Recommendation:**
- Explicitly isolate parser workers, enforce strict MIME/content sniffing, and cap parse cost.
- Add quarantine state for suspicious files before indexing.
- Emit audit trails for moderation and admin actions.

**Expected outcome:** Lower abuse/security risk with better incident response data.

## Suggested 90-Day Execution Plan

### Phase 1 (Weeks 1–3)
- Define API compatibility/versioning policy.
- Specify session state machine + transition tests.
- Set AI turn reliability SLOs and telemetry dimensions.

### Phase 2 (Weeks 4–8)
- Build frontend domain layer for game/session and world workflows.
- Introduce domain event bus for 2–3 side-effect flows.
- Start read-model projections for analytics endpoints.

### Phase 3 (Weeks 9–12)
- Expand domain layer to account/entitlements/audio.
- Integrate cross-platform a11y regression checks in CI.
- Harden upload pipeline isolation + audit logging.

## Success Metrics
- 30–50% reduction in regressions caused by cross-client contract or session lifecycle changes.
- P95 turn completion latency within agreed SLO during provider degradation.
- Lower mean time to isolate incidents due to structured transition/event telemetry.
- Reduced duplicate logic across web/mobile via domain-layer adoption.
