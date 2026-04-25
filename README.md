# Audio RPG

Accessibility-first audio RPG platform. Audible-style narration meets an AI
Game Master that can run user-uploaded Game Bibles or original worlds, with
blind and low-vision players as a first-class audience.

## Status

MVP complete — full AI Game Master pipeline, accessibility layer, one prebuilt
world ("The Shattered Reaches"), and a Next.js web app. The Expo mobile app
has the same routes in React Native. See the PR history for a detailed
feature log.

## Workspace layout

```
apps/
  api/       Fastify + Anthropic orchestration + TTS proxy
  mobile/    Expo (iOS / Android / Web) — accessibility-first React Native
  web/       Next.js 14 (App Router) — streaming AI GM, browser TTS, Radix UI
packages/
  shared/    Zod schemas — GM turn, Game Bible, session events, state
  gm-engine/ Pure TS — state reducer, prompt assembly, memory retrieval
```

## Prerequisites

- Node ≥ 20.11
- pnpm 9 (`npm i -g pnpm@9`)
- An Anthropic API key

## Quick start — Next.js web app

```bash
# 1. Clone and install
git clone <repo>
cd Audio-Game
pnpm install

# 2. Configure environment
cp .env.example apps/web/.env.local
# Open apps/web/.env.local and set:
#   ANTHROPIC_API_KEY=sk-ant-...
#   DATABASE_URL=file:./dev.db    (already set — SQLite, no Postgres needed)

# 3. Set up the database
pnpm --filter @audio-rpg/web db:generate   # generate Prisma client
pnpm --filter @audio-rpg/web db:push       # create SQLite schema

# 4. Start the dev server
pnpm dev:web
# → http://localhost:3000
```

The home page announces itself via browser TTS and loads the prebuilt world
"The Shattered Reaches". All navigation works by keyboard alone (1–9 for
choices, V for voice, H for help, R to replay narration).

## Quick start — Expo mobile app

```bash
# Requires Expo CLI and either a simulator or the Expo Go app
pnpm install
cp .env.example .env          # fill in ANTHROPIC_API_KEY + PORT=4000
pnpm dev:api                  # start the Fastify API in one terminal
pnpm dev:mobile               # start Expo in another
```

## Run CI locally

```bash
pnpm typecheck                 # type-check all six workspace packages
pnpm test                      # unit + in-memory integration tests

# Web e2e (Playwright + axe-core) — requires Chromium
pnpm --filter @audio-rpg/mobile test:e2e:install   # one-time Chromium install
pnpm --filter @audio-rpg/mobile test:e2e
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

- Full plan: `/root/.claude/plans/here-s-a-strong-build-groovy-toucan.md`
- GM turn contract: `packages/shared/src/gm.ts`
- State reducer: `packages/gm-engine/src/reducer.ts`
- Session WebSocket: `apps/api/src/routes/session.ts`
