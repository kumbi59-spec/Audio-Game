import type { CharacterData } from "@/types/character";
import type { PlayerAction } from "@/types/game";
import type { WorldData } from "@/types/world";

export interface SessionSnapshot {
  id: string;
  turnCount: number;
  isGenerating: boolean;
  choices: string[];
  revision?: number;
}
export interface SessionBundle { session: SessionSnapshot; character: CharacterData; world: WorldData; dbSessionId: string | null; }
export interface ActionEligibility { allowed: boolean; reason?: "missing_context" | "turn_in_flight" | "invalid_choice"; }
export interface ActionRequestGateway { submit(input: { action: PlayerAction; session: SessionSnapshot; character: CharacterData; world: WorldData; dbSessionId?: string; signal: AbortSignal; }): Promise<Response>; }
export interface SessionStorage { save(snapshot: SessionSnapshot): void; }
export interface ReconcileInput<TState> { optimistic: TState; server: TState; clientRevision?: number; serverRevision?: number; }
export type ReconcileResult<TState> = { status: "accepted"; state: TState } | { status: "conflict"; state: TState; reason: "version_skew" };

export function startSession(bundle: Omit<SessionBundle, "dbSessionId"> & { dbSessionId?: string | null }): SessionBundle { return { ...bundle, dbSessionId: bundle.dbSessionId ?? null }; }
export function resumeSession(bundle: SessionBundle, storage: SessionStorage): SessionBundle { storage.save(bundle.session); return bundle; }

export function validateActionEligibility(ctx: { session: SessionSnapshot | null; character: CharacterData | null; world: WorldData | null; action: PlayerAction; }): ActionEligibility {
  const { session, character, world, action } = ctx;
  if (!session || !character || !world) return { allowed: false, reason: "missing_context" };
  if (session.isGenerating) return { allowed: false, reason: "turn_in_flight" };
  if (action.type === "choice") {
    const idx = action.choiceIndex ?? -1;
    if (idx < 0 || idx >= session.choices.length) return { allowed: false, reason: "invalid_choice" };
  }
  return { allowed: true };
}

export async function advanceSession(gateway: ActionRequestGateway, input: { action: PlayerAction; session: SessionSnapshot; character: CharacterData; world: WorldData; dbSessionId: string | null; signal: AbortSignal; }): Promise<Response> {
  return gateway.submit({ ...input, dbSessionId: input.dbSessionId ?? undefined });
}

export function reconcileOptimisticState<TState>(input: ReconcileInput<TState>): ReconcileResult<TState> {
  const { optimistic, server, clientRevision, serverRevision } = input;
  if (typeof clientRevision === "number" && typeof serverRevision === "number" && serverRevision < clientRevision) {
    return { status: "conflict", state: server, reason: "version_skew" };
  }
  return { status: "accepted", state: server ?? optimistic };
}
