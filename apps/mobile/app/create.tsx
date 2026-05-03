import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { useVoiceCommands } from "@/voice/commandBus";
import { speakOnce, stopNarration } from "@/audio/narrator";
import { captureUtterance } from "@/voice/stt";
import {
  EMPTY_DRAFT,
  STEPS,
  draftToBible,
  type Draft,
  type WizardStep,
} from "@/wizard/createWorldSteps";
import { createCampaign, createWorldFromBible, getWizardSuggestions } from "@/api/rest";
import { sessionConnection } from "@/session/connection";
import { useSession } from "@/session/store";
import { EQ, MOTION, R, SPACE, FS, TOUCH_MIN, TYPE } from "@/design/tokens";
import { useCan } from "@/entitlements/store";
import { UpgradePrompt } from "@/entitlements/UpgradePrompt";

export default function CreateWorld(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);
  const can = useCan();
  const [paywallVisible, setPaywallVisible] = useState(!can.worldWizard);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [textInput, setTextInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const dotProgress = useRef(STEPS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useLandmarkAnnounce(
    "Create world",
    `Step ${stepIndex + 1} of ${STEPS.length}. ${step?.prompt ?? ""}`,
    headingRef,
  );

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    dotProgress.forEach((value, i) => {
      Animated.timing(value, {
        toValue: i <= stepIndex ? 1 : 0,
        duration: reduceMotion ? 0 : 160,
        useNativeDriver: true,
      }).start();
    });
  }, [dotProgress, reduceMotion, stepIndex]);

  useEffect(() => {
    if (!step) return;
    void speakOnce(`${step.prompt}${step.kind === "freeform" && step.helper ? ` ${step.helper}` : ""}`);
    return () => { stopNarration(); };
  }, [step, stepIndex]);

  useEffect(() => {
    if (!step) return;
    const current = draft[step.id];
    setTextInput(typeof current === "string" ? current : "");
  }, [stepIndex, step, draft]);

  // Fetch Claude suggestions whenever we land on a freeform step
  useEffect(() => {
    if (!step || step.kind !== "freeform") {
      setSuggestions([]);
      return;
    }
    setSuggestions([]);
    setLoadingSuggestions(true);
    const draftSnapshot: Record<string, string> = {};
    for (const key of Object.keys(draft)) {
      const val = draft[key as keyof Draft];
      if (typeof val === "string" && val.trim()) draftSnapshot[key] = val;
    }
    let cancelled = false;
    void getWizardSuggestions(step.id, draftSnapshot)
      .then((s) => { if (!cancelled) setSuggestions(s); })
      .catch(() => { /* suggestions are optional — never block the wizard */ })
      .finally(() => { if (!cancelled) setLoadingSuggestions(false); });
    return () => { cancelled = true; };
  }, [stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(
    (value: string) => {
      if (!step) return;
      const trimmed = value.trim();
      if (step.kind === "freeform" && step.required && !trimmed) {
        setError("This step needs an answer to continue.");
        return;
      }
      setError(null);
      setDraft((d) => ({ ...d, [step.id]: trimmed }));
      if (!isLast) setStepIndex((i) => i + 1);
    },
    [step, isLast],
  );

  const goBack = useCallback(() => {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const finish = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const bible = draftToBible(draft);
      const world = await createWorldFromBible(bible);
      const campaign = await createCampaign({
        worldId: world.worldId,
        characterName: draft.characterName.trim() || "Wren",
      });
      useSession.getState().joined({
        campaignId: campaign.campaignId,
        authToken: campaign.authToken,
        title: campaign.title,
        state: campaign.state,
      });
      await sessionConnection.connect({
        campaignId: campaign.campaignId,
        authToken: campaign.authToken,
      });
      sessionConnection.sendPlayerInput({ kind: "utility", command: "begin" });
      router.push({ pathname: "/campaign/[id]", params: { id: campaign.campaignId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create world.");
    } finally {
      setBusy(false);
    }
  }, [draft, router]);

  const speakAnswer = useCallback(async () => {
    void speakOnce("Listening.");
    const transcript = await captureUtterance();
    if (!transcript) return;
    if (step?.kind === "choice") {
      const matched = matchChoice(step, transcript);
      if (matched) advance(matched);
      else void speakOnce("I didn't catch that. Please pick one of the listed options.");
      return;
    }
    setTextInput(transcript);
    advance(transcript);
  }, [advance, step]);

  useVoiceCommands({
    "back|previous": () => goBack(),
    "next|continue": () => advance(textInput),
    "skip": () => { if (step && step.kind === "freeform" && !step.required) advance(""); },
    "repeat|read that again": () => { if (step) void speakOnce(step.prompt); },
    "speak|microphone|mic": () => { void speakAnswer(); },
  });

  if (!step) return <View />;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.zoneHero}>
        <Text ref={headingRef} role="heading" aria-level={1} style={styles.h1}>
          Create World
        </Text>
        {/* Step progress dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => {
            const anim = dotProgress[i];
            if (!anim) return null;
            const isActive = i === stepIndex;
            const isComplete = i < stepIndex;
            return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isComplete && styles.dotDone,
                {
                  opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.58, 1] }),
                  transform: [{
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [reduceMotion ? 1 : 0.92, 1],
                    }),
                  }],
                },
              ]}
            />
          );
          })}
        </View>
        <Text style={styles.progress}>Step {stepIndex + 1} of {STEPS.length}</Text>
      </View>

      <View style={styles.zonePrimary}>
        <Text accessibilityRole="text" style={styles.prompt}>{step.prompt}</Text>
        {step.kind === "freeform" && step.helper && (
          <Text style={styles.helper}>{step.helper}</Text>
        )}

        {step.kind === "freeform" ? (
          <>
            <TextInput
              accessibilityLabel={step.prompt}
              accessibilityHint={step.helper}
              style={[styles.input, (step.id === "pitch" || step.id === "startingScenario") && styles.inputMulti]}
              value={textInput}
              onChangeText={setTextInput}
              editable={!busy}
              autoFocus
              multiline={step.id === "pitch" || step.id === "startingScenario"}
              placeholderTextColor={EQ.textFaint}
              placeholder="Type or speak your answer…"
            />

            {/* Claude suggestion chips */}
            {(loadingSuggestions || suggestions.length > 0) && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsLabel}>
                  {loadingSuggestions ? "Getting ideas…" : "SUGGESTIONS"}
                </Text>
                {loadingSuggestions ? (
                  <ActivityIndicator color={EQ.accent} size="small" style={styles.suggestionSpinner} />
                ) : (
                  <View style={styles.chips}>
                    {suggestions.map((s, i) => (
                      <Pressable
                        key={i}
                        accessibilityRole="button"
                        accessibilityLabel={`Use suggestion: ${s}`}
                        onPress={() => { setTextInput(s); void speakOnce(s); }}
                        disabled={busy}
                        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed, pressed && styles.btnPressedTransform]}
                      >
                        <Text style={styles.chipText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.choices}>
            {step.options.map((opt) => (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                onPress={() => advance(opt.value)}
                style={({ pressed }) => [
                  styles.choiceBtn,
                  draft[step.id] === opt.value && styles.choiceBtnSelected,
                  pressed && styles.btnPressed,
                  pressed && styles.btnPressedTransform,
                ]}
                disabled={busy}
              >
                <View pointerEvents="none" style={styles.topEdgeHighlight} />
                <Text style={[
                  styles.choiceText,
                  draft[step.id] === opt.value && styles.choiceTextSelected,
                ]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.zoneSecondary}>
      <View style={styles.nav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          disabled={busy || stepIndex === 0}
          style={({ pressed }) => [
            styles.navBtn,
            pressed && styles.btnPressed,
                pressed && styles.btnPressedTransform,
            (busy || stepIndex === 0) && styles.btnDisabled,
          ]}
        >
          <View pointerEvents="none" style={styles.topEdgeHighlight} />
          <Text style={styles.navBtnText}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Speak my answer"
          onPress={speakAnswer}
          disabled={busy}
          style={({ pressed }) => [styles.navBtn, pressed && styles.btnPressed, pressed && styles.btnPressedTransform]}
        >
          <View pointerEvents="none" style={styles.topEdgeHighlight} />
          <Text style={styles.navBtnText}>Mic</Text>
        </Pressable>
        {step.kind === "freeform" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Finish and start adventure" : "Next step"}
            onPress={() => (isLast ? void finish() : advance(textInput))}
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
                pressed && styles.btnPressedTransform,
              busy && styles.btnDisabled,
            ]}
          >
            <View pointerEvents="none" style={styles.topEdgeHighlight} />
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{isLast ? "Begin Adventure" : "Next →"}</Text>
            )}
          </Pressable>
        )}
      </View></View>

      <View style={styles.zoneUtility}>
        {error && (
          <Text style={styles.error} accessibilityLiveRegion="assertive">{error}</Text>
        )}
      </View>

      <UpgradePrompt
        visible={paywallVisible}
        requiredTier="creator"
        featureName="World Builder Wizard"
        onDismiss={() => {
          setPaywallVisible(false);
          router.back();
        }}
      />
    </ScrollView>
  );
}

function matchChoice(step: Extract<WizardStep, { kind: "choice" }>, transcript: string): string | null {
  const normalized = transcript.trim().toLowerCase();
  for (const o of step.options) {
    const label = o.label.toLowerCase();
    if (
      normalized === o.value.toLowerCase() ||
      normalized.includes(o.value.toLowerCase()) ||
      normalized.includes(label.split(/\s+/)[0]!)
    ) {
      return o.value;
    }
  }
  return null;
}

// Motion spec note: durations/easings from MOTION are consumed by Animated transitions in components as needed.
// Pressable states here use the same subtle translation/scale values directly for immediate feedback.
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EQ.bg },
  container: { padding: SPACE[6], gap: SPACE[4] },
  zoneHero: { borderRadius: R.xl, borderWidth: 1, borderColor: EQ.border, backgroundColor: "rgba(255,255,255,0.02)", padding: SPACE[4], gap: SPACE[2] },
  zonePrimary: { borderRadius: R.xl, borderWidth: 1, borderColor: EQ.border2, backgroundColor: "rgba(255,255,255,0.03)", padding: SPACE[4], gap: SPACE[3], shadowColor: EQ.bg2, shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  zoneSecondary: { borderRadius: R.xl, borderWidth: 1, borderColor: EQ.border, backgroundColor: "rgba(255,255,255,0.025)", padding: SPACE[4], shadowColor: EQ.bg2, shadowOpacity: 0.2, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  zoneUtility: { borderRadius: R.lg, borderWidth: 1, borderColor: EQ.border, backgroundColor: "rgba(255,255,255,0.015)", paddingHorizontal: SPACE[3], paddingVertical: SPACE[2] },

  h1: { ...TYPE.display, color: EQ.text },

  dots: { flexDirection: "row", gap: SPACE[1], alignItems: "center" },
  // Step indicators: small reveal shift + opacity change to keep transitions subtle.
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: EQ.surface3, opacity: 0.58 },
  dotActive: {
    width: 22,
    borderRadius: 999,
    backgroundColor: EQ.accent,
    shadowColor: EQ.accent,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  dotDone: { backgroundColor: EQ.accentBg, borderWidth: 1, borderColor: EQ.accent, opacity: 0.92 },
  progress: { ...TYPE.label, color: EQ.textFaint },

  prompt: { ...TYPE.title, color: EQ.text },
  helper: { ...TYPE.caption, color: EQ.textMuted, marginTop: -SPACE[2] },

  input: {
    borderWidth: 1,
    borderColor: EQ.border,
    borderRadius: R.lg,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FS.lg,
    minHeight: TOUCH_MIN + 12,
    backgroundColor: EQ.surface2,
    color: EQ.text,
  },
  inputMulti: { minHeight: 120, textAlignVertical: "top" },

  suggestionsSection: { gap: SPACE[2] },
  suggestionsLabel: { ...TYPE.label, color: EQ.textFaint },
  suggestionSpinner: { alignSelf: "flex-start", marginTop: SPACE[1], opacity: MOTION.subtleOpacity },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: SPACE[2] },
  chip: {
    borderRadius: R["3xl"],
    borderWidth: 1,
    borderColor: EQ.accent,
    backgroundColor: EQ.accentBg,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],
    maxWidth: "100%",
  },
  chipPressed: { opacity: MOTION.subtleOpacity },
  chipText: { color: EQ.accent, fontSize: FS.sm, lineHeight: 18 },

  choices: { gap: SPACE[2] },
  choiceBtn: {
    minHeight: TOUCH_MIN + 8,
    borderRadius: R.lg,
    backgroundColor: EQ.surface2,
    borderWidth: 1,
    borderColor: EQ.border,
    shadowColor: EQ.bg2,
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: "hidden",
    paddingHorizontal: SPACE[4],
    justifyContent: "center",
  },
  choiceBtnSelected: { borderColor: EQ.accent, backgroundColor: EQ.accentBg },
  choiceText: { color: EQ.text, fontSize: FS.base, fontWeight: "600" },
  choiceTextSelected: { color: EQ.accent },

  nav: { flexDirection: "row", flexWrap: "wrap", gap: SPACE[2], marginTop: SPACE[2] },
  navBtn: {
    minHeight: TOUCH_MIN,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface,
    shadowColor: EQ.bg2,
    shadowOpacity: 0.3,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: "hidden",
    paddingHorizontal: SPACE[4],
    justifyContent: "center",
  },
  navBtnText: { color: EQ.text, fontSize: FS.base, fontWeight: "600" },
  primaryBtn: {
    flexGrow: 1,
    minHeight: TOUCH_MIN,
    borderRadius: R.lg,
    backgroundColor: EQ.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACE[4],
    borderWidth: 1,
    borderColor: EQ.border2,
    shadowColor: EQ.accent,
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
    overflow: "hidden",
  },
  primaryBtnText: { color: "#fff", fontSize: FS.base, fontWeight: "700" },
  // CTA press feedback: tiny scale + 1px translate to avoid heavy motion.
  btnPressed: { opacity: MOTION.subtleOpacity },
  btnPressedTransform: { transform: [{ translateY: MOTION.press.translateY }, { scale: MOTION.press.scaleIn }] },
  btnDisabled: { opacity: 0.4 },
  error: { color: EQ.danger, fontWeight: "600" },
  topEdgeHighlight: {
    position: "absolute",
    top: 0,
    left: 1,
    right: 1,
    height: 1,
    backgroundColor: EQ.border2,
    opacity: 0.9,
  },
});
