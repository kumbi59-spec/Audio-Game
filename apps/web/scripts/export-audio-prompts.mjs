import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveManifestPath, resolveOutputDir } from "./audio-manifest-paths.mjs";

function collectMissingAssets(node, bucket = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectMissingAssets(item, bucket);
    return bucket;
  }

  if (node && typeof node === "object") {
    if (node.status === "missing" && node.id && node.file_path && node.prompt) bucket.push(node);
    for (const value of Object.values(node)) collectMissingAssets(value, bucket);
  }

  return bucket;
}

function toCsvRow(values) {
  return values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
}

async function main() {
  const manifestPath = await resolveManifestPath();
  const outDir = resolveOutputDir();

  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const missing = collectMissingAssets(manifest);

  await mkdir(outDir, { recursive: true });

  const jsonPath = path.join(outDir, "missing-audio-assets.json");
  await writeFile(jsonPath, JSON.stringify({ manifestPath, count: missing.length, assets: missing }, null, 2));

  const csvHeader = ["id", "file_path", "volume_default", "ducking_priority", "loop", "prompt"];
  const csvRows = missing.map((asset) => toCsvRow([
    asset.id,
    asset.file_path,
    asset.volume_default,
    asset.ducking_priority,
    asset.loop,
    asset.prompt
  ]));
  const csvPath = path.join(outDir, "missing-audio-assets.csv");
  await writeFile(csvPath, [toCsvRow(csvHeader), ...csvRows].join("\n") + "\n");

  console.log(`Exported ${missing.length} missing assets from ${manifestPath}:`);
  console.log(`- ${jsonPath}`);
  console.log(`- ${csvPath}`);
}

main().catch((err) => {
  console.error("Failed to export audio prompts:", err);
  process.exit(1);
});
