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

  // Speak the prompt when entering a step.
  useEffect(() => {
    if (!step) return;
    void speakOnce(`${step.prompt}${step.kind === "freeform" && step.helper ? ` ${step.helper}` : ""}`);
    return () => {
      stopNarration();
    };
  }, [step, stepIndex]);

  // Pre-fill the input box with the current draft value when navigating.
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
      if (!isLast) {
        setStepIndex((i) => i + 1);
      }
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
      router.push({
        pathname: "/campaign/[id]",
        params: { id: campaign.campaignId },
      });
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
    "skip": () => {
      if (step && step.kind === "freeform" && !step.required) {
        advance("");
      }
    },
    "repeat|read that again": () => {
      if (step) void speakOnce(step.prompt);
    },
    "speak|microphone|mic": () => {
      void speakAnswer();
    },
  });

  if (!step) return <View />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        ref={headingRef}
        accessibilityRole="header"
        aria-level={1}
        style={styles.h1}
      >
        Create world
      </Text>
      <Text style={styles.progress}>
        Step {stepIndex + 1} of {STEPS.length}
      </Text>

      <Text accessibilityRole="text" style={styles.prompt}>
        {step.prompt}
      </Text>
      {step.kind === "freeform" && step.helper && (
        <Text style={styles.helper}>{step.helper}</Text>
      )}

      {step.kind === "freeform" ? (
        <TextInput
          accessibilityLabel={step.prompt}
          accessibilityHint={step.helper}
          style={styles.input}
          value={textInput}
          onChangeText={setTextInput}
          editable={!busy}
          autoFocus
          multiline={step.id === "pitch" || step.id === "startingScenario"}
        />
      ) : (
        <View style={styles.choices}>
          {step.options.map((opt) => (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              onPress={() => advance(opt.value)}
              style={({ pressed }) => [styles.choiceBtn, pressed && styles.btnPressed]}
              disabled={busy}
            >
              <Text style={styles.choiceText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          disabled={busy || stepIndex === 0}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.btnPressed,
            (busy || stepIndex === 0) && styles.btnDisabled,
          ]}
        >
          <Text style={styles.secondaryBtnText}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Speak my answer"
          onPress={speakAnswer}
          disabled={busy}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.secondaryBtnText}>Mic</Text>
        </Pressable>
        {step.kind === "freeform" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Finish and start adventure" : "Next"}
            onPress={() => (isLast ? finish() : advance(textInput))}
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
              <Text style={styles.primaryBtnText}>{isLast ? "Begin" : "Next"}</Text>
            )}
          </Pressable>
        )}
      </View>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}

function matchChoice(
  step: Extract<WizardStep, { kind: "choice" }>,
  transcript: string,
): string | null {
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
  container: { padding: 24, gap: 16 },
  h1: { fontSize: 32, fontWeight: "800" },
  progress: { color: "#6b7280", fontSize: 14 },
  prompt: { fontSize: 22, fontWeight: "700" },
  helper: { fontSize: 15, color: "#4b5563" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    minHeight: 56,
  },
  choices: { gap: 8 },
  choiceBtn: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  choiceText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryBtn: {
    flexGrow: 1,
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  secondaryBtn: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1f2937",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#1f2937", fontSize: 16, fontWeight: "700" },
  btnPressed: { opacity: 0.7 },
  btnDisabled: { opacity: 0.5 },
  error: { color: "#b91c1c", fontWeight: "600" },
});
