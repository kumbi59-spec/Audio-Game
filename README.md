# EchoQuest — Audio RPG Platform

Accessibility-first audio RPG platform. Audible-style narration meets an AI Game Master powered by Anthropic Claude. Blind and low-vision players are a first-class audience — not an afterthought.

Play prebuilt campaigns, upload your own Game Bible (PDF/DOCX/TXT/JSON), or build a world from scratch with the spoken wizard. Every feature works by keyboard and voice alone.

---

## What's built

| Feature | Status |
|---|---|
| AI Game Master (Claude, streaming SSE) | ✅ |
| Session WebSocket (Fastify + Zod) | ✅ |
| In-memory + Postgres/pgvector state stores | ✅ |
| 5 prebuilt campaigns (gothic, fantasy, steampunk, desert, nature) | ✅ |
| Game Bible upload (PDF, DOCX, TXT, MD, JSON) | ✅ |
| World Builder Wizard with Claude suggestions | ✅ |
| Per-NPC ElevenLabs voice routing | ✅ |
| PWA service worker + offline fallback | ✅ |
| Push notifications (web VAPID + Expo) | ✅ |
| Narrator TTS (browser + ElevenLabs proxy) | ✅ |
| Voice command bus + STT | ✅ |
| Sound cues + haptics (mobile) | ✅ |
| Content safety moderation layer | ✅ |
| Scene summarization (every 15 turns) | ✅ |
| Subscription tiers + entitlement enforcement | ✅ |
| Stripe checkout (web) | ✅ |
| Transactional email (Resend) | ✅ |
| Admin dashboard (users, worlds, moderation) | ✅ |
| Creator analytics (sessions, turns, unique players) | ✅ |
| Accessibility layer (ARIA, landmark announcements, 44 px targets) | ✅ |
| Playwright + axe-core CI | ✅ |
| Expo mobile app (iOS / Android / Web) | ✅ |
| Next.js 14 web app (streaming, App Router) | ✅ |

---

## Workspace layout

```
apps/
  api/       Fastify + Anthropic orchestration + TTS proxy (port 4000)
  mobile/    Expo (iOS / Android / Web) — accessibility-first React Native
  web/       Next.js 14 (App Router) — streaming AI GM, browser TTS
packages/
  shared/    Zod schemas — GM turn, Game Bible, session events, state
  gm-engine/ Pure TS — state reducer, prompt assembly, memory retrieval
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20.11 |
| pnpm | 9.x (`npm i -g pnpm@9`) |
| Anthropic API key | Required for all AI features |

Optional (features degrade gracefully without them):
- **ElevenLabs** API key — premium multi-voice narration
- **Resend** API key — transactional email (welcome, upgrade receipts)
- **Stripe** keys — paid subscription checkout

---

## Setup: Web app (fastest path to playing)

The web app is self-contained — it uses SQLite locally and browser TTS, so you can play without any paid API keys except Anthropic.

### 1. Install

```bash
git clone https://github.com/kumbi59-spec/Audio-Game.git
cd Audio-Game
pnpm install
```

### 2. Configure environment (canonical path)

```bash
cp .env.example apps/web/.env.local
```

This repo uses **one canonical database variable name** everywhere: `DATABASE_URL` (not `WEB_DATABASE_URL`).

Open `apps/web/.env.local` and fill in the minimum required values:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Auth (generate any random 32+ char string)
NEXTAUTH_SECRET=replace-with-random-secret
NEXTAUTH_URL=http://localhost:3000

# Database for web local dev (SQLite works out of the box)
DATABASE_URL=file:./dev.db
```

Everything else (Stripe, ElevenLabs, Resend, VAPID) is optional — leave blank and those features are simply disabled.

### 3. Set up the database

```bash
pnpm --filter @audio-rpg/web db:generate   # generate Prisma client
pnpm --filter @audio-rpg/web db:push       # create SQLite tables
```

### 4. Start the dev server

```bash
pnpm dev:web
# → http://localhost:3000
```

### 5. Create an account

Go to `http://localhost:3000` → click **Sign in** → **Sign up with email**. Any email/password works locally (no email verification in dev).

---

## How to play — web walkthrough

### Pick a world

After signing in, click **Browse Library** or go to `/library`. You'll see five prebuilt campaigns:

| World | Genre | Tone |
|---|---|---|
| The Shattered Reaches | Dark fantasy | Grim, mythic |
| Mirewood | Gothic horror | Tense, atmospheric |
| The Verdant Wilds | Nature fantasy | Warm, family-safe |
| The Iron Citadel | Steampunk thriller | Sharp, political |
| Crimson Sands | Desert archaeology | Adventurous, mysterious |

Click **Play** on any world.

### Create your character

You'll be prompted for:
1. **Name** — anything you like
2. **Class** — choose from the world's available classes (e.g. Warden, Scholar, Rogue)
3. **Backstory** — one sentence; Claude uses this in narration

### In-game controls

| Key | Action |
|---|---|
| `1`–`9` | Select a choice |
| `Space` / `P` | Pause / resume TTS narration |
| `R` | Replay last GM narration |
| `V` | Activate voice input (Chrome/Edge) |
| `T` | Focus the free-text action input |
| `I` | Read inventory aloud |
| `Q` | Read quest log aloud |
| `L` | Read current location description |
| `S` | Read character status (HP, location, turn) |
| `H` | Show keyboard shortcut help overlay |
| `[` / `]` | Narration speed down / up |
| `M` | Toggle ambient sound |

### Free-text actions

Below the choices there's a text input — type anything. The AI Game Master handles unexpected actions in-character. Examples:
- *"I search the bookshelves for hidden compartments"*
- *"I try to convince the guard I'm a merchant"*
- *"I run away"*

### Voice commands (Chrome/Edge)

Press `V` or click the microphone button. Say:
- **"choose option two"** — picks choice #2
- **"repeat"** — replays last narration
- **"what are my options"** — lists choices aloud
- **"open inventory"** — reads your items
- **"save and quit"** — saves progress and returns home

---

## How to play — mobile walkthrough

### Setup

```bash
# In one terminal — start the Fastify API
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env
# For API dev, DATABASE_URL should be your Postgres URL (not SQLite)
pnpm dev:api

# In another terminal — start Expo
pnpm dev:mobile
# Scan the QR code with Expo Go (iOS/Android)
# or press W for web preview
```

### Screens

| Screen | How to reach it | What it does |
|---|---|---|
| Home | App launch | Start sample adventure, browse library, create/upload world |
| Library | "Library" button or say "library" | Resume campaigns, play community worlds |
| Campaign | After starting a game | Narration transcript, choices, dock controls |
| Create World | "Create World" button | 10-step audio wizard, Claude suggestion chips |
| Upload Bible | "Upload Bible" button | Upload PDF/DOCX/TXT/JSON |
| Accessibility Center | Footer "Accessibility" button | Toggle narrator, cues, haptics, contrast, motion |

### Campaign screen controls

- **Tap a choice** — selects it (light haptic feedback)
- **"Do something else"** button or say **"speak"** — opens voice input
- **Dock buttons**: Mic · Repeat · Recap · Exit
- **Voice commands**: "repeat", "summarize", "inventory", "save", "what are my options"

---

## World Builder Wizard

Available to Creator-tier users. Walks through 10 spoken questions; Claude suggests 3 ideas at every freeform step.

**Web:** `/worlds/new/wizard`  
**Mobile:** "Create World" screen

```
Step 1  — World name        → e.g. "The Obsidian Reach"
Step 2  — One-sentence pitch → e.g. "A dying empire where magic is taxed"
Step 3  — Genre             → e.g. "dark fantasy political thriller"
Step 4  — Setting           → e.g. "Byzantine-era floating city, 800 AD"
Step 5  — GM style          → choice: cinematic / rules-light / mystery / horror / ...
Step 6  — Content rating    → choice: family / teen / mature
Step 7  — Narrator tone     → e.g. "deliberate and dry"
Step 8  — Hard rule         → e.g. "magic always costs blood"
Step 9  — Opening scene     → e.g. "You wake chained in the tax collector's dungeon"
Step 10 — Character name    → e.g. "Mara"
```

After step 10, your world is created and character creation begins immediately.

---

## Upload a Game Bible

Available to Storyteller-tier users. Go to `/worlds/new/upload` (web) or "Upload Bible" (mobile).

Supported formats: **PDF, DOCX, TXT, MD, JSON**

Claude extracts: world name, genre, tone, locations, NPCs, factions, campaign hooks, rules, opening scenario. The world is immediately playable after extraction (< 30 seconds for most documents).

**Tips for best results:**
- Include a section for locations (name, description, connections)
- Include NPC entries (name, role, personality)
- Include at least one opening scene or hook
- Keep under ~80,000 characters (longer files are truncated)

---

## Admin dashboard

Set `ADMIN_EMAILS=your@email.com` in `.env.local`, then go to `/admin`.

Any email listed in `ADMIN_EMAILS` is automatically elevated to **Creator** tier on every sign-in (see `apps/web/lib/admin.ts`), so the same account also has access to the World Builder Wizard, Game Bible upload, creator analytics, and every paid feature — that's why it's the "always-on" account.

**Users tab** — lists all users with tier, world count, session count.  
**Worlds tab** — lists community worlds; toggle publish/unpublish.

### Seed an always-on admin account

The web app ships with a seeder that creates (or upserts) a single admin user from env vars. Put your credentials in **`apps/web/.env.local` only** — never in `.env.example` or any committed file.

```env
# apps/web/.env.local
ADMIN_EMAILS=you@example.com
ADMIN_SEED_EMAIL=you@example.com
ADMIN_SEED_PASSWORD=pick-a-strong-password
ADMIN_SEED_NAME=Owner            # optional display name
```

Then run:

```bash
pnpm --filter @audio-rpg/web db:seed:admin
```

The seeder:
1. Creates the user if missing, or resets the password + tier if they exist.
2. Sets their stored tier to `creator`.
3. Warns if the email isn't also in `ADMIN_EMAILS` (which is what unlocks `/admin` and guarantees the elevation survives even if the DB tier is ever changed).

Sign in at `http://localhost:3000/auth/sign-in` with the email + password you set.

---

## Subscription tiers

| Tier | Price | Key features |
|---|---|---|
| Free | $0 | 5 prebuilt campaigns, browser TTS, keyboard + voice nav, 60 AI minutes |
| Storyteller | $9/mo | ElevenLabs voices, Game Bible upload, unlimited saves |
| Creator | $19/mo | World Builder Wizard, public publishing, creator analytics |
| Enterprise | Custom | Institutional licensing, priority support |

**Accessibility features (narrator, keyboard nav, voice commands, screen reader, haptics) are free on every plan, forever.**

### Enable paid tiers locally (for testing)

Without Stripe configured, you can force a tier in the browser console:

```js
// In browser console on localhost:3000
fetch('/api/auth/refresh-tier', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({ tier: 'creator' })
})
```

Or directly in the SQLite DB:

```bash
cd apps/web
npx prisma studio   # opens at http://localhost:5555
# Find your user → change tier to "storyteller" or "creator"
```

---

## Run CI locally

```bash
# Type-check all packages
pnpm -r typecheck

# Unit + integration tests
pnpm --filter @audio-rpg/shared test
pnpm --filter @audio-rpg/gm-engine test
pnpm --filter @audio-rpg/api test

# Web e2e (Playwright + axe-core) — one-time Chromium install
pnpm --filter @audio-rpg/mobile test:e2e:install
pnpm --filter @audio-rpg/mobile test:e2e
```

---

## CI (GitHub Actions)

Three jobs run on every PR to `main`:

| Job | What it checks |
|---|---|
| `typecheck + unit + in-memory integration` | TypeScript + unit tests + API integration (SQLite) |
| `integration (Postgres + pgvector)` | API integration suite against `pgvector/pgvector:pg16` |
| `web e2e (Playwright + axe-core)` | Builds Expo web bundle, runs Playwright + WCAG 2.1 AA scan |

A manually-dispatched `Credentialed E2E` workflow runs against real external providers (Anthropic, ElevenLabs, Deepgram, Postgres). Trigger from the Actions tab — secrets live in the `credentialed` environment.

---

## Optional integrations

### ElevenLabs (premium voices)

```env
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_NARRATOR=21m00Tcm4TlvDq8ikWAM   # Rachel
ELEVENLABS_VOICE_A=AZnzlk1XvdvUeBnXmlld           # Domi  (NPC slot 1)
ELEVENLABS_VOICE_B=VR6AewLTigWG4xSOukaG           # Arnold (NPC slot 2)
ELEVENLABS_VOICE_C=pNInz6obpgDQGcFmaJgB           # Adam   (NPC slot 3)
```

### Stripe (web subscriptions)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STORYTELLER_MONTHLY=price_...
STRIPE_PRICE_CREATOR_MONTHLY=price_...
```

Run `stripe listen --forward-to localhost:3000/api/payments/webhook` during local testing.

### Push notifications (web)

```bash
npx web-push generate-vapid-keys
```

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
```

### Email (Resend)

```env
RESEND_API_KEY=re_...
RESEND_FROM=EchoQuest <noreply@yourdomain.com>
```

---

## Architecture

```
Player action
  → /api/game/action (Next.js SSE route)
  → moderatePlayerInput()          ← safety check before Claude
  → ContextBuilder
      Layer 1: GM identity (~500 tokens, static)
      Layer 2: World system prompt (~1500 tokens)
      Layer 3: Character state (~300 tokens)
      Layer 4: World flags + weather (~400 tokens)
      Layer 5: Memory summary (compressed older turns)
      Layer 6: Recent history (last 15–20 turns)
  → Claude API (streaming)
  → moderateGMOutput()             ← safety check after Claude
  → ResponseParser
      narration → browser TTS queue
      choices  → ChoiceList component
      soundCue → AmbientPlayer / haptics
      state    → Zustand game-store → DB persist
```

**Memory compression**: every 15 turns a fire-and-forget Claude call compresses the oldest batch into a `memorySummary` row. The summary is always included in the prompt regardless of context window pressure.

---

## Design pillars

1. **Audio-first.** Every flow works without looking at the screen. Narration, choices, and utility commands are all voice-addressable from any screen.
2. **Accessibility is free forever.** Narrator, keyboard nav, voice commands, screen reader support, sound cues, and haptics are never paywalled.
3. **Structured state, narrative model.** The GM narrates; the reducer (`packages/gm-engine`) owns inventory, quests, relationships, and flags. Claude never invents what's in your bag.
4. **Single design system.** Token constants (`apps/mobile/src/design/tokens.ts`) ensure consistent midnight-navy surfaces and violet `#7c6af7` accent across all screens.

---

## Key files

| Path | Purpose |
|---|---|
| `packages/shared/src/gm.ts` | GM turn Zod schema |
| `packages/shared/src/bible.ts` | GameBible Zod schema |
| `packages/gm-engine/src/reducer.ts` | State mutation logic |
| `apps/api/src/routes/session.ts` | WebSocket game loop |
| `apps/api/src/gm/orchestrator.ts` | Turn orchestration + summarization |
| `apps/web/app/api/game/action/route.ts` | Next.js streaming SSE route |
| `apps/web/lib/ai/gm-engine.ts` | Claude context builder |
| `apps/web/lib/safety/moderator.ts` | Content safety layer |
| `apps/web/lib/wizard/steps.ts` | Wizard step definitions |
| `apps/web/prisma/schema.prisma` | Database schema |
| `apps/mobile/src/design/tokens.ts` | EchoQuest design tokens |
| `apps/mobile/app/campaign/[id].tsx` | Active campaign screen |
| `apps/mobile/app/create.tsx` | Mobile World Builder Wizard |
| `apps/mobile/src/audio/cues.ts` | Sound cues + haptic mapping |
| `packages/shared/src/entitlements.ts` | Tier definitions + pricing |
