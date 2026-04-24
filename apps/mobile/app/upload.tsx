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
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        ref={headingRef}
        accessibilityRole="header"
        aria-level={1}
        style={styles.h1}
      >
        Upload game bible
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
          <View>
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
              maxLength={120}
              editable={!busy}
            />
          </View>

          <View>
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
          <Text accessibilityRole="header" aria-level={2} style={styles.h2}>
            {result.title}
          </Text>
          {result.bible.pitch && <Text style={styles.body}>{result.bible.pitch}</Text>}
          <Text style={styles.body}>
            Style: {result.bible.style_mode}. Found{" "}
            {result.bible.entities.length} named entities.
          </Text>
          {result.warnings.length > 0 && (
            <View style={styles.warnBox} accessibilityRole="alert">
              <Text style={styles.warnTitle}>Warnings</Text>
              {result.warnings.map((w) => (
                <Text key={w} style={styles.warnText}>
                  • {w}
                </Text>
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
  container: { padding: 24, gap: 16 },
  h1: { fontSize: 32, fontWeight: "800" },
  h2: { fontSize: 24, fontWeight: "800" },
  body: { fontSize: 17, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 48,
  },
  textarea: { minHeight: 200 },
  counter: { marginTop: 4, color: "#6b7280", fontSize: 12 },
  divider: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
    marginVertical: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  primaryBtn: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  secondaryBtnText: { color: "#1f2937", fontSize: 16, fontWeight: "700" },
  btnPressed: { opacity: 0.7 },
  btnDisabled: { opacity: 0.5 },
  warnBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  warnTitle: { fontWeight: "700", color: "#92400e" },
  warnText: { color: "#92400e" },
  error: { color: "#b91c1c", fontWeight: "600" },
});
