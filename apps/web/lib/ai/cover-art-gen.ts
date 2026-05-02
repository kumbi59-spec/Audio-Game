/**
 * AI cover-art generation. Pluggable by env:
 *
 *   IMAGE_GEN_PROVIDER=bfl                      (Black Forest Labs — recommended)
 *   BFL_API_KEY=bfl_...                          (required when provider=bfl)
 *   MODEL_NAME=black-forest-labs/flux-schnell    (default; only the part after "/" is used)
 *
 *   IMAGE_GEN_PROVIDER=replicate                 (Replicate fallback)
 *   REPLICATE_API_TOKEN=r8_...                   (required when provider=replicate)
 *   REPLICATE_IMAGE_MODEL=black-forest-labs/flux-schnell  (default)
 *
 * Returns { url } on success or { error } on any failure so callers can
 * surface the actual provider message rather than a generic "null".
 */

const TIMEOUT_MS = 60_000;
const BFL_BASE = "https://api.us1.bfl.ai/v1";

export interface CoverGenInput {
  worldName: string;
  genre: string;
  tone: string;
}

export type CoverGenResult =
  | { url: string; error?: never }
  | { url?: never; error: string };

function buildPrompt({ worldName, genre, tone }: CoverGenInput): string {
  const cleanGenre = genre.replace(/[^a-zA-Z0-9 ,-]/g, "").trim();
  const cleanTone = tone.replace(/[^a-zA-Z0-9 ,-]/g, "").trim();
  return [
    `Audiobook cover illustration for "${worldName}".`,
    `Genre: ${cleanGenre}.`,
    cleanTone ? `Tone: ${cleanTone}.` : "",
    "Atmospheric, painterly, dramatic lighting, environmental establishing shot,",
    "no text, no logos, no human faces in foreground.",
    "Wide cinematic composition. 16:9 aspect ratio.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function fetchJson(url: string, init: RequestInit, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { ...init, signal });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${url} → HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function imageUrlToDataUrl(url: string, signal: AbortSignal): Promise<string | null> {
  const imgRes = await fetch(url, { signal });
  if (!imgRes.ok) return null;
  const arrayBuf = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get("content-type") ?? "image/webp";
  const b64 = Buffer.from(arrayBuf).toString("base64");
  return `data:${contentType};base64,${b64}`;
}

// ── Black Forest Labs ──────────────────────────────────────────────────────

interface BFLResult {
  id: string;
  status: string; // "Pending" | "Ready" | "Error" | "Content Moderated" | "Request Moderated"
  result?: { sample?: string };
}

async function generateViaBFL(input: CoverGenInput): Promise<CoverGenResult> {
  const apiKey = process.env["BFL_API_KEY"];
  if (!apiKey) return { error: "BFL_API_KEY is not set" };

  // Accept "black-forest-labs/flux-schnell" or just "flux-schnell"
  const modelEnv = process.env["MODEL_NAME"] ?? "black-forest-labs/flux-schnell";
  const modelName = modelEnv.includes("/") ? modelEnv.split("/").pop()! : modelEnv;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const created = (await fetchJson(
      `${BFL_BASE}/${modelName}`,
      {
        method: "POST",
        headers: { "X-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(input),
          width: 1024,
          height: 576,
          steps: 4,
        }),
      },
      controller.signal,
    )) as BFLResult;

    const taskId = created.id;
    if (!taskId) {
      const detail = JSON.stringify(created).slice(0, 200);
      return { error: `BFL: no task id in response — ${detail}` };
    }

    // Always poll — don't trust the initial response status field.
    // The initial POST may return {} or a non-"Pending" status depending on
    // BFL API version, so we poll until we get a known terminal status.
    const TERMINAL = new Set(["Ready", "Error", "Content Moderated", "Request Moderated"]);
    const pollUrl = `${BFL_BASE}/get_result?id=${taskId}`;
    let result: BFLResult;
    do {
      await new Promise((r) => setTimeout(r, 1500));
      result = (await fetchJson(
        pollUrl,
        { headers: { "X-Key": apiKey } },
        controller.signal,
      )) as BFLResult;
    } while (!TERMINAL.has(result.status));

    if (result.status !== "Ready") {
      return { error: `BFL task ended with status "${result.status}"` };
    }

    const sampleUrl = result.result?.sample;
    if (!sampleUrl) return { error: "BFL: task Ready but no sample URL in result" };

    const url = await imageUrlToDataUrl(sampleUrl, controller.signal);
    if (!url) return { error: "BFL: failed to download generated image from sample URL" };
    return { url };
  } catch (err) {
    const msg = (err as Error).message;
    return { error: `BFL request failed: ${msg}` };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Replicate ──────────────────────────────────────────────────────────────

const REPLICATE_DEFAULT_MODEL =
  process.env["REPLICATE_IMAGE_MODEL"] ?? "black-forest-labs/flux-schnell";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string | null;
  urls?: { get?: string };
}

async function pollReplicateUntilDone(
  pollUrl: string,
  token: string,
  signal: AbortSignal,
): Promise<ReplicatePrediction> {
  let prediction: ReplicatePrediction;
  do {
    await new Promise((r) => setTimeout(r, 1500));
    prediction = (await fetchJson(
      pollUrl,
      { headers: { Authorization: `Bearer ${token}` } },
      signal,
    )) as ReplicatePrediction;
  } while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  );
  return prediction;
}

async function generateViaReplicate(input: CoverGenInput): Promise<CoverGenResult> {
  const token = process.env["REPLICATE_API_TOKEN"];
  if (!token) return { error: "REPLICATE_API_TOKEN is not set" };

  const modelStr = REPLICATE_DEFAULT_MODEL;
  const colonIndex = modelStr.indexOf(":");
  const isVersioned = colonIndex !== -1;

  let postUrl: string;
  let body: Record<string, unknown>;

  if (isVersioned) {
    const version = modelStr.slice(colonIndex + 1);
    if (!version) return { error: "version hash missing in REPLICATE_IMAGE_MODEL" };
    postUrl = "https://api.replicate.com/v1/predictions";
    body = {
      version,
      input: { prompt: buildPrompt(input), width: 1024, height: 576, num_inference_steps: 25 },
    };
  } else {
    const [owner, modelName] = modelStr.split("/");
    if (!owner || !modelName) {
      return { error: "REPLICATE_IMAGE_MODEL must be 'owner/model' or 'owner/model:version'" };
    }
    postUrl = `https://api.replicate.com/v1/models/${owner}/${modelName}/predictions`;
    body = {
      input: { prompt: buildPrompt(input), aspect_ratio: "16:9", output_quality: 80, num_inference_steps: 4 },
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const created = (await fetchJson(
      postUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=5",
        },
        body: JSON.stringify(body),
      },
      controller.signal,
    )) as ReplicatePrediction;

    let prediction = created;

    if (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled"
    ) {
      const pollUrl = prediction.urls?.get;
      if (!pollUrl) return { error: "Replicate: no polling URL in response" };
      prediction = await pollReplicateUntilDone(pollUrl, token, controller.signal);
    }

    if (prediction.status !== "succeeded") {
      return { error: `Replicate ${prediction.status}: ${prediction.error ?? "no detail"}` };
    }

    const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!out) return { error: "Replicate: succeeded but output array was empty" };

    const url = await imageUrlToDataUrl(out, controller.signal);
    if (!url) return { error: "Replicate: failed to download generated image" };
    return { url };
  } catch (err) {
    const msg = (err as Error).message;
    return { error: `Replicate request failed: ${msg}` };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Entry point ────────────────────────────────────────────────────────────

export async function generateAICoverArt(input: CoverGenInput): Promise<CoverGenResult> {
  const provider = process.env["IMAGE_GEN_PROVIDER"]?.toLowerCase();
  if (!provider) return { error: "IMAGE_GEN_PROVIDER env var is not set" };
  if (provider === "bfl") return generateViaBFL(input);
  if (provider === "replicate") return generateViaReplicate(input);
  return { error: `Unknown IMAGE_GEN_PROVIDER="${provider}" (expected "bfl" or "replicate")` };
}
