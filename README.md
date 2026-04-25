# EchoQuest — Audio RPG Platform

Accessibility-first audio RPG platform. Audible-style narration meets an AI
Game Master that can run user-uploaded Game Bibles or original worlds, with
blind and low-vision players as a first-class audience.

## What's been built

| Feature | Status |
|---|---|
| AI Game Master (Anthropic Claude, streaming) | ✅ |
| Session WebSocket (Fastify + Zod) | ✅ |
| In-memory + Postgres/pgvector state stores | ✅ |
| Game Bible upload (PDF, DOCX, TXT, MD, JSON) | ✅ |
| World Builder Wizard with Claude suggestions | ✅ |
| EchoQuest design system (midnight-navy, violet accent) | ✅ |
| Expo mobile app (iOS / Android / Web) | ✅ |
| Next.js 14 web app (streaming, Radix UI) | ✅ |
| Narrator TTS (browser + ElevenLabs proxy) | ✅ |
| Voice command bus + STT (Deepgram) | ✅ |
| Sound cues + haptics | ✅ |
| Scene summarization (every 15 turns) | ✅ |
| Spoken recap on demand | ✅ |
| Accessibility layer (ARIA, landmark announcements, 44 px targets) | ✅ |
| Playwright + axe-core CI | ✅ |
| Postgres + pgvector CI | ✅ |

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

The app connects to the Fastify API over WebSocket. All six screens use the
EchoQuest design system (dark midnight-navy backgrounds, violet accent
`#7c6af7`, ALL-CAPS section labels, 44 px minimum touch targets).

## Create World Wizard (Phase 4)

The "Create World" screen walks players through 10 audio-guided questions.
At each freeform step, Claude generates 3 contextually-aware suggestion chips
based on what the player has already filled in. Tapping a chip fills the input
and reads it aloud — so the entire wizard is usable hands-free.

```
Step 1 — Title       → Claude suggests: evocative 2-4 word world names
Step 2 — Pitch       → Claude suggests: one-sentence pitches matching the title
Step 3 — Genre       → Claude suggests: genre labels that fit the pitch
Step 4 — Setting     → Claude suggests: place + era combinations
Step 5 — Style       → Multiple-choice (7 options, no suggestions needed)
Step 6 — Rating      → Multiple-choice (family / teen / mature)
Step 7 — Tone        → Claude suggests: 3-adjective narrator tone phrases
Step 8 — Hard rule   → Claude suggests: interesting world constraints
Step 9 — Opening     → Claude suggests: opening scene hooks
Step 10 — Name       → Claude suggests: character names matching the world
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

- `typecheck + unit + in-memory integration`: typecheck + unit + api integration against the in-memory store
- `integration (Postgres + pgvector)`: same api integration suite against `pgvector/pgvector:pg16`
- `web e2e (Playwright + axe-core)`: Playwright + axe-core against the built Expo web bundle

A separate manually-dispatched workflow (`Credentialed E2E`) runs the CLI
harness against real external providers (Anthropic + optional Voyage /
ElevenLabs / Deepgram + real Postgres). Trigger it from the Actions tab —
secrets live under a `credentialed` environment.

## Design pillars

1. **Audio-first**. Most flows work without looking at the screen. Narration,
   choices, and utility commands are all voice-addressable.
2. **Accessibility is not a settings page**. Full screen reader support,
   landmark announcements, voice command bus, sound cues, and haptics are
   built into every screen from day one. Accessibility features are free on
   every plan, forever.
3. **Structured state, narrative model**. The GM narrates; the reducer
   (`packages/gm-engine`) owns inventory, quests, relationships, and flags.
   The model never invents what's in your bag.
4. **EchoQuest design system**. Shared token constants (`apps/mobile/src/design/tokens.ts`)
   ensure consistent midnight-navy surfaces, violet `#7c6af7` accent, and
   correct minimum touch sizes across all screens.

## Architecture notes

- **GM turn flow**: Player input → `runTurn()` in orchestrator → `buildMemoryBundle()` → Claude stream → `applyMutations()` → state persist → WebSocket events
- **Memory**: Active context holds last 15 turns. Every 15 turns a fire-and-forget Claude call compresses the batch into a `scene_summaries` row (Postgres) or in-memory array. The summary is included in every subsequent prompt.
- **Wizard suggestions**: `POST /wizard/suggest` calls Claude with the current draft and returns 3 contextual suggestions for the active step. The mobile client fetches suggestions in the background on every step change — failures are silent.
- **Uploads**: File → text extraction (pdf-parse / mammoth / marked / plain) → single Claude call → `ParsedGameBible` → `World` record. Server-side only; `pdf-parse` and `mammoth` are excluded from the client bundle via `experimental.serverComponentsExternalPackages`.

## Key files

| Path | What it does |
|---|---|
| `packages/shared/src/gm.ts` | GM turn Zod contract |
| `packages/gm-engine/src/reducer.ts` | State mutations |
| `apps/api/src/routes/session.ts` | WebSocket game loop |
| `apps/api/src/gm/orchestrator.ts` | Turn orchestration + scene summarization |
| `apps/api/src/gm/claude.ts` | All Claude calls (GM, recap, summary, wizard) |
| `apps/mobile/src/design/tokens.ts` | EchoQuest design tokens |
| `apps/mobile/app/create.tsx` | World Builder Wizard with suggestion chips |
