# Full Repository Audit (2026-04-26)

## Scope
- Monorepo health audit across `apps/*` and `packages/*`.
- Focus areas: build/test/lint/type health, accessibility lint posture, schema/runtime consistency, dependency security signal, and operational readiness.

## Commands Run
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm audit --prod`
5. `rg -n "TODO|FIXME|HACK|XXX" apps packages`
6. `rg -n "(sk_|pk_|whsec_|BEGIN PRIVATE KEY|AKIA|AIza|xoxb-|ghp_)" --glob '!pnpm-lock.yaml'`

## Executive Summary
- **Tests are healthy** in the currently configured suite (all executed tests passed).
- **Type safety is currently blocked** in the web app due to Prisma client/schema drift around `pushToken`.
- **Accessibility linting has actionable failures** (unescaped apostrophe, invalid role usage on button/listitem, and dialog interaction semantics).
- **Dependency vulnerability scan could not complete** due to registry audit endpoint permissions (`403 Forbidden`) in this environment.
- **Documentation-to-runtime mismatch risk exists** for database env naming between README setup (`DATABASE_URL`) and `.env.example` (`WEB_DATABASE_URL`).

## Detailed Findings

### 1) Linting: Failing (web accessibility + JSX quality)
`pnpm lint` failed in `apps/web` with 5 errors:
- `react/no-unescaped-entities` in `app/worlds/new/page.tsx` (apostrophe in visible text).
- `jsx-a11y/no-interactive-element-to-noninteractive-role` in `app/worlds/new/wizard/page.tsx` (`button` assigned `role="listitem"`).
- Three dialog-related a11y issues in `components/entitlements/UpgradeModal.tsx`:
  - click handlers on non-interactive semantics,
  - noninteractive element interaction rules,
  - redundant explicit `role="dialog"` on `<dialog>`.

**Impact:** CI quality gates and accessibility guarantees are currently below stated target.

### 2) Typecheck: Failing (Prisma API mismatch)
`pnpm typecheck` failed in `apps/web` with:
- `Property 'pushToken' does not exist on type 'PrismaClient'` in `lib/push/tokens.ts`.

The schema defines `model PushToken`, and relations include `pushTokens`, but generated client appears out-of-sync with code assumptions.

**Likely causes:**
- Prisma client not regenerated after schema change,
- stale generated client artifacts,
- schema/client lifecycle drift in developer workflow.

**Impact:** compile-time failure and potential runtime break in push token persistence paths.

### 3) Tests: Passing
`pnpm test` passed for:
- `packages/shared` (4 tests)
- `packages/gm-engine` (14 tests)
- `apps/api` (4 tests)
- `apps/mobile` intentionally reports no tests and exits 0.

**Impact:** core shared/game-engine/api behavior covered by existing tests appears stable.

### 4) Dependency security audit: Inconclusive in environment
`pnpm audit --prod` returned:
- `ERR_PNPM_AUDIT_BAD_RESPONSE ... 403 Forbidden` from npm audit endpoint.

**Impact:** no definitive vulnerability report can be produced from this run.

### 5) Config consistency risk: database env naming
README quickstart instructs using `DATABASE_URL=file:./dev.db` in `apps/web/.env.local`, while `.env.example` exposes `WEB_DATABASE_URL=file:./dev.db`.

Given Prisma conventions and existing scripts, this inconsistency can cause onboarding confusion and misconfiguration.

### 6) Delivery/readiness note: explicit TODO placeholders in purchases integration
`apps/mobile/src/entitlements/purchases.ts` contains multiple TODO stubs for RevenueCat configuration/purchase flow.

**Impact:** mobile paid entitlement flows appear intentionally incomplete/stubbed.

## Prioritized Recommendations
1. **Fix web lint blockers first** (especially a11y issues) to restore CI quality signal.
2. **Regenerate Prisma client in web app and verify push token model availability** (`pnpm --filter @audio-rpg/web db:generate`), then rerun `pnpm typecheck`.
3. **Standardize env naming** (`DATABASE_URL` vs `WEB_DATABASE_URL`) across README and `.env.example`.
4. **Run dependency audit in a permitted network context** (or via alternative scanner in CI).
5. **Track mobile purchases TODOs** as explicit roadmap issues/milestones before production launch claims.

## Suggested Exit Criteria for “Green” Repo Health
- `pnpm lint` passes across all workspaces.
- `pnpm typecheck` passes across all workspaces.
- `pnpm test` remains green.
- successful dependency vulnerability report generated and triaged.
- onboarding docs/config use one canonical DB env variable.
