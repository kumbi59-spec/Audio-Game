import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import { useVoiceCommands } from "@/voice/commandBus";
import { useSession } from "@/session/store";
import { sessionConnection } from "@/session/connection";
import { feedNarration, speakOnce, stopNarration } from "@/audio/narrator";
import { playCue } from "@/audio/cues";
import { captureUtterance } from "@/voice/stt";

export default function ActiveCampaign(): JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const headingRef = useRef<Text>(null);
  const scrollRef = useRef<ScrollView>(null);

  const session = useSession();

  useLandmarkAnnounce(
    "Active campaign",
    session.title
      ? `Playing ${session.title}. ${session.choices.length ? `${session.choices.length} choices available.` : "Listen for the next scene."}`
      : "Connecting to your campaign.",
    headingRef,
  );

  // Drive narration TTS off the streaming transcript.
  useEffect(() => {
    const unsub = sessionConnection.onServerEvent((evt) => {
      if (evt.type === "narration_chunk") {
        feedNarration(evt.text, evt.done);
      } else if (evt.type === "sound_cue") {
        void playCue(evt.cue);
      }
    });
    return unsub;
  }, []);

  // Auto-scroll to the latest entry.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [session.transcript.length]);

  // Stop any in-flight narration when leaving the screen.
  useEffect(() => {
    return () => {
      stopNarration();
      void sessionConnection.close();
      session.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickChoice = useCallback(
    (choiceId: string, label: string) => {
      stopNarration();
      session.appendPlayer(label);
      sessionConnection.sendPlayerInput({ kind: "choice", choiceId });
    },
    [session],
  );

  const speakFreeform = useCallback(async () => {
    stopNarration();
    void speakOnce("Listening.");
    const transcript = await captureUtterance();
    if (!transcript) return;
    const matchedNumber = transcript.trim().match(/^(?:choice\s*)?(one|two|three|four|five|1|2|3|4|5)\b/i);
    if (matchedNumber?.[1]) {
      const idx = wordToIndex(matchedNumber[1]);
      const choice = session.choices[idx];
      if (choice) {
        pickChoice(choice.id, choice.label);
        return;
      }
    }
    session.appendPlayer(transcript);
    sessionConnection.sendPlayerInput({ kind: "freeform", text: transcript });
  }, [pickChoice, session]);

  useVoiceCommands({
    "repeat|read that again": () => {
      const last = [...session.transcript].reverse().find((t) => t.role === "gm");
      if (last) void speakOnce(last.text);
    },
    "summarize|where am i|what just happened": () => {
      sessionConnection.requestRecap();
    },
    "what are my options|list choices": () => {
      const list = session.choices
        .map((c, i) => `${i + 1}: ${c.label}.`)
        .join(" ");
      void speakOnce(list || "No choices yet.");
    },
    "inventory|what do i have": () => {
      const inv = session.state?.inventory ?? [];
      const list =
        inv.length === 0
          ? "Your bag is empty."
          : inv.map((i) => `${i.quantity} ${i.name}`).join(", ");
      void speakOnce(list);
    },
    "save|save and pause|pause": () => {
      sessionConnection.pause();
      void speakOnce("Paused. Returning home.");
      router.replace("/");
    },
    "do something else|custom action|speak": () => {
      void speakFreeform();
    },
  });

  if (!session.connected || !session.state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          accessibilityLabel="Connecting to your campaign."
          size="large"
        />
        <Text style={styles.body} accessibilityLiveRegion="polite">
          Connecting to your campaign…
        </Text>
      </View>
    );
  }

  const lastGm = [...session.transcript].reverse().find((t) => t.role === "gm");

  return (
    <View style={styles.container}>
      <Text
        ref={headingRef}
        role="heading"
        aria-level={1}
        style={styles.h1}
      >
        {session.title}
      </Text>
      <Text style={styles.scene}>Scene: {session.state.scene.name}</Text>

      <ScrollView ref={scrollRef} style={styles.transcript}>
        {session.transcript.map((t) => (
          <View
            key={t.id}
            style={[
              styles.bubble,
              t.role === "gm" ? styles.bubbleGm : styles.bubblePlayer,
            ]}
            accessibilityRole="text"
            accessibilityLabel={`${t.role === "gm" ? "Narrator" : "You"}: ${t.text}`}
          >
            <Text style={styles.bubbleText}>{t.text}</Text>
          </View>
        ))}
        {session.awaitingGm && !lastGm?.streaming && (
          <Text style={styles.thinking} accessibilityLiveRegion="polite">
            The game master is responding…
          </Text>
        )}
      </ScrollView>

      <View style={styles.choices}>
        {session.choices.map((c, i) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Choice ${i + 1}: ${c.label}`}
            onPress={() => pickChoice(c.id, c.label)}
            style={({ pressed }) => [styles.choiceBtn, pressed && styles.btnPressed]}
            disabled={session.awaitingGm}
          >
            <Text style={styles.choiceText}>{`${i + 1}. ${c.label}`}</Text>
          </Pressable>
        ))}
        {session.acceptsFreeform && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Do something else. Speak a custom action."
            onPress={speakFreeform}
            disabled={session.awaitingGm}
            style={({ pressed }) => [styles.freeformBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.freeformText}>Do something else</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.dock}>
        <DockButton
          label="Mic"
          hint="Speak a choice or a custom action"
          onPress={speakFreeform}
        />
        <DockButton
          label="Repeat"
          hint="Replay the last narration"
          onPress={() => {
            if (lastGm) void speakOnce(lastGm.text);
          }}
        />
        <DockButton
          label="Recap"
          hint="Summarize the scene so far"
          onPress={() => sessionConnection.requestRecap()}
        />
        <DockButton
          label="Save & exit"
          hint="Save and return home"
          onPress={() => {
            sessionConnection.pause();
            router.replace("/");
          }}
        />
      </View>
      {session.lastError && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {session.lastError}
        </Text>
      )}
      <Text style={styles.meta} accessibilityLabel={`Campaign id ${id}`}>
        id: {id}
      </Text>
    </View>
  );
}

function DockButton({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.dockBtn, pressed && styles.btnPressed]}
    >
      <Text style={styles.dockBtnText}>{label}</Text>
    </Pressable>
  );
}

function wordToIndex(word: string): number {
  switch (word.toLowerCase()) {
    case "one":
    case "1":
      return 0;
    case "two":
    case "2":
      return 1;
    case "three":
    case "3":
      return 2;
    case "four":
    case "4":
      return 3;
    case "five":
    case "5":
      return 4;
    default:
      return -1;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  h1: { fontSize: 28, fontWeight: "800" },
  scene: { fontSize: 16, color: "#4b5563" },
  transcript: { flex: 1, borderRadius: 12, backgroundColor: "#f3f4f6" },
  bubble: {
    margin: 8,
    padding: 12,
    borderRadius: 12,
  },
  bubbleGm: { backgroundColor: "#fff" },
  bubblePlayer: { backgroundColor: "#dbeafe", alignSelf: "flex-end" },
  bubbleText: { fontSize: 17, lineHeight: 25 },
  thinking: { padding: 12, fontStyle: "italic", color: "#6b7280" },
  choices: { gap: 8 },
  choiceBtn: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  choiceText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  freeformBtn: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1f2937",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  freeformText: { color: "#1f2937", fontSize: 17, fontWeight: "700" },
  dock: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dockBtn: {
    flexGrow: 1,
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  dockBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnPressed: { opacity: 0.7 },
  body: { fontSize: 18, lineHeight: 26 },
  error: { color: "#b91c1c", fontWeight: "600" },
  meta: { fontSize: 12, color: "#9ca3af" },
});
