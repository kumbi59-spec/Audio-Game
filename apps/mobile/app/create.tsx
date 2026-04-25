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
import { createCampaign, createWorldFromBible } from "@/api/rest";
import { sessionConnection } from "@/session/connection";
import { useSession } from "@/session/store";
import { EQ, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";

export default function CreateWorld(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [textInput, setTextInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              ]}
              disabled={busy}
            >
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
            (busy || stepIndex === 0) && styles.btnDisabled,
          ]}
        >
          <Text style={styles.navBtnText}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Speak my answer"
          onPress={speakAnswer}
          disabled={busy}
          style={({ pressed }) => [styles.navBtn, pressed && styles.btnPressed]}
        >
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
              busy && styles.btnDisabled,
            ]}
          >
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EQ.bg },
  container: { padding: SPACE[6], gap: SPACE[4] },

  h1: { fontSize: FS.hero, fontWeight: "700", color: EQ.text, letterSpacing: -0.5 },

  dots: { flexDirection: "row", gap: SPACE[1], alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: EQ.surface3 },
  dotActive: { width: 24, borderRadius: 4, backgroundColor: EQ.accent },
  dotDone: { backgroundColor: EQ.accent2 },
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

  choices: { gap: SPACE[2] },
  choiceBtn: {
    minHeight: TOUCH_MIN + 8,
    borderRadius: R.lg,
    backgroundColor: EQ.surface2,
    borderWidth: 1,
    borderColor: EQ.border,
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
    shadowColor: EQ.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  primaryBtnText: { color: "#fff", fontSize: FS.base, fontWeight: "700" },
  btnPressed: { opacity: 0.75 },
  btnDisabled: { opacity: 0.4 },
  error: { color: EQ.danger, fontWeight: "600" },
});
