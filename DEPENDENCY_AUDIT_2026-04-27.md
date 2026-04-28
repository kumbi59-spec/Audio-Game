# Dependency Vulnerability Gate

## Goal
Release condition: **No unknown critical/high dependency risk at release time.**

## How it works now

The release gate runs in two layers:

1. **OSV-Scanner** (preferred) — queries [osv.dev](https://osv.dev), reads `pnpm-lock.yaml` directly, and does **not** depend on the npm registry's audit endpoint (which has historically returned `403 Forbidden` from sandboxed CI environments).
2. **`pnpm audit --prod`** (fallback) — used only if `osv-scanner` is unavailable.

If neither layer produces a usable signal, the gate fails closed with `RELEASE_GATED: ...`.

## Local usage

```bash
# Install osv-scanner (one-time)
brew install osv-scanner                 # macOS
# or download a binary from https://github.com/google/osv-scanner/releases

# Run the gate
pnpm run security:release-gate
```

Expected output on a clean tree:

```
[osv-scanner] critical=0 high=0 moderate=0 low=0 unknown=0
PASS: no high/critical dependency vulnerabilities (source: osv-scanner).
```

## CI

Two jobs run on every PR and on a daily schedule (so newly-disclosed CVEs surface without requiring a code change):

| Job | Purpose |
|---|---|
| `OSV-Scanner (deps)` | Uploads a SARIF report to the GitHub Security tab. Doesn't fail the build directly. |
| `release-gate (high/critical = fail)` | Runs `pnpm run security:release-gate` with `osv-scanner` installed. **Fails the build on any high/critical or unknown-severity finding.** |

Workflow: [`.github/workflows/security.yml`](./.github/workflows/security.yml)

## Severity policy

| Severity | Action |
|---|---|
| **critical / high** | Release-blocking. Fix, upgrade, or apply documented waiver before merge. |
| **moderate / low** | Non-blocking; surfaces a `WARNING` in CI logs. Track in an issue with owner + due date. |
| **unknown** | Release-blocking until classified. |

## Waiver process (exceptional release)

A temporary waiver is allowed only when **all** of these are present:
- documented business justification,
- explicit expiry date,
- security owner sign-off,
- rollback / kill-switch plan,
- post-release remediation commitment.

Record the waiver in `SECURITY.md` (or a dedicated waiver log) before merging.

## Historical context (2026-04-27)

The original gate ran `pnpm audit --prod --json`, which calls
`https://registry.npmjs.org/-/npm/v1/security/audits`. That endpoint returned
`403 Forbidden` from the CI sandbox, which classified dependency risk as
**unknown** and blocked release. Switching to OSV-Scanner removed that
dependency on the npm audit endpoint while preserving the fail-closed behavior.
