# Design Review — May 3, 2026

## Scope Reviewed
- Mobile home flow (`apps/mobile/app/index.tsx`)
- Mobile active campaign play screen (`apps/mobile/app/campaign/[id].tsx`)
- Web landing page (`apps/web/app/page.tsx`)
- Existing architecture docs (`docs/architecture/overview.md`, `docs/architecture/turn-lifecycle.md`)

## What Is Working Well
1. Accessibility intent is clear and embedded into core interactions (landmark announcements, voice command routing, large touch targets).
2. Turn loop architecture is cleanly separated: transport/orchestration/reducer boundaries are explicit in documentation.
3. Cross-platform messaging is cohesive (same product narrative and command metaphors across web and mobile).

## Improvement Opportunities

### 1) Align “busy/disabled” interaction states across all input methods
**Observed:** During turn processing (`awaitingGm`), touch buttons are disabled in campaign view, but voice command handlers still allow several actionable intents.

**Risk:** Duplicate or conflicting turn submissions and confusing feedback for screen-reader and voice-first players.

**Recommendation:**
- Gate mutating voice commands (`choice`, `freeform`, `save`) behind a shared `canAcceptInput` selector.
- Add explicit spoken response when input is blocked (e.g., “Please wait for the narrator to finish”).
- Centralize this in a session input policy helper used by both UI handlers and voice command bus.

### 2) Separate campaign lifecycle cleanup from screen unmount
**Observed:** Campaign screen cleanup unconditionally closes socket and resets session on unmount.

**Risk:** Navigation transitions and temporary screen swaps can discard state unexpectedly, increasing reconnect churn.

**Recommendation:**
- Move teardown semantics to explicit lifecycle events (`leaveCampaign`, `pauseCampaign`) rather than generic unmount.
- Keep a short-lived reconnect grace window (e.g., 10–20 seconds) before hard reset.

### 3) Reduce cognitive load in campaign transcript region
**Observed:** Transcript, thinking state, choices, freeform, and dock controls are all visible with minimal hierarchy.

**Risk:** High verbosity for assistive technologies and slower task completion for returning players.

**Recommendation:**
- Introduce collapsible transcript summary anchors every N turns.
- Add a “focus mode” that prioritizes only current narration + choices.
- Announce only delta updates in live regions (avoid rereading long context).

### 4) Improve first-run onboarding continuity from home to active play
**Observed:** Home offers strong CTA, but transition to first actionable choice can feel abrupt.

**Risk:** Early drop-off when users do not understand command options after initial scene begins.

**Recommendation:**
- Add a one-time “first turn coachmark” with 3 controls: choose option, speak custom action, pause.
- Provide modality-specific hints (keyboard vs voice vs touch).

### 5) Strengthen pricing/entitlement transparency at decision points
**Observed:** Upgrade prompts appear at turn limit, but value explanation is largely reactive.

**Risk:** Perceived interruption rather than intentional progression.

**Recommendation:**
- Surface soft quota indicators earlier in session.
- Provide pre-limit warnings with actionable alternatives (recap-only mode, lower-cost narration mode, or save-and-return).

### 6) Create a shared design-system contract for semantic states
**Observed:** Visual tokens exist, but behavior states (loading, streaming, blocked, listening, paused) are implemented ad hoc.

**Risk:** Inconsistent UX language across web and mobile.

**Recommendation:**
- Define state primitives and naming in a shared design spec (status badges, narration indicators, disabled reason copy).
- Reuse same state map in analytics events to improve product diagnostics.

## Prioritized Roadmap (Suggested)
1. **P0:** Shared input policy guard for touch + voice parity.
2. **P0:** Explicit campaign lifecycle state machine (join/active/paused/reconnecting/left).
3. **P1:** First-turn onboarding coachmark + modality hints.
4. **P1:** Transcript focus mode and summary anchors.
5. **P2:** Entitlement transparency pre-warning UX.
6. **P2:** Cross-platform semantic-state design contract.

## Success Metrics
- 20% reduction in duplicate/invalid input events per active campaign session.
- 10% improvement in first-session completion (reaching turn 5).
- 15% reduction in forced reconnects within 60 seconds of campaign navigation.
- Increased upgrade conversion from pre-limit warning exposure cohort vs control.

## Implementation Notes
- Prefer adding a small domain-level session state machine in shared logic rather than per-screen conditional branching.
- Keep accessibility copy deterministic and concise to avoid narration fatigue.
- Validate changes with both screen-reader and voice-only QA passes before rollout.
