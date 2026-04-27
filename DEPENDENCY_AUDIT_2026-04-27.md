# Dependency Vulnerability Scan + Triage (2026-04-27)

## Goal
Target release condition: **No unknown critical/high dependency risk at release time**.

## Commands Run
1. `pnpm --version && node --version`
2. `pnpm audit --prod --json`
3. `pnpm run security:release-gate`

> Note: the release gate now accepts both single JSON objects and line-delimited JSON payloads from `pnpm audit`, and still fails closed on upstream API errors.

## Raw Outcome
- `pnpm audit --prod --json` returned structured error payload:
  - `code`: `ERR_PNPM_AUDIT_BAD_RESPONSE`
  - `message`: npm audit endpoint responded with `403 Forbidden`.
- Because the audit API response was denied, no vulnerability metadata (`critical/high/moderate/low`) was available.

## Triage Decision
| Finding | Severity | Confidence | Release Impact | Decision |
|---|---|---|---|---|
| npm audit endpoint unreachable (`ERR_PNPM_AUDIT_BAD_RESPONSE`, `403`) | **Unknown** (could mask critical/high) | High | Blocks accurate dependency risk assessment | **Release blocked** |

Because the scan cannot resolve known-vs-unknown critical/high exposure, dependency risk is classified as **UNKNOWN** and fails the release gate.

## Release Policy (Effective Immediately)

### Hard gates (must pass)
1. `pnpm run security:release-gate` must pass in CI.
2. Any **unknown** audit status (network/API/auth/output parse failure) is **release-blocking**.
3. Any **critical** or **high** vulnerability count > 0 is **release-blocking**.

### Allowed with tracking
- `moderate`/`low` vulnerabilities may proceed only with:
  - linked remediation ticket(s),
  - owner assigned,
  - due date, and
  - compensating-control note if exploitability exists.

### Waiver process for exceptional release
A temporary waiver is allowed only when all are present:
- documented business justification,
- explicit expiry date,
- security owner sign-off,
- rollback/kill-switch plan,
- post-release remediation commitment.

## Operational Next Step
Run the same gate in CI or another network path with confirmed access to
`https://registry.npmjs.org/-/npm/v1/security/audits`.
