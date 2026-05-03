import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { EQ, MOTION, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";
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

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useLandmarkAnnounce(
    "Create world",
    `Step ${stepIndex + 1} of ${STEPS.length}. ${step?.prompt ?? ""}`,
    headingRef,
  );

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
      <Text ref={headingRef} role="heading" aria-level={1} style={styles.h1}>
        Create World
      </Text>

      {/* Step progress dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === stepIndex && styles.dotActive,
              i < stepIndex && styles.dotDone,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progress}>Step {stepIndex + 1} of {STEPS.length}</Text>

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
      </View>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">{error}</Text>
      )}

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

  h1: { fontSize: FS.hero, fontWeight: "700", color: EQ.text, letterSpacing: -0.5 },

  dots: { flexDirection: "row", gap: SPACE[1], alignItems: "center" },
  // Step indicators: small reveal shift + opacity change to keep transitions subtle.
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: EQ.surface3, opacity: 0.72, transform: [{ translateY: 1 }] },
  dotActive: { width: 24, borderRadius: 4, backgroundColor: EQ.accent, opacity: 1, transform: [{ translateY: -1 }] },
  dotDone: { backgroundColor: EQ.accent2, opacity: 0.94, transform: [{ translateY: 0 }] },
  progress: { fontSize: FS.xs, color: EQ.textFaint, letterSpacing: 0.5 },

  prompt: { fontSize: FS.xl, fontWeight: "700", color: EQ.text, lineHeight: 28 },
  helper: { fontSize: FS.sm, color: EQ.textMuted, lineHeight: 20, marginTop: -SPACE[2] },

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
  suggestionsLabel: { fontSize: 10, fontWeight: "600", color: EQ.textFaint, letterSpacing: 1.2 },
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
