import { useCallback, useRef, useState } from "react";
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
import * as DocumentPicker from "expo-document-picker";
import { useLandmarkAnnounce } from "@/a11y/useLandmarkAnnounce";
import {
  createCampaign,
  uploadWorldFromFile,
  uploadWorldFromText,
  type WorldDetail,
} from "@/api/rest";
import { sessionConnection } from "@/session/connection";
import { useSession } from "@/session/store";
import { EQ, R, SPACE, FS, TOUCH_MIN } from "@/design/tokens";

const MIN_CHARS = 60;
const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/json",
];

export default function UploadBible(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<Text>(null);
  const [titleHint, setTitleHint] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WorldDetail | null>(null);

  useLandmarkAnnounce(
    "Upload game bible",
    result
      ? `Parsed ${result.title}. Tap start adventure to play.`
      : "Pick a PDF, DOCX, Markdown, or text file, or paste your bible text below and tap parse.",
    headingRef,
  );

  const pickFile = useCallback(async () => {
    setError(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_TYPES,
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      if (!asset) return;
      setBusy(true);
      const r = await uploadWorldFromFile({
        uri: asset.uri,
        name: asset.name,
        ...(asset.mimeType ? { mimeType: asset.mimeType } : {}),
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    if (text.trim().length < MIN_CHARS) {
      setError(`Please paste at least ${MIN_CHARS} characters of bible text.`);
      return;
    }
    setBusy(true);
    try {
      const r = await uploadWorldFromText({
        text: text.trim(),
        ...(titleHint.trim() ? { titleHint: titleHint.trim() } : {}),
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse this bible.");
    } finally {
      setBusy(false);
    }
  }, [text, titleHint]);

  const startCampaign = useCallback(async () => {
    if (!result) return;
    setBusy(true);
    try {
      const campaign = await createCampaign({ worldId: result.worldId });
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
      setError(e instanceof Error ? e.message : "Could not start the campaign.");
    } finally {
      setBusy(false);
    }
  }, [result, router]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text
        ref={headingRef}
        role="heading"
        aria-level={1}
        style={styles.h1}
      >
        Upload Bible
      </Text>

      {!result && (
        <>
          <Text style={styles.body}>
            Upload a PDF, DOCX, Markdown, or text file — or paste text
            directly below. We'll extract and structure the world.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={busy ? "Uploading…" : "Pick a file"}
            accessibilityHint="Choose a PDF, DOCX, Markdown, or text file from your device."
            accessibilityState={{ disabled: busy, busy }}
            onPress={pickFile}
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
              <Text style={styles.primaryBtnText}>Pick a file</Text>
            )}
          </Pressable>

          <Text style={styles.divider}>— or paste —</Text>

          <View style={styles.fieldGroup}>
            <Text accessibilityRole="text" style={styles.label}>
              Title hint (optional)
            </Text>
            <TextInput
              accessibilityLabel="Title hint"
              accessibilityHint="Optional. The model may override it."
              style={styles.input}
              value={titleHint}
              onChangeText={setTitleHint}
              placeholder="The Hollow Kingdom"
              placeholderTextColor={EQ.textFaint}
              maxLength={120}
              editable={!busy}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text accessibilityRole="text" style={styles.label}>
              Bible text
            </Text>
            <TextInput
              accessibilityLabel="Bible text"
              accessibilityHint={`Paste at least ${MIN_CHARS} characters.`}
              style={[styles.input, styles.textarea]}
              value={text}
              onChangeText={setText}
              placeholder="Paste your worldbuilding text here…"
              placeholderTextColor={EQ.textFaint}
              multiline
              numberOfLines={12}
              textAlignVertical="top"
              editable={!busy}
            />
            <Text style={styles.counter}>
              {text.trim().length} / {MIN_CHARS} minimum
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={busy ? "Parsing…" : "Parse bible"}
            accessibilityState={{ disabled: busy, busy }}
            onPress={submit}
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
              <Text style={styles.primaryBtnText}>Parse bible</Text>
            )}
          </Pressable>
        </>
      )}

      {result && (
        <>
          <Text role="heading" aria-level={2} style={styles.h2}>
            {result.title}
          </Text>
          {result.bible.pitch && (
            <Text style={styles.body}>{result.bible.pitch}</Text>
          )}
          <Text style={styles.meta}>
            Style: {result.bible.style_mode} · {result.bible.entities.length} named entities
          </Text>
          {result.warnings.length > 0 && (
            <View style={styles.warnBox} accessibilityRole="alert">
              <Text style={styles.warnTitle}>Warnings</Text>
              {result.warnings.map((w) => (
                <Text key={w} style={styles.warnText}>• {w}</Text>
              ))}
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start adventure in this world"
            onPress={startCampaign}
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
              <Text style={styles.primaryBtnText}>Start adventure</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Parse another bible"
            onPress={() => {
              setResult(null);
              setText("");
              setTitleHint("");
            }}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.secondaryBtnText}>Parse another</Text>
          </Pressable>
        </>
      )}

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EQ.bg },
  container: { padding: SPACE[6], gap: SPACE[4] },

  h1: { fontSize: FS.hero, fontWeight: "700", color: EQ.text, letterSpacing: -0.5 },
  h2: { fontSize: FS["2xl"], fontWeight: "700", color: EQ.text, letterSpacing: -0.3 },

  body: { fontSize: FS.md, color: EQ.textMuted, lineHeight: 26 },
  meta: { fontSize: FS.sm, color: EQ.textFaint, lineHeight: 20 },

  fieldGroup: { gap: SPACE[1] },
  label: { fontSize: FS.sm, fontWeight: "600", color: EQ.textMuted },

  input: {
    borderWidth: 1,
    borderColor: EQ.border,
    borderRadius: R.lg,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FS.base,
    minHeight: TOUCH_MIN + 12,
    backgroundColor: EQ.surface2,
    color: EQ.text,
  },
  textarea: { minHeight: 200, textAlignVertical: "top" },
  counter: { fontSize: FS.xs, color: EQ.textFaint, marginTop: SPACE[1] },

  divider: {
    textAlign: "center",
    color: EQ.textFaint,
    fontSize: FS.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  primaryBtn: {
    minHeight: TOUCH_MIN + 12,
    borderRadius: R.lg,
    backgroundColor: EQ.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACE[5],
    shadowColor: EQ.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  primaryBtnText: { color: "#fff", fontSize: FS.lg, fontWeight: "700" },

  secondaryBtn: {
    minHeight: TOUCH_MIN,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: EQ.border,
    backgroundColor: EQ.surface,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACE[5],
  },
  secondaryBtnText: { color: EQ.textMuted, fontSize: FS.base, fontWeight: "600" },

  btnPressed: { opacity: 0.75 },
  btnDisabled: { opacity: 0.4 },

  warnBox: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    padding: SPACE[4],
    gap: SPACE[1],
  },
  warnTitle: { fontWeight: "700", color: EQ.warning, fontSize: FS.sm },
  warnText: { color: EQ.warning, fontSize: FS.sm, lineHeight: 20, opacity: 0.85 },

  error: { color: EQ.danger, fontWeight: "600" },
});
