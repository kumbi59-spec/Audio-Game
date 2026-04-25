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
| Per-NPC ElevenLabs voice routing | ✅ |
| PWA service worker + offline fallback | ✅ |
| EchoQuest design system (midnight-navy, violet accent) | ✅ |
| Expo mobile app (iOS / Android / Web) | ✅ |
| Next.js 14 web app (streaming, Radix UI) | ✅ |
| Narrator TTS (browser + ElevenLabs proxy) | ✅ |
| Voice command bus + STT (Deepgram) | ✅ |
| Sound cues + haptics | ✅ |
| Scene summarization (every 15 turns) | ✅ |
| Spoken recap on demand | ✅ |
| Subscription tiers + entitlement enforcement | ✅ |
| Stripe checkout stubs (web) | ✅ |
| RevenueCat purchase stubs (mobile) | ✅ |
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

## Monetization

### Subscription tiers

| Tier | Price | AI time | Ads | Key features |
|---|---|---|---|---|
| Free | $0 | 60 min included; buy packs | Yes | 3 prebuilt campaigns, browser TTS, voice nav, full keyboard |
| Storyteller | $9/mo or $79/yr | Unlimited | No | ElevenLabs multi-voice narration, Game Bible upload, unlimited saves |
| Creator | $19/mo or $159/yr | Unlimited | No | World Builder Wizard, Claude-assisted world design, public publishing |
| Enterprise | Custom | Unlimited | No | Institutional licensing, custom a11y integrations, priority support |

**Accessibility features (narrator, voice commands, keyboard nav, screen reader support) are free on every plan, forever.**

### AI minute credit packs (free tier top-up)

| Pack | Minutes | Price |
|---|---|---|
| Starter | 60 min | $1.99 |
| Best value | 3 hours | $4.99 |
| Power player | 10 hours | $14.99 |

### Entitlement enforcement

Server-side enforcement lives in `apps/api/src/auth/entitlements.ts`. Every request to a gated route must carry:

```
Authorization: Bearer <tier>.<nonce>.<sig>
```

The token is a HMAC-SHA256-signed claim issued by `POST /auth/token` (development only — swap with your auth provider in production). Missing or invalid tokens default to the free tier.

Gated routes:
- `POST /worlds/upload` and `POST /worlds/upload-file` — requires **Storyteller**
- `POST /worlds` (wizard create) and `POST /wizard/suggest` — requires **Creator**

Client-side gates mirror this in both apps:
- Mobile: `useCan()` from `apps/mobile/src/entitlements/store.ts`
- Web: `useCanWeb()` from `apps/web/store/entitlements-store.ts`

Both show an `UpgradePrompt` / `UpgradeModal` paywall sheet when a gated feature is accessed without the required tier.

### Payment integration

**Web (Stripe)** — stubs in `apps/web/lib/payments/stripe.ts` and `apps/web/app/api/payments/`:
1. `npm install stripe`
2. Fill in `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and price IDs in `.env.local`
3. Replace the stub bodies in `stripe.ts` with real `stripe.checkout.sessions.create(...)` calls
4. Wire the webhook handler to update the user's tier in the DB

**Mobile (RevenueCat)** — stubs in `apps/mobile/src/entitlements/purchases.ts`:
1. `npx expo install react-native-purchases`
2. Fill in `REVENUECAT_APPLE_API_KEY` / `REVENUECAT_GOOGLE_API_KEY` in your Expo secrets
3. Replace stub bodies following the TODO comments

### ElevenLabs voice configuration

Per-NPC voice routing assigns up to three distinct ElevenLabs voices to characters in a scene. Configure via env vars:

| Variable | Default voice ID | Role |
|---|---|---|
| `ELEVENLABS_VOICE_NARRATOR` | Rachel (`21m00Tcm4TlvDq8ikWAM`) | Narrator / non-dialogue prose |
| `ELEVENLABS_VOICE_A` | Domi (`AZnzlk1XvdvUeBnXmlld`) | First NPC speaking in a scene |
| `ELEVENLABS_VOICE_B` | Arnold (`VR6AewLTigWG4xSOukaG`) | Second NPC speaking in a scene |
| `ELEVENLABS_VOICE_C` | Adam (`pNInz6obpgDQGcFmaJgB`) | Third NPC speaking in a scene |

The GM formats NPC dialogue inline as `[NpcName]: "their words"`. The narrator detects this pattern during streaming and routes each segment to the correct ElevenLabs voice ID via the `voiceRole` query param on `GET /tts`.

`GET /tts/voices` returns the currently configured role → voice ID map.

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
| `packages/shared/src/entitlements.ts` | Tier definitions, entitlement flags, pricing, AI packs |
| `apps/api/src/auth/entitlements.ts` | Server-side tier enforcement (preHandler factory) |
| `apps/api/src/routes/auth.ts` | Dev token issuer (`POST /auth/token`) |
| `apps/mobile/src/entitlements/` | Mobile paywall sheets, ad banner, RevenueCat stub |
| `apps/web/store/entitlements-store.ts` | Web entitlement Zustand store |
| `apps/web/components/entitlements/UpgradeModal.tsx` | Web paywall dialog |
| `apps/web/lib/payments/stripe.ts` | Stripe checkout stub |
