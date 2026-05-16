/**
 * AI cover-art generation for blog posts. Uses the same provider plumbing
 * as `cover-art-gen.ts` (BFL or Replicate via IMAGE_GEN_PROVIDER) but with
 * a prompt builder tuned for editorial / blog-hero imagery rather than
 * audiobook covers.
 *
 *   IMAGE_GEN_PROVIDER=bfl                      (recommended)
 *   BFL_API_KEY=bfl_...
 *   MODEL_NAME=black-forest-labs/flux-dev        (default; "flux-dev" / "flux-pro" / "flux-pro-1.1")
 *
 *   IMAGE_GEN_PROVIDER=replicate                 (fallback)
 *   REPLICATE_API_TOKEN=r8_...
 *   REPLICATE_IMAGE_MODEL=black-forest-labs/flux-schnell
 *
 * Returns `{ url }` (base64 data: URL) on success or `{ error }` on failure
 * so callers can surface the provider message verbatim.
 */

const TIMEOUT_MS = 60_000;
const BFL_BASE = process.env["BFL_API_BASE"] ?? "https://api.bfl.ai/v1";

export interface BlogCoverInput {
  title: string;
  excerpt: string;
  /**
   * Optional snippet of the body to inform the prompt. The model uses this
   * to pick visual cues (e.g. "screen reader" suggests a hand on a keyboard,
   * "ambient sound" suggests a flickering hearth). Trimmed to ~600 chars so
   * the prompt stays focused.
   */
  contentSnippet?: string;
}

export type BlogCoverResult =
  | { url: string; error?: never }
  | { url?: never; error: string };

// Visual-cue keywords mapped to short scene descriptors. The mapping is
// intentionally restrictive — a vague match dilutes the prompt. We pick at
// most three matched scenes and weave them into the prompt below.
const CUE_MAP: Array<{ test: RegExp; scene: string }> = [
  { test: /screen reader|nvda|jaws|voiceover|talkback|keyboard navigation|accessibilit/i, scene: "a glowing keyboard under low light with sound waves rippling above the keys" },
  { test: /voice command|voice input|microphone/i, scene: "a softly glowing microphone surrounded by spoken word ribbons" },
  { test: /ambient|sound design|audio/i, scene: "an atmospheric tableau with a flickering hearth, motes of dust, and curling sound ribbons" },
  { test: /world.?build|game bible|lore|world.?wizard/i, scene: "an open leather-bound atlas with hand-drawn maps and scattered relics" },
  { test: /dungeon|combat|battle|monster/i, scene: "the silhouette of an adventurer at the threshold of a vast stone chamber" },
  { test: /npc|character archetype|hero|paladin|rogue|warrior|mage|bard|ranger/i, scene: "an ensemble of cloaked travelers gathered around a campfire under starlight" },
  { test: /quest|adventure|campaign/i, scene: "a lone traveler on a winding mountain road at dawn" },
  { test: /immersion|imagination|brain|cognitive/i, scene: "a constellation of stars forming the shape of an open book" },
  { test: /tabletop|d&d|dungeons.*dragons/i, scene: "a softly lit table with dice, parchment, and a steaming mug" },
  { test: /ai|claude|model|machine/i, scene: "a delicate filigree of glowing threads weaving themselves into a story" },
  { test: /accessibility|blind|low vision|visually impaired/i, scene: "warm light streaming across a tactile braille manuscript" },
  { test: /narrat|story|fiction/i, scene: "a candlelit reading nook with a story spilling visibly from the open book" },
];

function pickScenes(haystack: string): string[] {
  const matches: string[] = [];
  for (const { test, scene } of CUE_MAP) {
    if (test.test(haystack) && !matches.includes(scene)) {
      matches.push(scene);
      if (matches.length >= 3) break;
    }
  }
  return matches;
}

// Strip C0 control characters (except TAB/LF/CR) plus DEL, then collapse
// markdown punctuation that confuses the image-model prompt parser
// (asterisks, backticks, angle brackets, parens, square brackets). Built
// via RegExp constructor so the source file isn't littered with literal
// control bytes that some editors / linters mangle.
const CONTROL_CHAR_RE = new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "g");

function sanitiseForPrompt(text: string, maxLen: number): string {
  return text
    .replace(CONTROL_CHAR_RE, " ")
    .replace(/[#*_`>[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function buildBlogCoverPrompt(input: BlogCoverInput): string {
  const title = sanitiseForPrompt(input.title, 140);
  const excerpt = sanitiseForPrompt(input.excerpt, 240);
  const snippet = sanitiseForPrompt(input.contentSnippet ?? "", 600);

  const haystack = `${title} ${excerpt} ${snippet}`;
  const scenes = pickScenes(haystack);

  const sceneClause = scenes.length > 0
    ? `Visual focus: ${scenes.join("; ")}. `
    : "";

  return [
    `Editorial illustration for a blog article titled "${title}".`,
    `Article excerpt: ${excerpt}`,
    sceneClause,
    "Style: warm painterly editorial illustration, soft volumetric lighting,",
    "muted purples and warm ambers with deep contrast, magazine-cover quality.",
    "Audio-first / accessibility-themed visual metaphor where relevant.",
    "No text, no logos, no UI elements, no human faces in the foreground.",
    "Wide cinematic composition. 16:9 aspect ratio. Painterly, not photographic.",
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
  polling_url?: string;
  status: string;
  result?: { sample?: string };
}

async function generateViaBFL(prompt: string): Promise<BlogCoverResult> {
  const apiKey = process.env["BFL_API_KEY"];
  if (!apiKey) return { error: "BFL_API_KEY is not set" };

  const modelEnv = process.env["MODEL_NAME"] ?? "black-forest-labs/flux-dev";
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
          prompt,
          width: 1024,
          height: 576,
          steps: modelName === "flux-schnell" ? 4 : 28,
        }),
      },
      controller.signal,
    )) as BFLResult;

    const taskId = created.id;
    if (!taskId) {
      const detail = JSON.stringify(created).slice(0, 200);
      return { error: `BFL: no task id in response — ${detail}` };
    }

    const TERMINAL = new Set(["Ready", "Error", "Content Moderated", "Request Moderated"]);
    const pollUrl = created.polling_url ?? `${BFL_BASE}/get_result?id=${taskId}`;
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
    return { error: `BFL request failed: ${(err as Error).message}` };
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

async function generateViaReplicate(prompt: string): Promise<BlogCoverResult> {
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
      input: { prompt, width: 1024, height: 576, num_inference_steps: 25 },
    };
  } else {
    const [owner, modelName] = modelStr.split("/");
    if (!owner || !modelName) {
      return { error: "REPLICATE_IMAGE_MODEL must be 'owner/model' or 'owner/model:version'" };
    }
    postUrl = `https://api.replicate.com/v1/models/${owner}/${modelName}/predictions`;
    body = {
      input: {
        prompt,
        aspect_ratio: "16:9",
        output_quality: 80,
        num_inference_steps: 4,
      },
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
    return { error: `Replicate request failed: ${(err as Error).message}` };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Entry point ────────────────────────────────────────────────────────────

async function generateFromPrompt(prompt: string): Promise<BlogCoverResult> {
  const provider = process.env["IMAGE_GEN_PROVIDER"]?.toLowerCase();
  if (!provider) return { error: "IMAGE_GEN_PROVIDER env var is not set" };
  if (provider === "bfl") return generateViaBFL(prompt);
  if (provider === "replicate") return generateViaReplicate(prompt);
  return { error: `Unknown IMAGE_GEN_PROVIDER="${provider}" (expected "bfl" or "replicate")` };
}

export async function generateBlogCoverArt(input: BlogCoverInput): Promise<BlogCoverResult> {
  return generateFromPrompt(buildBlogCoverPrompt(input));
}

export interface BlogSectionImageInput {
  /** Post title — keeps the section image tonally tied to the article. */
  title: string;
  /** The H2 heading this image illustrates. */
  heading: string;
  /** First ~400 chars of the section body, for visual-cue extraction. */
  sectionText?: string;
  /**
   * Zero-based section index. Folded into the prompt as a compositional
   * nudge so consecutive images in one post don't all come back as the
   * same framing — variety is the whole point of in-body images.
   */
  idx: number;
}

const SECTION_COMPOSITIONS = [
  "wide establishing shot, distant subject, lots of negative space",
  "intimate close-up, shallow depth of field, single focal object",
  "low-angle dramatic perspective looking upward",
  "overhead flat-lay arrangement of thematic objects",
  "side-lit profile composition with strong rim light",
  "atmospheric mid-distance scene framed through a doorway or arch",
];

export function buildBlogSectionPrompt(input: BlogSectionImageInput): string {
  const title = sanitiseForPrompt(input.title, 120);
  const heading = sanitiseForPrompt(input.heading, 120);
  const body = sanitiseForPrompt(input.sectionText ?? "", 400);

  const scenes = pickScenes(`${heading} ${body} ${title}`);
  const sceneClause = scenes.length > 0 ? `Visual focus: ${scenes.join("; ")}. ` : "";
  // Rotate the compositional style by section index so a post's images
  // read as a varied set rather than six near-identical frames.
  const composition = SECTION_COMPOSITIONS[input.idx % SECTION_COMPOSITIONS.length];

  return [
    `Editorial spot illustration for the section "${heading}" of an article about ${title}.`,
    sceneClause,
    `Composition: ${composition}.`,
    "Style: warm painterly editorial illustration, soft volumetric lighting,",
    "muted purples and warm ambers with deep contrast, cohesive with a",
    "magazine-cover visual language.",
    "Audio-first / accessibility-themed visual metaphor where relevant.",
    "No text, no logos, no UI elements, no human faces in the foreground.",
    "Wide cinematic composition. 16:9 aspect ratio. Painterly, not photographic.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateBlogSectionImage(
  input: BlogSectionImageInput,
): Promise<BlogCoverResult> {
  return generateFromPrompt(buildBlogSectionPrompt(input));
}

export function blogCoverProviderDiagnostic(): string | null {
  const provider = process.env["IMAGE_GEN_PROVIDER"]?.toLowerCase();
  if (!provider) return "IMAGE_GEN_PROVIDER env var is not set";
  if (provider === "bfl" && !process.env["BFL_API_KEY"]) return "BFL_API_KEY env var is not set";
  if (provider === "replicate" && !process.env["REPLICATE_API_TOKEN"]) return "REPLICATE_API_TOKEN env var is not set";
  return null;
}
