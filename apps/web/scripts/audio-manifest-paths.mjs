import path from "node:path";
import { access } from "node:fs/promises";

export async function resolveManifestPath(cwd = process.cwd()) {
  const candidates = [
    path.resolve(cwd, "lib/audio/master-audio-manifest.json"),
    path.resolve(cwd, "apps/web/lib/audio/master-audio-manifest.json")
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }

  throw new Error(`Could not find master-audio-manifest.json. Tried:\n- ${candidates.join("\n- ")}`);
}

export function resolveOutputDir(cwd = process.cwd()) {
  return process.env.AUDIO_PROMPTS_OUT_DIR
    ? path.resolve(cwd, process.env.AUDIO_PROMPTS_OUT_DIR)
    : path.resolve(cwd, "tmp/audio-prompts");
}
