#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

async function readJson(relPath) {
  const content = await readFile(path.join(root, relPath), 'utf8');
  return JSON.parse(content);
}

async function readText(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function major(version) {
  const match = String(version).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getDep(pkg, name) {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? null;
}

const errors = [];

function fail(rule, details, fix) {
  errors.push({ rule, details, fix });
}

function ensureScript(pkg, pkgPath, scriptName, semantics) {
  const cmd = pkg.scripts?.[scriptName];
  if (!cmd) {
    fail('required-scripts', `${pkgPath} is missing \`${scriptName}\``, `Add scripts.${scriptName} (${semantics}).`);
  }
}

function ensureScriptMatches(pkg, pkgPath, scriptName, regex, semantics) {
  const cmd = pkg.scripts?.[scriptName];
  if (!cmd) return;
  if (!regex.test(cmd)) {
    fail('script-semantics', `${pkgPath} script \`${scriptName}\` should match ${regex} but is: ${cmd}`, `Update scripts.${scriptName} to satisfy: ${semantics}.`);
  }
}

const rootPkg = await readJson('package.json');
const webPkg = await readJson('apps/web/package.json');
const mobilePkg = await readJson('apps/mobile/package.json');
const apiPkg = await readJson('apps/api/package.json');
const sharedPkg = await readJson('packages/shared/package.json');
const gmPkg = await readJson('packages/gm-engine/package.json');
const readme = await readText('README.md');

// 1) Docs claims vs manifests
const docsChecks = [
  {
    label: 'Next.js major in README',
    pattern: /Next\.js\s+(\d+)/i,
    actual: major(getDep(webPkg, 'next')),
  },
  {
    label: 'Expo SDK major in README',
    pattern: /Expo\s+SDK[^\d]*(\d+)/i,
    actual: major(getDep(mobilePkg, 'expo')),
  },
  {
    label: 'Node.js major in README requirements',
    pattern: /\|\s*Node\.js\s*\|\s*[≥>=~^ ]*(\d+)/i,
    actual: major(rootPkg.engines?.node),
  },
  {
    label: 'pnpm major in README requirements',
    pattern: /\|\s*pnpm\s*\|\s*(\d+)/i,
    actual: major(rootPkg.packageManager),
  },
];

for (const check of docsChecks) {
  const match = readme.match(check.pattern);
  if (!match) {
    fail('docs-claims', `${check.label} not found in README.md`, `Add an explicit claim so it can be validated automatically.`);
    continue;
  }
  const claimed = Number(match[1]);
  if (claimed !== check.actual) {
    fail('docs-claims', `${check.label} mismatch: docs claim ${claimed}, manifest has ${check.actual}`, 'Update README claim or package manifest to match.');
  }
}

// 2) Required scripts per app
const apps = [
  ['apps/web/package.json', webPkg, /^next\s+dev/],
  ['apps/api/package.json', apiPkg, /(tsx\s+watch|node\s+.*dev)/],
];
for (const [pkgPath, pkg, devPattern] of apps) {
  ensureScript(pkg, pkgPath, 'dev', 'local development entrypoint');
  ensureScript(pkg, pkgPath, 'build', 'production build');
  ensureScript(pkg, pkgPath, 'typecheck', 'TypeScript checking');
  ensureScript(pkg, pkgPath, 'test', 'automated tests');
  ensureScriptMatches(pkg, pkgPath, 'dev', devPattern, 'run framework dev server or watcher');
  ensureScriptMatches(pkg, pkgPath, 'build', /(build|tsc|next\s+build|expo\s+export)/, 'execute a real build command');
  ensureScriptMatches(pkg, pkgPath, 'typecheck', /(tsc|typecheck)/, 'run TypeScript type checks');
}

// mobile uses `start` instead of `dev`
ensureScript(mobilePkg, 'apps/mobile/package.json', 'start', 'mobile development entrypoint');
ensureScript(mobilePkg, 'apps/mobile/package.json', 'typecheck', 'TypeScript checking');
ensureScript(mobilePkg, 'apps/mobile/package.json', 'test', 'automated tests');
ensureScriptMatches(mobilePkg, 'apps/mobile/package.json', 'start', /^expo\s+start/, 'start Expo development server');

// 3) Shared critical dependency alignment
const tsVersions = [
  ['root', getDep(rootPkg, 'typescript')],
  ['apps/mobile', getDep(mobilePkg, 'typescript')],
  ['apps/api', getDep(apiPkg, 'typescript')],
  ['packages/shared', getDep(sharedPkg, 'typescript')],
  ['packages/gm-engine', getDep(gmPkg, 'typescript')],
].filter(([, v]) => v);

const expectedTs = tsVersions[0]?.[1];
for (const [name, version] of tsVersions) {
  if (version !== expectedTs) {
    fail('dependency-alignment', `TypeScript mismatch in ${name}: ${version} != ${expectedTs}`, 'Pin TypeScript to one exact version across workspaces.');
  }
}

const anthropicVersions = [
  ['apps/web', getDep(webPkg, '@anthropic-ai/sdk')],
  ['apps/api', getDep(apiPkg, '@anthropic-ai/sdk')],
].filter(([, v]) => v);
if (new Set(anthropicVersions.map(([, v]) => v)).size > 1) {
  fail('dependency-alignment', `@anthropic-ai/sdk mismatch: ${anthropicVersions.map(([n, v]) => `${n}=${v}`).join(', ')}`, 'Align @anthropic-ai/sdk version in all apps that use it.');
}

if (errors.length > 0) {
  console.error('\n❌ Repo consistency check failed.\n');
  for (const [i, err] of errors.entries()) {
    console.error(`${i + 1}. [${err.rule}] ${err.details}`);
    console.error(`   ↳ Fix: ${err.fix}`);
  }
  console.error(`\nFound ${errors.length} issue(s).`);
  process.exit(1);
}

console.log('✅ Repo consistency check passed.');
