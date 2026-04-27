#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const run = spawnSync('pnpm', ['audit', '--prod', '--json'], {
  encoding: 'utf8'
});

const raw = (run.stdout || '').trim();

function fail(message) {
  console.error(`RELEASE_GATED: ${message}`);
  process.exit(1);
}

function parseJsonCandidates(text) {
  const candidates = [text, ...text.split('\n').map((line) => line.trim()).filter(Boolean)];
  const parsed = [];

  for (const candidate of candidates) {
    try {
      parsed.push(JSON.parse(candidate));
    } catch {
      // ignore non-JSON fragments
    }
  }

  return parsed;
}

if (!raw) {
  fail(
    'No audit payload returned. Treating dependency risk as UNKNOWN. Ensure npm audit endpoint access and rerun.'
  );
}

const parsedCandidates = parseJsonCandidates(raw);
if (parsedCandidates.length === 0) {
  fail(
    'Audit output was not valid JSON. Treating dependency risk as UNKNOWN. Ensure network/audit endpoint access and rerun.'
  );
}

const flattened = parsedCandidates.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
const payload =
  flattened.find((entry) => entry?.metadata?.vulnerabilities) ||
  flattened.find((entry) => entry?.error?.code) ||
  flattened[0];

if (payload?.error?.code) {
  fail(
    `Audit request failed with ${payload.error.code}: ${payload.error.message || 'unknown error'}. Treating dependency risk as UNKNOWN.`
  );
}

const vulns = payload?.metadata?.vulnerabilities;
if (!vulns) {
  fail('Audit JSON did not include vulnerability metadata. Treating dependency risk as UNKNOWN.');
}

const critical = Number(vulns.critical || 0);
const high = Number(vulns.high || 0);
const moderate = Number(vulns.moderate || 0);
const low = Number(vulns.low || 0);

console.log(`audit summary -> critical=${critical} high=${high} moderate=${moderate} low=${low}`);

if (critical > 0 || high > 0) {
  fail('High/Critical vulnerabilities detected. Release blocked until triaged and remediated or explicitly waived.');
}

if (run.status !== 0 && critical === 0 && high === 0) {
  fail('Audit command exited non-zero without high/critical findings. Treating as UNKNOWN and blocking release.');
}

if (moderate > 0 || low > 0) {
  console.warn('WARNING: Moderate/Low vulnerabilities present; create tracking tickets and remediation timeline before release.');
}

console.log('PASS: no known high/critical dependency vulnerabilities.');
