// Runs the release gate against saved `pnpm audit --prod --json` output.
// Run with: node --test scripts/security-release-gate.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const gate = fileURLToPath(new URL("./security-release-gate.mjs", import.meta.url));
const fixture = JSON.parse(
  readFileSync(new URL("./__fixtures__/pnpm-audit.json", import.meta.url), "utf8"),
);
const dir = mkdtempSync(join(tmpdir(), "security-gate-"));
let files = 0;

function write(value) {
  const file = join(dir, `${++files}.json`);
  writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value, null, 2));
  return file;
}

function runGate(report, waivers = { packageNames: [], advisoryUrls: [] }) {
  const run = spawnSync(
    process.execPath,
    [gate, "--audit-json", write(report), "--waivers", write(waivers)],
    { encoding: "utf8" },
  );
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

/** The fixture with only the named advisories kept. */
function only(...modules) {
  const advisories = Object.fromEntries(
    Object.entries(fixture.advisories).filter(([, a]) => modules.includes(a.module_name)),
  );
  return { ...fixture, advisories };
}

const crossSpawnUrl = "https://github.com/advisories/GHSA-3xgq-45jj-v275";

test("blocks on a high advisory", () => {
  const { status, output } = runGate(fixture);
  assert.equal(status, 1);
  assert.match(output, /\[pnpm-audit\] critical=0 high=1 moderate=1 low=0 unknown=0/);
  assert.match(output, /HIGH cross-spawn \(>=7\.0\.0 <7\.0\.5\) -> https:\/\/github\.com\/advisories\/GHSA-3xgq-45jj-v275/);
  assert.match(output, /RELEASE_GATED: High\/Critical/);
});

test("passes when only moderate advisories remain", () => {
  const { status, output } = runGate(only("nanoid"));
  assert.equal(status, 0);
  assert.match(output, /\[pnpm-audit\] critical=0 high=0 moderate=1/);
  assert.match(output, /PASS: no high\/critical/);
});

test("honours a waiver by package name", () => {
  const { status, output } = runGate(fixture, { packageNames: ["cross-spawn"], advisoryUrls: [] });
  assert.equal(status, 0);
  assert.match(output, /Waived findings:\n - HIGH cross-spawn/);
  assert.match(output, /\[pnpm-audit\] critical=0 high=0 moderate=1/);
});

test("honours a waiver by advisory URL", () => {
  const { status, output } = runGate(fixture, { packageNames: [], advisoryUrls: [crossSpawnUrl] });
  assert.equal(status, 0);
  assert.match(output, /Waived findings:\n - HIGH cross-spawn/);
});

test("a waiver for another package does not hide the advisory", () => {
  const { status } = runGate(fixture, { packageNames: ["nanoid"], advisoryUrls: [] });
  assert.equal(status, 1);
});

test("counts info advisories as low", () => {
  const report = only("nanoid");
  report.advisories["1101163"] = { ...report.advisories["1101163"], severity: "info" };
  const { status, output } = runGate(report);
  assert.equal(status, 0);
  assert.match(output, /moderate=0 low=1 unknown=0/);
});

test("blocks on an advisory with an unknown severity", () => {
  const report = only("nanoid");
  report.advisories["1101163"] = { ...report.advisories["1101163"], severity: "bogus" };
  const { status, output } = runGate(report);
  assert.equal(status, 1);
  assert.match(output, /unknown=1/);
});

test("falls back to the metadata totals when advisories are missing", () => {
  const { advisories: _advisories, ...report } = fixture;
  const { status, output } = runGate(report, { packageNames: ["cross-spawn"], advisoryUrls: [] });
  assert.equal(status, 1);
  assert.match(output, /\[pnpm-audit\] critical=0 high=1 moderate=1/);
});

test("passes a clean report", () => {
  const report = {
    ...fixture,
    actions: [],
    advisories: {},
    metadata: {
      ...fixture.metadata,
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 },
    },
  };
  const { status, output } = runGate(report);
  assert.equal(status, 0);
  assert.match(output, /critical=0 high=0 moderate=0 low=0 unknown=0/);
});

test("fails closed on unreadable audit output", () => {
  const { status, output } = runGate("not json");
  assert.equal(status, 1);
  assert.match(output, /RELEASE_GATED: could not evaluate --audit-json/);
});
