import type { CampaignState, GameBible } from "@audio-rpg/shared";
import { apiBaseUrl } from "./config";

export interface CreateCampaignResponse {
  campaignId: string;
  title: string;
  worldId: string;
  authToken: string;
  state: CampaignState;
}

export interface WorldSummary {
  worldId: string;
  kind: "official" | "uploaded" | "created";
  title: string;
  createdAt: number;
}

export interface CampaignSummary {
  campaignId: string;
  worldId: string;
  title: string;
  sceneName: string;
  turnNumber: number;
  createdAt: number;
}

export interface WorldDetail {
  worldId: string;
  kind: "official" | "uploaded" | "created";
  title: string;
  bible: GameBible;
  warnings: string[];
}

async function http<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  let body = init.body;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers, body });
  if (!res.ok) {
    const detail = await safeReadError(res);
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const body = await res.text();
    try {
      const parsed = JSON.parse(body) as { message?: string; error?: unknown };
      if (parsed.message) return parsed.message;
      if (typeof parsed.error === "string") return parsed.error;
      return body.slice(0, 300);
    } catch {
      return body.slice(0, 300);
    }
  } catch {
    return "<unreadable>";
  }
}

export async function createCampaign(opts: {
  worldId?: string;
  characterName?: string;
}): Promise<CreateCampaignResponse> {
  return http<CreateCampaignResponse>("/campaigns", {
    method: "POST",
    json: {
      worldId: opts.worldId ?? "sunken_bell",
      characterName: opts.characterName ?? "Wren",
    },
  });
}

export async function listWorlds(): Promise<WorldSummary[]> {
  return http<WorldSummary[]>("/worlds");
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  return http<CampaignSummary[]>("/campaigns");
}

export async function getWorld(worldId: string): Promise<WorldDetail> {
  return http<WorldDetail>(`/worlds/${encodeURIComponent(worldId)}`);
}

export async function uploadWorldFromText(args: {
  text: string;
  titleHint?: string;
}): Promise<WorldDetail & { warnings: string[] }> {
  return http<WorldDetail & { warnings: string[] }>("/worlds/upload", {
    method: "POST",
    json: args,
  });
}

export async function uploadWorldFromFile(args: {
  uri: string;
  name: string;
  mimeType?: string;
}): Promise<WorldDetail & { warnings: string[]; extracted?: { format: string; meta: { pages?: number; bytesIn: number } } }> {
  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } objects.
  form.append("file", {
    uri: args.uri,
    name: args.name,
    type: args.mimeType ?? "application/octet-stream",
  } as unknown as Blob);
  const res = await fetch(`${apiBaseUrl()}/worlds/upload-file`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await safeReadError(res);
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json() as Promise<
    WorldDetail & {
      warnings: string[];
      extracted?: { format: string; meta: { pages?: number; bytesIn: number } };
    }
  >;
}

export async function createWorldFromBible(bible: GameBible): Promise<WorldDetail> {
  return http<WorldDetail>("/worlds", {
    method: "POST",
    json: { bible },
  });
}

export async function getWizardSuggestions(
  stepId: string,
  draft: Record<string, string>,
): Promise<string[]> {
  const res = await http<{ suggestions: string[] }>("/wizard/suggest", {
    method: "POST",
    json: { stepId, draft },
  });
  return res.suggestions ?? [];
}
