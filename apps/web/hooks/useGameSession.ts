"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/game-store";
import { useAudioStore } from "@/store/audio-store";
import { useEntitlementsStore } from "@/store/entitlements-store";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak, stopSpeech } from "@/lib/audio/tts-provider";
import { speakNarrationMultiVoice } from "@/lib/audio/narration-speaker";
import { playSoundCue } from "@/lib/audio/sound-cues";
import type { PlayerAction, NarrationEntry, GMResponse, SoundCue, SceneTransition, PassiveBonus, AchievementUnlock, CodexEntry } from "@/types/game";
import { createOptimisticTurn, extractNarrationFromChoiceEvent, finalizeTurn, retryWithBackoff, sanitizeAction, shouldPlaySoundCue } from "@/src/domain/game/use-cases";
import { advanceSession, validateActionEligibility, type ActionRequestGateway } from "@/src/domain/session/use-cases";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";
import type { InMemorySession } from "@/types/game";

// Mirrors the server-side window in lib/ai/memory/context-window.ts: keep the
// most recent ~40k chars of history. The server trims again on receipt; this
// just keeps us from uploading 100s of KB on long sessions.
const HISTORY_TRIM_CHARS = 40_000 * 4;

function trimSessionHistory(session: InMemorySession): InMemorySession {
  const history = session.history ?? [];
  let totalChars = history.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars <= HISTORY_TRIM_CHARS) return session;
  const trimmed = [...history];
  while (totalChars > HISTORY_TRIM_CHARS && trimmed.length > 2) {
    const removed = trimmed.shift();
    if (removed) totalChars -= removed.content.length;
  }
  return { ...session, history: trimmed };
}

export function useGameSession() {
  const {
    session,
    character,
    world,
    dbSessionId,
    addNarrationEntry,
    setChoices,
    setIsGenerating,
    incrementTurnCount,
    updateFlags,
    updateHP,
    updateStat,
    applyInventoryMutation,
    applyQuestMutation,
    unlockAchievement,
    updateNpcRelationship,
    addCodexEntry,
    updateLocation,
    setMemorySummary,
    capturePreTurn,
  } = useGameStore();

  const { ttsSpeed, ttsPitch, volume, soundCuesEnabled } = useAudioStore();
  const { entitlements } = useEntitlementsStore();
  const { announce } = useAnnouncer();
  // Per-session NPC name → voice slot map (A/B/C), reset when session changes
  const npcVoiceMapRef = useRef<Map<string, "A" | "B" | "C">>(new Map());
  // Last-rendered skill_check signature, used to dedupe the dice-result system
  // entry. The GM doesn't clear flags.last_skill_check between turns, so the
  // same flag value can arrive on multiple subsequent state_change events.
  const lastRenderedSkillCheckRef = useRef<string | null>(null);
  const [lastNarration, setLastNarration] = useState("");
  const [sceneTransitionHint, setSceneTransitionHint] = useState<SceneTransition | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  // Reset the NPC voice map whenever a new session starts
  useEffect(() => {
    npcVoiceMapRef.current = new Map();
    lastRenderedSkillCheckRef.current = null;
  }, [session?.id]);

  useEffect(() => {
    const latestNarration = [...(session?.narrationLog ?? [])]
      .reverse()
      .find((entry) => entry.type === "narration");
    setLastNarration(latestNarration?.text ?? "");
  }, [session]);

  const replayLast = useCallback(() => {
    if (!lastNarration) return;
    stopSpeech();
    speak(lastNarration, { rate: ttsSpeed, pitch: ttsPitch, volume });
  }, [lastNarration, ttsSpeed, ttsPitch, volume]);

  const speakText = useCallback(
    (text: string) => {
      return speak(text, { rate: ttsSpeed, pitch: ttsPitch, volume });
    },
    [ttsSpeed, ttsPitch, volume]
  );

  const submitAction = useCallback(
    async (action: PlayerAction) => {
      const normalizedAction = sanitizeAction(action);
      if (!normalizedAction) return;

      const eligibility = validateActionEligibility({ session, character, world, action: normalizedAction });
      if (!eligibility.allowed) return;

      if (!session || !character || !world) return;

      // Synchronous guard: prevents a second submit firing in the same render
      // cycle before setIsGenerating(true) has re-rendered.
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      // Stop any current TTS
      stopSpeech();

      // Full pre-turn snapshot. The optimistic narrative-only rollback below
      // misses character + session-side mutations (HP, XP, inventory, quests,
      // flags, relationships, codex, achievements, location) that fire from
      // mid-stream state_change events. If the stream errors after some have
      // landed, we'd otherwise leak partial state into the next turn.
      const preTurnCharacter = useGameStore.getState().character;
      const preTurnSession = useGameStore.getState().session;

      const optimistic = createOptimisticTurn(
        {
          isGenerating: session.isGenerating,
          narrationLog: session.narrationLog,
          history: session.history,
          choices: session.choices,
        },
        normalizedAction,
      );
      addNarrationEntry(optimistic.playerEntry);
      setIsGenerating(true);

      // Abort any in-flight request
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      let accumulatedNarration = "";
      let narrationBuffer = "";
      let receivedStreamError = false;
      let streamErrorMessage: string | null = null;

      try {
        const gateway: ActionRequestGateway = {
          submit: ({ action: reqAction, session: reqSession, character: reqCharacter, world: reqWorld, dbSessionId: reqDbSessionId, signal }) =>
            fetch("/api/game/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal,
              body: JSON.stringify({
                action: reqAction,
                // The server (lib/ai/memory/context-window.ts) keeps the most
                // recent ~40k chars of history anyway. Sending the full
                // unbounded log every turn just wastes bandwidth and grows
                // proportionally to session length. Trim history client-side
                // to the same window before posting.
                session: trimSessionHistory(reqSession),
                character: reqCharacter,
                world: reqWorld,
                dbSessionId: reqDbSessionId,
              }),
            }),
        };

        const res = await retryWithBackoff(() => advanceSession(gateway, {
          action: normalizedAction,
          session,
          character,
          world,
          dbSessionId,
          signal: abort.signal,
        }), 2, 150);

        if (!res.ok) {
          let message = `GM request failed: ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`;
          try {
            const errBody = await res.json() as { message?: string; error?: string };
            if (errBody.message) message = errBody.message;
            else if (errBody.error) message = `${message} — ${errBody.error}`;
          } catch { /* ignore parse errors */ }
          throw new Error(message);
        }
        if (!res.body) {
          throw new Error("GM request failed: no response body");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let eventType = "";
        let dataLine = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataLine = line.slice(6).trim();
            } else if (line === "" && eventType && dataLine) {
              const data = JSON.parse(dataLine);

              if (eventType === "narration_chunk") {
                narrationBuffer += data.text;
                accumulatedNarration += data.text;
              } else if (eventType === "sound_cue") {
                const cue = (data.cue as SoundCue | null) ?? null;
                if (shouldPlaySoundCue(soundCuesEnabled, eventType, cue)) {
                  playSoundCue(cue);
                }
              } else if (eventType === "state_change") {
                const change = data as Record<string, unknown>;
                if (change.hp !== undefined && change.hp !== null) {
                  updateHP(change.hp as number);
                }
                if (change.statDeltas && typeof change.statDeltas === "object") {
                  const levelBefore = useGameStore.getState().character?.stats.level ?? 1;
                  for (const [stat, delta] of Object.entries(change.statDeltas as Record<string, unknown>)) {
                    if (typeof delta === "number" && Number.isFinite(delta)) updateStat(stat, delta);
                  }
                  const levelAfter = useGameStore.getState().character?.stats.level ?? 1;
                  if (levelAfter > levelBefore) {
                    const levelUpMsg = `Level up! You are now level ${levelAfter}.`;
                    announce(levelUpMsg, "assertive");
                    speakText(levelUpMsg);
                    if (soundCuesEnabled) playSoundCue("level_up");
                    addNarrationEntry({
                      id: `levelup-${Date.now()}`,
                      text: `⬆ ${levelUpMsg}`,
                      type: "system",
                      timestamp: new Date(),
                    });
                  }
                }
                if (change.flags) {
                  updateFlags(change.flags as Record<string, unknown>);
                }
                if (Array.isArray(change.achievementUnlocks)) {
                  for (const ach of change.achievementUnlocks as AchievementUnlock[]) {
                    const alreadyUnlocked = useGameStore.getState().session?.achievements?.some((a) => a.key === ach.key);
                    if (alreadyUnlocked) continue;
                    unlockAchievement({ ...ach, unlockedAt: useGameStore.getState().session?.turnCount ?? 0 });
                    const achMsg = `🏆 Achievement unlocked: ${ach.title} — ${ach.description}`;
                    announce(achMsg, "assertive");
                    speakText(achMsg);
                    if (soundCuesEnabled) playSoundCue("discovery");
                    addNarrationEntry({ id: `ach-${ach.key}-${Date.now()}`, text: achMsg, type: "system", timestamp: new Date() });
                  }
                }
                if (Array.isArray(change.npcRelationshipChanges)) {
                  for (const rel of change.npcRelationshipChanges as Array<{ npcId: string; name: string; standing: number; notes?: string }>) {
                    updateNpcRelationship(rel);
                  }
                }
                if (Array.isArray(change.codexEntries)) {
                  for (const entry of change.codexEntries as CodexEntry[]) {
                    if (useGameStore.getState().session?.codex?.some((c) => c.key === entry.key)) continue;
                    addCodexEntry({ ...entry, unlockedAt: useGameStore.getState().session?.turnCount ?? 0 });
                    const loreMsg = `📖 Lore discovered: ${entry.title}`;
                    announce(loreMsg, "polite");
                    if (soundCuesEnabled) playSoundCue("discovery");
                    addNarrationEntry({ id: `codex-${entry.key}-${Date.now()}`, text: loreMsg, type: "system", timestamp: new Date() });
                  }
                }
                if (change.locationId) {
                  updateLocation(change.locationId as string);
                }
                if (Array.isArray(change.inventoryChanges)) {
                  for (const mut of change.inventoryChanges as import("@/types/game").ItemMutation[]) {
                    applyInventoryMutation(mut);
                  }
                }
                if (change.sceneTransition && typeof change.sceneTransition === "object") {
                  const transition = change.sceneTransition as Partial<SceneTransition>;
                  if (transition.type && transition.title) {
                    setSceneTransitionHint({
                      type: transition.type,
                      title: transition.title,
                      subtitle: transition.subtitle,
                      durationMs: transition.durationMs,
                    });
                  }
                }
                if (Array.isArray(change.questChanges)) {
                  for (const mut of change.questChanges as import("@/types/game").QuestMutation[]) {
                    applyQuestMutation(mut);
                  }
                }
                if (Array.isArray(change.passiveBonuses)) {
                  updateFlags({ passiveBonuses: change.passiveBonuses as PassiveBonus[] });
                }
                if (Array.isArray(change.passiveBonusNarration) && change.passiveBonusNarration.length > 0) {
                  addNarrationEntry({
                    id: (Date.now() + 3).toString(),
                    text: `Combat modifiers: ${(change.passiveBonusNarration as string[]).join(" ")}`,
                    type: "system",
                    timestamp: new Date(),
                  });
                }
              } else if (eventType === "choices_ready") {
                const gmResp = data as Pick<GMResponse, "choices" | "narration" | "npcAction">;
                const { narration, choices } = extractNarrationFromChoiceEvent(gmResp);
                setChoices(choices);
                setLastNarration(narration);

                const narEntry: NarrationEntry = {
                  id: (Date.now() + 1).toString(),
                  text: narration,
                  type: "narration",
                  timestamp: new Date(),
                };
                addNarrationEntry(narEntry);

                // Skill check resolution arrives as flags.last_skill_check on
                // this turn's state_change. We render the result entry AFTER
                // the narration that introduces the check so the order in the
                // log reads naturally — narration setup, then dice outcome —
                // instead of dice-result-then-the-setup-it-resolved.
                const flags = useGameStore.getState().session?.globalFlags as Record<string, unknown> | undefined;
                if (
                  flags &&
                  typeof flags.last_skill_check === "string" &&
                  flags.last_skill_check !== lastRenderedSkillCheckRef.current
                ) {
                  try {
                    const sc = JSON.parse(flags.last_skill_check) as {
                      stat: string; roll: number; modifier: number; dc: number; total: number; success: boolean; label: string;
                    };
                    const sign = sc.modifier >= 0 ? `+${sc.modifier}` : `${sc.modifier}`;
                    addNarrationEntry({
                      id: `sc-${Date.now()}`,
                      text: `🎲 ${sc.stat.toUpperCase()} check — ${sc.label}: rolled ${sc.roll} ${sign} = ${sc.total} vs DC ${sc.dc} — ${sc.success ? "Success!" : "Failure."}`,
                      type: "system",
                      timestamp: new Date(),
                    });
                    lastRenderedSkillCheckRef.current = flags.last_skill_check;
                  } catch { /* malformed flag — skip */ }
                }

                if (entitlements.premiumTts && character) {
                  await speakNarrationMultiVoice(
                    narration,
                    character.name,
                    npcVoiceMapRef.current,
                    abort.signal,
                  );
                } else {
                  // Browser TTS keepalive (browser-tts.ts) keeps the engine
                  // alive across the full narration, so we no longer need to
                  // chunk per sentence — chunking introduced an audible gap
                  // between sentences where the synthesis engine restarted.
                  if (!abort.signal.aborted) {
                    await speakText(narration);
                  }
                }
              } else if (eventType === "memory_summary") {
                // Server compacted older history into a memory summary; persist
                // it so subsequent turns send the compacted form rather than
                // re-sending the long uncompacted history.
                const summaryData = data as { summary?: unknown };
                if (typeof summaryData.summary === "string") {
                  setMemorySummary(summaryData.summary);
                }
              } else if (eventType === "error") {
                receivedStreamError = true;
                const errorMessage = data?.message ?? "Narrator degraded mode is active.";
                streamErrorMessage = errorMessage;
                console.error("GM error:", data.message);
                addNarrationEntry({
                  id: (Date.now() + 2).toString(),
                  text: errorMessage,
                  type: "system",
                  timestamp: new Date(),
                });
                break;
              }

              eventType = "";
              dataLine = "";
            }
          }

          if (receivedStreamError) break;
        }

        if (receivedStreamError) {
          // Full rollback: restore the pre-turn character + session and only
          // re-apply the player-action narration entry + the (system) error
          // message. Any mid-stream state mutations are discarded.
          useGameStore.setState({
            character: preTurnCharacter,
            session: preTurnSession
              ? {
                ...preTurnSession,
                narrationLog: streamErrorMessage
                  ? [
                    ...preTurnSession.narrationLog,
                    optimistic.playerEntry,
                    {
                      id: (Date.now() + 4).toString(),
                      text: streamErrorMessage,
                      type: "system",
                      timestamp: new Date(),
                    },
                  ]
                  : [...preTurnSession.narrationLog, optimistic.playerEntry],
                isGenerating: false,
                choices: preTurnSession.choices,
                history: preTurnSession.history,
              }
              : null,
          });
          return;
        }

        // Update session history for context continuity
        const finalized = finalizeTurn(
          {
            isGenerating: true,
            narrationLog: session.narrationLog,
            history: session.history,
            choices: session.choices,
          },
          normalizedAction,
          accumulatedNarration,
          session.choices,
        );

        useGameStore.setState((s) => ({
          session: s.session
            ? { ...s.session, history: finalized.history }
            : null,
        }));

        // Capture the pre-turn snapshot as the undo target. Only on successful
        // completion — if the turn errored we already rolled back to this same
        // snapshot, so making it the undo target would be a no-op.
        if (preTurnCharacter && preTurnSession) {
          capturePreTurn({ character: preTurnCharacter, session: preTurnSession });
        }

        incrementTurnCount();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Game session error:", err);
          // Full rollback to the pre-turn snapshot — same reasoning as the
          // stream-error path above. The optimistic player_action entry is
          // dropped entirely on a hard failure since the action never landed.
          useGameStore.setState({
            character: preTurnCharacter,
            session: preTurnSession
              ? { ...preTurnSession, isGenerating: false }
              : null,
          });
        }
      } finally {
        inFlightRef.current = false;
        setIsGenerating(false);
      }
    },
    [
      session, character, world, dbSessionId, addNarrationEntry, setChoices,
      setIsGenerating, incrementTurnCount, updateFlags, updateHP, updateStat,
      applyInventoryMutation, applyQuestMutation, unlockAchievement, updateNpcRelationship, addCodexEntry, updateLocation,
      setMemorySummary, capturePreTurn, speakText, soundCuesEnabled, announce,
    ]
  );

  const previousTurn = useGameStore((s) => s.previousTurn);
  const undoLastTurn = useCallback(() => {
    // Stop any in-flight TTS before snapping back so the user doesn't hear a
    // sentence from the now-stale state continuing over the restored scene.
    stopSpeech();
    const ok = useGameStore.getState().undoLastTurn();
    announce(ok ? "Last turn undone." : "Nothing to undo.", "polite");
    return ok;
  }, [announce]);

  return {
    session,
    character,
    world,
    submitAction,
    replayLast,
    speakText,
    lastNarration,
    sceneTransitionHint,
    clearSceneTransitionHint: () => setSceneTransitionHint(null),
    canUndo: previousTurn !== null && !session?.isGenerating,
    undoLastTurn,
  };
}
