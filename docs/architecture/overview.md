# Architecture Overview

## Purpose
EchoQuest is an accessibility-first audio RPG platform spanning web, mobile, and API surfaces with shared domain schemas and a deterministic game-state engine.

## System Boundaries
- `apps/web`: Next.js 15 app router experience for account, library, world management, and browser-based gameplay.
- `apps/mobile`: Expo application focused on touch, voice, and haptic-first play.
- `apps/api`: Fastify API providing websocket session play, auth/world/campaign routes, ingestion, TTS/STT proxies, and orchestration.
- `packages/shared`: Shared Zod schemas and typed event contracts used across apps.
- `packages/gm-engine`: Deterministic reducer + prompt assembly + memory retrieval primitives.

## Runtime Interfaces
- **Web/mobile to API**
  - WebSocket `/session` for turn-based gameplay events.
  - HTTP endpoints for auth, worlds, campaigns, wizard, media, and health.
- **API to model providers**
  - Anthropic for turn generation and recap.
- **API to storage**
  - In-memory and persistent stores (Postgres and embeddings-backed memory where configured).

## Core Design Principles
1. Accessibility-first interactions are a product requirement, not an optional enhancement.
2. Model output is advisory; canonical game state is reducer-managed.
3. Shared schemas define cross-service contracts and reduce drift.
4. Graceful degradation for optional integrations (e.g., premium voice, payments, email).

## Ownership Model
- Product/UI behavior lives in app-specific directories.
- Gameplay domain contracts and mutation semantics live in shared packages.
- API owns transport, orchestration, validation, and persistence boundaries.

## Transport Versioning Policy
- All API HTTP responses and realtime websocket messages must use a transport envelope with `version`, `kind`, `payload`, and `sentAt` fields.
- Current supported envelope versions: `1`.
- Realtime session payloads keep their inner event `v` marker (`v1`) for legacy compatibility while clients migrate.

### Deprecation Window
- New envelope versions must remain backward-compatible for at least **two minor releases** after introduction.
- Legacy (non-enveloped) realtime payload acceptance is temporary and should be removed after the same two-release window once client telemetry confirms migration.

### Breaking-Change Migration Checklist
1. Introduce a new envelope `version` and add it to shared supported-version constants.
2. Keep validators dual-path (new + previous version) during the deprecation window.
3. Add fixture replay tests for at least one payload from each supported/legacy version.
4. Add server emitters for the new version and keep old emit path only when explicitly required.
5. Update client parsers before removing old-version support.
6. Announce removal date and delete deprecated validators/fixtures after window expiry.
