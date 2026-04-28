/**
 * ElevenLabs Instant Voice Cloning helpers.
 *
 * Docs: https://elevenlabs.io/docs/api-reference/voices/add
 *
 * The free/Starter tier supports Instant Voice Cloning. Pro tier supports
 * Professional Voice Cloning (different endpoint, much longer samples).
 * We use IVC here — accepts a 30-second to 10-minute audio sample.
 */

const BASE = "https://api.elevenlabs.io/v1";
const TIMEOUT_MS = 60_000;

export interface CloneVoiceInput {
  /** Display name for the cloned voice (shown in the picker). */
  name: string;
  /** Short description / context. */
  description?: string;
  /** Audio file as a Blob (from a multipart upload). */
  sample: Blob;
  /** Original filename — passed through to ElevenLabs. */
  filename: string;
}

export interface ClonedVoice {
  voiceId: string;
  name: string;
}

export class ElevenLabsConfigError extends Error {
  constructor() {
    super("ElevenLabs is not configured (set ELEVENLABS_API_KEY).");
    this.name = "ElevenLabsConfigError";
  }
}

export class ElevenLabsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ElevenLabsApiError";
  }
}

function apiKey(): string {
  const k = process.env["ELEVENLABS_API_KEY"];
  if (!k) throw new ElevenLabsConfigError();
  return k;
}

export async function cloneVoice(input: CloneVoiceInput): Promise<ClonedVoice> {
  const key = apiKey();

  const form = new FormData();
  form.append("name", input.name);
  if (input.description) form.append("description", input.description);
  form.append("files", input.sample, input.filename);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/voices/add`, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ElevenLabsApiError(`voices/add failed: ${body || res.statusText}`, res.status);
    }
    const json = (await res.json()) as { voice_id?: string; name?: string };
    if (!json.voice_id) throw new ElevenLabsApiError("voices/add returned no voice_id", 502);
    return { voiceId: json.voice_id, name: json.name ?? input.name };
  } finally {
    clearTimeout(t);
  }
}

export async function deleteVoice(voiceId: string): Promise<void> {
  const key = apiKey();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/voices/${encodeURIComponent(voiceId)}`, {
      method: "DELETE",
      headers: { "xi-api-key": key },
      signal: controller.signal,
    });
    // 404 means the remote voice is already gone — treat that as success
    // so we still clear the local pointer.
    if (!res.ok && res.status !== 404) {
      const body = await res.text().catch(() => "");
      throw new ElevenLabsApiError(`voices/${voiceId} delete failed: ${body || res.statusText}`, res.status);
    }
  } finally {
    clearTimeout(t);
  }
}
