# Audio RPG

Accessibility-first audio RPG platform. Audible-style narration meets an AI
Game Master that can run user-uploaded Game Bibles or original worlds, with
blind and low-vision players as a first-class audience.

## Status

Phase 0 foundations — monorepo scaffold, shared schemas, GM engine core,
Fastify API with session WebSocket, Expo app skeleton with accessibility
primitives. See `docs/plan.md` (copied from the approved build plan) for the
full product spec, architecture, and roadmap.

## Workspace layout

```
apps/
  api/       Fastify + Anthropic orchestration + TTS proxy (Phase 1)
  mobile/    Expo (iOS / Android / Web) with accessibility-first UI
packages/
  shared/    Zod schemas — GM turn, Game Bible, session events, state
  gm-engine/ Pure TS — state reducer, prompt assembly, memory retrieval
```

## Prerequisites

- Node 20.11+
- pnpm 9
- An Anthropic API key in `.env` (see `.env.example`)
- (Later) Postgres with `pgvector`, Redis, ElevenLabs + Deepgram keys

## Quick start

```bash
pnpm install
pnpm typecheck
pnpm test

# API
cp .env.example .env  # fill in ANTHROPIC_API_KEY
pnpm dev:api

# Mobile / web
pnpm dev:mobile

# End-to-end smoke test against a running server
# (requires ANTHROPIC_API_KEY on the server; no external creds needed in CI)
pnpm --filter @audio-rpg/api e2e
```

## CI

Three jobs run on every PR:

- `build`: typecheck + unit + api integration against the in-memory store
- `postgres-e2e`: same api integration suite against `pgvector/pgvector:pg16`
- `web-e2e`: Playwright + axe-core against the built Expo web bundle

A separate manually-dispatched workflow (`Credentialed E2E`) runs the CLI
harness against real external providers (Anthropic + optional Voyage /
ElevenLabs / Deepgram + real Postgres). Trigger it from the Actions tab —
secrets live under a `credentialed` environment.

## Design pillars

1. **Audio-first**. Most flows work without looking at the screen. Narration,
   choices, and utility commands are all voice-addressable.
2. **Accessibility is not a settings page**. Full screen reader support,
   landmark announcements, voice command bus, sound cues, and haptics are
   built into every screen from day one.
3. **Structured state, narrative model**. The GM narrates; the reducer
   (`packages/gm-engine`) owns inventory, quests, relationships, and flags.
   The model never invents what's in your bag.

## Learn more

- Full plan: `/root/.claude/plans/here-s-a-strong-build-sleepy-rocket.md`
- GM turn contract: `packages/shared/src/gm.ts`
- State reducer: `packages/gm-engine/src/reducer.ts`
- Session WebSocket: `apps/api/src/routes/session.ts`
