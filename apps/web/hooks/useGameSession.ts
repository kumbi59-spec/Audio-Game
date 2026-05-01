"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/game-store";
import { useAudioStore } from "@/store/audio-store";
import { useEntitlementsStore } from "@/store/entitlements-store";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { splitIntoSentences } from "@/lib/audio/audio-queue";
import { speak, stopSpeech } from "@/lib/audio/tts-provider";
import { speakNarrationMultiVoice } from "@/lib/audio/narration-speaker";
import { playSoundCue } from "@/lib/audio/sound-cues";
import type { PlayerAction, NarrationEntry, GMResponse, SoundCue } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";

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
    updateLocation,
  } = useGameStore();

  const { ttsSpeed, ttsPitch, volume, soundCuesEnabled } = useAudioStore();
  const { entitlements } = useEntitlementsStore();
  const { announce } = useAnnouncer();
  // Per-session NPC name → voice slot map (A/B/C), reset when session changes
  const npcVoiceMapRef = useRef<Map<string, "A" | "B" | "C">>(new Map());
  const [lastNarration, setLastNarration] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Reset the NPC voice map whenever a new session starts
  useEffect(() => {
    npcVoiceMapRef.current = new Map();
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
      if (!session || !character || !world || session.isGenerating) return;

      // Stop any current TTS
      stopSpeech();

      // Record the player's action in the narration log
      const playerEntry: NarrationEntry = {
        id: Date.now().toString(),
        text: action.content,
        type: "player_action",
        timestamp: new Date(),
      };
      addNarrationEntry(playerEntry);
      setIsGenerating(true);

      // Abort any in-flight request
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      let accumulatedNarration = "";
      let narrationBuffer = "";

      try {
        const res = await fetch("/api/game/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abort.signal,
          body: JSON.stringify({ action, session, character, world, dbSessionId: dbSessionId ?? undefined }),
        });

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
              } else if (eventType === "sound_cue" && soundCuesEnabled) {
                playSoundCue(data.cue as SoundCue);
              } else if (eventType === "state_change") {
                const change = data as Record<string, unknown>;
                if (change.hp !== undefined && change.hp !== null) {
                  updateHP(change.hp as number);
                }
                if (change.statDeltas && typeof change.statDeltas === "object") {
                  const levelBefore = useGameStore.getState().character?.stats.level ?? 1;
                  for (const [stat, delta] of Object.entries(change.statDeltas as Record<string, number>)) {
                    updateStat(stat, delta);
                  }
                  const levelAfter = useGameStore.getState().character?.stats.level ?? 1;
                  if (levelAfter > levelBefore) {
                    const levelUpMsg = `Level up! You are now level ${levelAfter}.`;
                    announce(levelUpMsg, "assertive");
                    speakText(levelUpMsg);
                    if (soundCuesEnabled) playSoundCue("level_up");
                  }
                }
                if (change.flags) {
                  updateFlags(change.flags as Record<string, unknown>);
                }
                if (change.locationId) {
                  updateLocation(change.locationId as string);
                }
                if (Array.isArray(change.inventoryChanges)) {
                  for (const mut of change.inventoryChanges as import("@/types/game").ItemMutation[]) {
                    applyInventoryMutation(mut);
                  }
                }
                if (Array.isArray(change.questChanges)) {
                  for (const mut of change.questChanges as import("@/types/game").QuestMutation[]) {
                    applyQuestMutation(mut);
                  }
                }
              } else if (eventType === "choices_ready") {
                // Full response parsed — update choices and add narration entry
                const gmResp = data as Pick<GMResponse, "choices" | "narration" | "npcAction">;
                setChoices(gmResp.choices);
                setLastNarration(gmResp.narration);

                const narEntry: NarrationEntry = {
                  id: (Date.now() + 1).toString(),
                  text: gmResp.narration,
                  type: "narration",
                  timestamp: new Date(),
                };
                addNarrationEntry(narEntry);

                // Speak narration — multi-voice for Storyteller+, plain for free
                if (entitlements.premiumTts && character) {
                  await speakNarrationMultiVoice(
                    gmResp.narration,
                    character.name,
                    npcVoiceMapRef.current,
                    abort.signal,
                  );
                } else {
                  const sentences = splitIntoSentences(gmResp.narration);
                  for (const sentence of sentences) {
                    if (abort.signal.aborted) break;
                    await speakText(sentence);
                  }
                }
              } else if (eventType === "error") {
                console.error("GM error:", data.message);
              }

              eventType = "";
              dataLine = "";
            }
          }
        }

        // Update session history for context continuity
        const updatedHistory = [
          ...session.history,
          { role: "user" as const, content: action.content },
          { role: "assistant" as const, content: accumulatedNarration },
        ];

        useGameStore.setState((s) => ({
          session: s.session
            ? { ...s.session, history: updatedHistory }
            : null,
        }));

        incrementTurnCount();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Game session error:", err);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [
      session, character, world, dbSessionId, addNarrationEntry, setChoices,
      setIsGenerating, incrementTurnCount, updateFlags, updateHP, updateStat,
      applyInventoryMutation, applyQuestMutation, updateLocation,
      speakText, soundCuesEnabled, announce,
    ]
  );

  return {
    session,
    character,
    world,
    submitAction,
    replayLast,
    speakText,
    lastNarration,
  };
}
