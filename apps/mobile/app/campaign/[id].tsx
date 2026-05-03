import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { useVoiceCommands } from "@/voice/commandBus";
import { useSession } from "@/session/store";
import { sessionConnection } from "@/session/connection";
import { feedNarration, speakAfterNarration, speakOnce, stopNarration } from "@/audio/narrator";
import { playCue } from "@/audio/cues";
import { captureUtterance } from "@/voice/stt";
import { usePrefs } from "@/prefs/store";
import { EQ, R, SPACE, FS, TOUCH_MIN, CHOICE_MIN } from "@/design/tokens";
import { useCan } from "@/entitlements/store";
import { AdBanner } from "@/entitlements/AdBanner";
import { AiMinutesSheet } from "@/entitlements/AiMinutesSheet";
import { UpgradePrompt } from "@/entitlements/UpgradePrompt";
import { parseChoiceCommand } from "@/domain/session/use-cases";

export default function ActiveCampaign(): JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const headingRef = useRef<Text>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lastBlockedPromptAtRef = useRef(0);
  const session = useSession();
  const can = useCan();
  const { hapticsEnabled } = usePrefs();
  const [minutesSheetVisible, setMinutesSheetVisible] = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [showFirstTurnTips, setShowFirstTurnTips] = useState(false);
  const canAcceptInput = !session.awaitingGm;

  useLandmarkAnnounce(
    "Active campaign",
    session.title
      ? `Playing ${session.title}. ${session.choices.length ? `${session.choices.length} choices available.` : "Listen for the next scene."}`
      : "Connecting to your campaign.",
    headingRef,
  );

  useEffect(() => {
    const unsub = sessionConnection.onServerEvent((evt) => {
      if (evt.type === "narration_chunk") {
        feedNarration(evt.text, evt.done);
      } else if (evt.type === "sound_cue") {
        void playCue(evt.cue);
      } else if (evt.type === "recap_ready") {
        void speakOnce(evt.summary);
      } else if (evt.type === "error" && evt.code === "turn_limit_reached") {
        setUpgradeVisible(true);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [session.transcript.length]);

  useEffect(() => {
    const hasPlayerActed = session.transcript.some((t) => t.role === "player");
    const isEarlyTurn = (session.state?.turn_number ?? 0) <= 1;
    setShowFirstTurnTips(isEarlyTurn && !hasPlayerActed);
  }, [session.state?.turn_number, session.transcript]);

  useEffect(() => {
    return () => {
      stopNarration();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaveCampaign = useCallback(() => {
    sessionConnection.pause();
    session.reset();
    router.replace("/");
  }, [router, session]);

  const announceBlockedInput = useCallback(() => {
    const now = Date.now();
    if (now - lastBlockedPromptAtRef.current < 1500) return;
    lastBlockedPromptAtRef.current = now;
    void playCue("failure");
    speakAfterNarration("Please wait for the narrator to finish.");
  }, []);

  // Show paywall when the free-tier turn limit is hit
  useEffect(() => {
    const limit = can.sessionTurnLimit;
    const turn = session.state?.turn_number ?? 0;
    if (limit !== null && turn >= limit) {
      if (can.aiMinutesRemaining !== null && can.aiMinutesRemaining > 0) {
        setMinutesSheetVisible(true);
      } else {
        setUpgradeVisible(true);
      }
    }
  }, [session.state?.turn_number, can.sessionTurnLimit, can.aiMinutesRemaining]);

  const pickChoice = useCallback(
    (choiceId: string, label: string) => {
      if (!canAcceptInput) {
        announceBlockedInput();
        return;
      }
      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      stopNarration();
      session.appendPlayer(label);
      sessionConnection.sendPlayerInput({ kind: "choice", choiceId });
    },
    [announceBlockedInput, canAcceptInput, session, hapticsEnabled],
  );

  const speakFreeform = useCallback(async () => {
    if (!canAcceptInput) {
      announceBlockedInput();
      return;
    }
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    stopNarration();
    void speakOnce("Listening.");
    const transcript = await captureUtterance();
    if (!transcript) return;
    const idx = parseChoiceCommand(transcript);
    if (idx !== null) {
      const choice = session.choices[idx];
      if (choice) { pickChoice(choice.id, choice.label); return; }
    }
    session.appendPlayer(transcript);
    sessionConnection.sendPlayerInput({ kind: "freeform", text: transcript });
  }, [announceBlockedInput, canAcceptInput, pickChoice, session, hapticsEnabled]);

  useVoiceCommands({
    "repeat|read that again": () => {
      const last = [...session.transcript].reverse().find((t) => t.role === "gm");
      if (last) void speakOnce(last.text);
    },
    "summarize|where am i|what just happened": () => sessionConnection.requestRecap(),
    "what are my options|list choices": () => {
      const list = session.choices.map((c, i) => `${i + 1}: ${c.label}.`).join(" ");
      void speakOnce(list || "No choices yet.");
    },
    "inventory|what do i have": () => {
      const inv = session.state?.inventory ?? [];
      void speakOnce(inv.length === 0 ? "Your bag is empty." : inv.map((i) => `${i.quantity} ${i.name}`).join(", "));
    },
    "save|save and pause|pause": () => {
      if (!canAcceptInput) {
        announceBlockedInput();
        return;
      }
      void speakOnce("Paused. Returning home.");
      leaveCampaign();
    },
    "do something else|custom action|speak": () => { void speakFreeform(); },
  });

  if (!session.connected || !session.state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={EQ.accent} size="large" accessibilityLabel="Connecting to your campaign." />
        <Text style={styles.connectingText} accessibilityLiveRegion="polite">
          Connecting to your campaign…
        </Text>
      </View>
    );
  }

  const lastGm = [...session.transcript].reverse().find((t) => t.role === "gm");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text ref={headingRef} role="heading" aria-level={1} style={styles.h1}>
          {session.title}
        </Text>
        <Text style={styles.scene}>{session.state.scene.name}</Text>
      </View>

      {/* Transcript / narration area */}
      <ScrollView ref={scrollRef} style={styles.transcript} contentContainerStyle={styles.transcriptContent}>
        {session.transcript.map((t) => (
          <View
            key={t.id}
            style={[styles.bubble, t.role === "gm" ? styles.bubbleGm : styles.bubblePlayer]}
            accessibilityRole="text"
            accessibilityLabel={`${t.role === "gm" ? "Narrator" : "You"}: ${t.text}`}
          >
            <Text style={t.role === "gm" ? styles.bubbleTextGm : styles.bubbleTextPlayer}>
              {t.text}
            </Text>
          </View>
        ))}
        {session.awaitingGm && !lastGm?.streaming && (
          <Text style={styles.thinking} accessibilityLiveRegion="polite">
            The game master is responding…
          </Text>
        )}
      </ScrollView>

      {/* Choices */}
      {showFirstTurnTips && (
        <View style={styles.tipsCard} accessibilityRole="summary">
          <Text style={styles.tipsTitle}>Quick start</Text>
          <Text style={styles.tipsBody}>1) Choose a numbered action below.</Text>
          <Text style={styles.tipsBody}>2) Tap Mic to speak a custom action.</Text>
          <Text style={styles.tipsBody}>3) Tap Exit to save and return home.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss quick start tips"
            onPress={() => setShowFirstTurnTips(false)}
            style={({ pressed }) => [styles.tipsDismissBtn, pressed && styles.dockBtnPressed]}
          >
            <Text style={styles.tipsDismissText}>Got it</Text>
          </Pressable>
        </View>
      )}

      {session.choices.length > 0 && (
        <View style={styles.choicesSection}>
          <Text style={styles.choicesLabel}>CHOOSE YOUR ACTION</Text>
          <View style={styles.choices}>
            {session.choices.map((c, i) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Option ${i + 1} of ${session.choices.length}: ${c.label}`}
                onPress={() => pickChoice(c.id, c.label)}
                style={({ pressed }) => [styles.choiceBtn, pressed && styles.choiceBtnPressed]}
                disabled={!canAcceptInput}
              >
                <View style={styles.choiceBadge}>
                  <Text style={styles.choiceBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.choiceText}>{c.label}</Text>
              </Pressable>
            ))}
            {session.acceptsFreeform && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Do something else. Speak a custom action."
                onPress={speakFreeform}
                disabled={!canAcceptInput}
                style={({ pressed }) => [styles.freeformBtn, pressed && styles.choiceBtnPressed]}
              >
                <View style={[styles.choiceBadge, styles.choiceBadgeFreeform]}>
                  <Text style={[styles.choiceBadgeText, { color: EQ.accent }]}>…</Text>
                </View>
                <Text style={styles.freeformText}>Do something else</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Dock */}
      <View style={styles.dock}>
        <DockButton label="Mic" hint="Speak a choice or action" onPress={speakFreeform} />
        <DockButton label="Repeat" hint="Replay last narration" onPress={() => { if (lastGm) void speakOnce(lastGm.text); }} />
        <DockButton label="Recap" hint="Summarize the scene so far" onPress={() => sessionConnection.requestRecap()} />
        <DockButton
          label="Exit"
          hint="Save and return home"
          onPress={leaveCampaign}
        />
      </View>

      <AdBanner onUpgradePress={() => setUpgradeVisible(true)} />

      {session.lastError && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">{session.lastError}</Text>
      )}

      <AiMinutesSheet
        visible={minutesSheetVisible}
        onDismiss={() => setMinutesSheetVisible(false)}
      />
      <UpgradePrompt
        visible={upgradeVisible}
        requiredTier="storyteller"
        featureName="Unlimited Play"
        onDismiss={() => setUpgradeVisible(false)}
      />
    </View>
  );
}

function DockButton({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.dockBtn, pressed && styles.dockBtnPressed]}
    >
      <Text style={styles.dockBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: EQ.bg },
  center: { flex: 1, backgroundColor: EQ.bg, justifyContent: "center", alignItems: "center", gap: SPACE[3] },
  connectingText: { fontSize: FS.lg, color: EQ.textMuted, lineHeight: 26 },

  header: { padding: SPACE[4], paddingBottom: SPACE[2], borderBottomWidth: 1, borderBottomColor: EQ.border2 },
  h1: { fontSize: FS["2xl"], fontWeight: "700", color: EQ.text, letterSpacing: -0.3 },
  scene: { fontSize: FS.xs, color: EQ.accent, marginTop: 3, letterSpacing: 0.5 },

  transcript: { flex: 1 },
  transcriptContent: { padding: SPACE[4], gap: SPACE[3] },
  bubble: { borderRadius: R.xl, padding: SPACE[3] },
  bubbleGm: { backgroundColor: EQ.surface2 },
  bubblePlayer: { backgroundColor: EQ.accentBg, alignSelf: "flex-end", maxWidth: "85%" },
  bubbleTextGm: {
    fontSize: FS.md,
    lineHeight: 26,
    color: EQ.text,
  },
  bubbleTextPlayer: { fontSize: FS.base, color: EQ.accent2, lineHeight: 22 },
  thinking: { padding: SPACE[3], fontStyle: "italic", color: EQ.textFaint, fontSize: FS.sm },
  tipsCard: {
    marginHorizontal: SPACE[3],
    marginBottom: SPACE[2],
    padding: SPACE[3],
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface,
    gap: SPACE[1],
  },
  tipsTitle: { color: EQ.text, fontSize: FS.base, fontWeight: "700" },
  tipsBody: { color: EQ.textMuted, fontSize: FS.sm, lineHeight: 20 },
  tipsDismissBtn: {
    marginTop: SPACE[2],
    alignSelf: "flex-start",
    minHeight: TOUCH_MIN,
    borderRadius: R.sm,
    backgroundColor: EQ.accent,
    paddingHorizontal: SPACE[3],
    justifyContent: "center",
  },
  tipsDismissText: { color: "#fff", fontSize: FS.sm, fontWeight: "700" },

  choicesSection: { borderTopWidth: 1, borderTopColor: EQ.border2, paddingTop: SPACE[2] },
  choicesLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: EQ.textFaint,
    letterSpacing: 1,
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[2],
  },
  choices: { gap: SPACE[2], paddingHorizontal: SPACE[3] },
  choiceBtn: {
    minHeight: CHOICE_MIN,
    borderRadius: R.md,
    backgroundColor: EQ.surface2,
    borderWidth: 1,
    borderColor: EQ.border,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[3],
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[3],
  },
  choiceBtnPressed: { borderColor: EQ.accent, opacity: 0.85 },
  choiceBadge: {
    width: 24,
    height: 24,
    borderRadius: R.sm,
    backgroundColor: EQ.surface3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  choiceBadgeFreeform: { backgroundColor: EQ.accentBg, borderWidth: 1, borderColor: EQ.accent },
  choiceBadgeText: { fontSize: 11, fontWeight: "700", color: EQ.textMuted },
  choiceText: { fontSize: FS.sm, color: EQ.text, flex: 1, lineHeight: 20 },
  freeformBtn: {
    minHeight: TOUCH_MIN,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: EQ.border,
    paddingHorizontal: SPACE[3],
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[3],
  },
  freeformText: { fontSize: FS.sm, color: EQ.accent, fontWeight: "600" },

  dock: {
    flexDirection: "row",
    gap: SPACE[2],
    padding: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: EQ.border2,
    backgroundColor: EQ.bg2,
  },
  dockBtn: {
    flex: 1,
    minHeight: TOUCH_MIN,
    borderRadius: R.md,
    backgroundColor: EQ.surface,
    borderWidth: 1,
    borderColor: EQ.border,
    justifyContent: "center",
    alignItems: "center",
  },
  dockBtnPressed: { borderColor: EQ.accent, backgroundColor: EQ.accentBg },
  dockBtnText: { color: EQ.textMuted, fontSize: 12, fontWeight: "600" },

  error: { color: EQ.danger, fontWeight: "600", padding: SPACE[3] },
});
