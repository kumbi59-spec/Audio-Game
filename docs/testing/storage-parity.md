# Storage Parity Test Guide

This project supports two API persistence backends:
- `memory` (default when `DATABASE_URL` is unset)
- `postgres` (when `DATABASE_URL` is set)

## Goal
Run the same session e2e suite against both backends and compare behavior.

## Commands
### Memory backend
```bash
unset DATABASE_URL
pnpm --filter @audio-rpg/shared build
pnpm --filter @audio-rpg/gm-engine build
pnpm --filter @audio-rpg/api test
```

### Postgres backend
```bash
export DATABASE_URL=postgres://USER:PASS@HOST:5432/DB
pnpm --filter @audio-rpg/shared build
pnpm --filter @audio-rpg/gm-engine build
pnpm --filter @audio-rpg/api test
```

## Verification signals
- `GET /health` returns `storageBackend` as `memory` or `postgres`.
- `GET /metrics` includes the same `storageBackend` value.
- Session e2e suite passes in both modes.
