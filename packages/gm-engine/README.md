# @audio-rpg/gm-engine

Shared GM engine package: typed prompt builder, deterministic state reducer,
memory bundle composition, Game Bible ingestion, and embedding interfaces.

## Who uses this package today

- `apps/api` (Hono backend) — primary consumer. Uses `buildSystemPrompt`,
  `buildTurnUserPrompt`, `applyMutations`, `chunkBible`, `MemoryStore`,
  `Embedder`, and the orchestrator helpers.
- `apps/mobile` — uses `applyMutations` for client-side state reducer parity.
- `apps/web` — **does not use this package**. The web client reimplements
  its own prompt (`apps/web/lib/ai/prompts/system.ts`) and state mutations
  (`apps/web/store/game-store.ts`, `apps/web/hooks/useGameSession.ts`)
  because it talks to Anthropic directly via Next.js route handlers
  rather than through `apps/api`.

## Two prompt systems exist by design (for now)

The web client's GM is feature-comparable to this package's prompt — same
achievement keys, NPC dialogue format, skill-check rules, choice quality
rules — but they're structurally separate. Migrating the web client to use
this package would require:

1. Constructing a `GameBible` from the existing `WorldData` (different
   typed shape — `WorldData` carries a free-form `systemPrompt` string,
   `GameBible` has typed `tone`, `rules`, `entities` etc.).
2. Constructing `CampaignState` from `InMemorySession` + `CharacterData`.
3. Implementing a web-side `MemoryStore` adapter against Prisma + pgvector.
4. Aligning the response schema (the package returns `state_mutations`
   list; the web expects flattened `stateChanges` with `inventoryChanges`
   etc.).

This is a multi-day refactor with real risk to gameplay balance. Track it
as a separate workstream rather than rolling it into incremental work.

## Reducer is the source of truth for level-up math

`applyMutation` in `src/reducer.ts` is the canonical implementation of
XP→level math: threshold = `level² × 100`, `+5 maxHp` per level, and
alternating stat bonuses (odd levels boost STR+DEX, even levels boost
INT+CHA). The web client's `game-store.ts` mirrors this in the
`updateStat` action so XP gains auto-level on the web too — keep them
in sync when adjusting balance.
