import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const apps = ['apps/web', 'apps/api'];
const dependencyName = '@anthropic-ai/sdk';
const allowlistPath = path.join(root, 'scripts/anthropic-sdk-version-allowlist.json');

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const versions = new Map();

  for (const app of apps) {
    const packagePath = path.join(root, app, 'package.json');
    const pkg = await readJson(packagePath);
    const version = pkg.dependencies?.[dependencyName] ?? null;
    versions.set(app, version);
  }

  const uniqueVersions = new Set(Array.from(versions.values()));
  if (uniqueVersions.size <= 1) {
    console.log(`[ok] ${dependencyName} is synchronized across apps: ${Array.from(uniqueVersions)[0]}`);
    return;
  }

  const allowlist = await readJson(allowlistPath);
  const allowlistEntries = Array.isArray(allowlist.allowlist) ? allowlist.allowlist : [];

  const matchedEntry = allowlistEntries.find((entry) => {
    return apps.every((app) => versions.get(app) === entry.versions?.[app]);
  });

  if (matchedEntry) {
    console.log(`[allowlisted] Divergence for ${dependencyName}: ${matchedEntry.reason}`);
    return;
  }

  console.error(`[error] ${dependencyName} versions diverged without allowlist entry.`);
  for (const [app, version] of versions.entries()) {
    console.error(`  - ${app}: ${version}`);
  }
  console.error(`Add an allowlist entry in scripts/anthropic-sdk-version-allowlist.json if divergence is intentional.`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error('[error] Failed to check anthropic sdk versions.');
  console.error(error);
  process.exitCode = 1;
});
