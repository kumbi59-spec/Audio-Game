/**
 * AI cover-art generation. Pluggable by env:
 *
 *   IMAGE_GEN_PROVIDER=replicate              (or unset to disable)
 *   REPLICATE_API_TOKEN=r8_...                (required when provider=replicate)
 *   REPLICATE_IMAGE_MODEL=stability-ai/sdxl   (defaults to SDXL)
 *
 * The function returns a base64 data URL on success, or null on any failure
 * (missing config, network error, model error). The resolver layer falls back
 * to the deterministic SVG generator on null.
 */

const REPLICATE_DEFAULT_MODEL =
  process.env["REPLICATE_IMAGE_MODEL"] ??
  "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

const TIMEOUT_MS = 60_000;

export interface CoverGenInput {
  worldName: string;
  genre: string;
  tone: string;
}

function buildPrompt({ worldName, genre, tone }: CoverGenInput): string {
  // Keep prompts general and atmospheric — book-cover composition, no text,
  // no people facing the camera, no recognizable celebrities or trademarked IP.
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
    throw new Error(`${url} → HTTP ${res.status} ${res.statusText}`);
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

async function generateViaReplicate(input: CoverGenInput): Promise<string | null> {
  const token = process.env["REPLICATE_API_TOKEN"];
  if (!token) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const [owner, modelAndVersion] = REPLICATE_DEFAULT_MODEL.split("/");
    const [, version] = (modelAndVersion ?? "").split(":");
    if (!owner || !version) {
      console.warn("[cover-art-gen] REPLICATE_IMAGE_MODEL must be 'owner/model:version'");
      return null;
    }

    const prompt = buildPrompt(input);
    const created = (await fetchJson(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version,
          input: { prompt, width: 1024, height: 576, num_inference_steps: 25 },
        }),
      },
      controller.signal,
    )) as ReplicatePrediction;

    let prediction = created;
    const pollUrl = prediction.urls?.get;
    if (!pollUrl) return null;

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled"
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      prediction = (await fetchJson(
        pollUrl,
        { headers: { Authorization: `Bearer ${token}` } },
        controller.signal,
      )) as ReplicatePrediction;
    }

    if (prediction.status !== "succeeded") {
      console.warn(`[cover-art-gen] replicate prediction ${prediction.status}: ${prediction.error ?? "no detail"}`);
      return null;
    }

    const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!out) return null;

    const imgRes = await fetch(out, { signal: controller.signal });
    if (!imgRes.ok) return null;
    const arrayBuf = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") ?? "image/png";
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
