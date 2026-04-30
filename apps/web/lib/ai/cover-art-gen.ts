/**
 * AI cover-art generation. Pluggable by env:
 *
 *   IMAGE_GEN_PROVIDER=replicate              (or unset to disable)
 *   REPLICATE_API_TOKEN=r8_...                (required when provider=replicate)
 *   REPLICATE_IMAGE_MODEL=black-forest-labs/flux-schnell   (default)
 *
 * Model string formats supported:
 *   "owner/model"           — uses the newer /v1/models/{owner}/{model}/predictions API
 *   "owner/model:version"   — uses the older /v1/predictions API with explicit version hash
 *
 * Returns a base64 data URL on success, or null on any failure
 * (missing config, network error, model error). The resolver falls back
 * to the deterministic SVG generator on null.
 */

const REPLICATE_DEFAULT_MODEL =
  process.env["REPLICATE_IMAGE_MODEL"] ?? "black-forest-labs/flux-schnell";

const TIMEOUT_MS = 60_000;

export interface CoverGenInput {
  worldName: string;
  genre: string;
  tone: string;
}

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

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string | null;
  urls?: { get?: string };
}

async function pollUntilDone(
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

async function generateViaReplicate(input: CoverGenInput): Promise<string | null> {
  const token = process.env["REPLICATE_API_TOKEN"];
  if (!token) return null;

  const modelStr = REPLICATE_DEFAULT_MODEL;
  const colonIndex = modelStr.indexOf(":");
  const isVersioned = colonIndex !== -1;

  let postUrl: string;
  let body: Record<string, unknown>;

  if (isVersioned) {
    // Legacy format: "owner/model:version-hash" → POST /v1/predictions
    const version = modelStr.slice(colonIndex + 1);
    if (!version) {
      console.warn("[cover-art-gen] version hash missing in REPLICATE_IMAGE_MODEL");
      return null;
    }
    postUrl = "https://api.replicate.com/v1/predictions";
    body = {
      version,
      input: { prompt: buildPrompt(input), width: 1024, height: 576, num_inference_steps: 25 },
    };
  } else {
    // New format: "owner/model" → POST /v1/models/{owner}/{model}/predictions
    const [owner, modelName] = modelStr.split("/");
    if (!owner || !modelName) {
      console.warn("[cover-art-gen] REPLICATE_IMAGE_MODEL must be 'owner/model' or 'owner/model:version'");
      return null;
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

    // If the prediction isn't done yet, poll for completion
    if (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled"
    ) {
      const pollUrl = prediction.urls?.get;
      if (!pollUrl) return null;
      prediction = await pollUntilDone(pollUrl, token, controller.signal);
    }

    if (prediction.status !== "succeeded") {
      console.warn(`[cover-art-gen] prediction ${prediction.status}: ${prediction.error ?? "no detail"}`);
      return null;
    }

    const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!out) return null;

    // Fetch the image and convert to base64 data URL for inline storage
    const imgRes = await fetch(out, { signal: controller.signal });
    if (!imgRes.ok) return null;
    const arrayBuf = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") ?? "image/webp";
    const b64 = Buffer.from(arrayBuf).toString("base64");
    return `data:${contentType};base64,${b64}`;
  } catch (err) {
    console.warn(`[cover-art-gen] generation failed: ${(err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAICoverArt(input: CoverGenInput): Promise<string | null> {
  const provider = process.env["IMAGE_GEN_PROVIDER"]?.toLowerCase();
  if (!provider) return null;
  if (provider === "replicate") return generateViaReplicate(input);
  console.warn(`[cover-art-gen] unknown IMAGE_GEN_PROVIDER=${provider}; skipping AI generation`);
  return null;
}
