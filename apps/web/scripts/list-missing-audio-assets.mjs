import { readFile } from "node:fs/promises";
import { resolveManifestPath } from "./audio-manifest-paths.mjs";

function collectMissingAssets(node, bucket = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectMissingAssets(item, bucket);
    return bucket;
  }

  if (node && typeof node === "object") {
    if (node.status === "missing" && node.id && node.file_path && node.prompt) {
      bucket.push({ id: node.id, file_path: node.file_path, prompt: node.prompt });
    }

    for (const value of Object.values(node)) collectMissingAssets(value, bucket);
  }

  return bucket;
}

async function main() {
  const manifestPath = await resolveManifestPath();
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const missing = collectMissingAssets(manifest);

  console.log(JSON.stringify({ manifestPath, count: missing.length, assets: missing }, null, 2));
}

main().catch((err) => {
  console.error("Failed to list missing audio assets:", err);
  process.exit(1);
});
