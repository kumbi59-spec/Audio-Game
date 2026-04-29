#!/usr/bin/env node
/**
 * Release-time dependency audit gate.
 *
 * Strategy: prefer OSV-Scanner (queries osv.dev, doesn't depend on the
 * npm registry's audit endpoint), fall back to `pnpm audit --prod` if
 * the scanner isn't installed. Fails closed on UNKNOWN.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(new URL(".", import.meta.url).pathname, "..");
const lockfile = resolve(repoRoot, "pnpm-lock.yaml");

function fail(message) {
  console.error(`RELEASE_GATED: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
  process.exit(0);
}

function which(cmd) {
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    encoding: "utf8",
  });
  return probe.status === 0 ? probe.stdout.trim().split("\n")[0] : null;
}

// ───────────────────────────── OSV-Scanner ──────────────────────────────
function runOsvScanner() {
  const bin = which("osv-scanner");
  if (!bin) return { ran: false };

  if (!existsSync(lockfile)) {
    fail(`pnpm-lock.yaml not found at ${lockfile}; cannot scan.`);
  }

  const run = spawnSync(
    bin,
    ["--lockfile", lockfile, "--format", "json"],
    { encoding: "utf8" },
  );

  // osv-scanner exits 1 when it finds vulns, 0 when clean, 127 etc on errors.
  if (run.status !== 0 && run.status !== 1) {
    return {
      ran: true,
      ok: false,
      reason: `osv-scanner exited ${run.status}: ${run.stderr || run.stdout}`,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(run.stdout || "{}");
  } catch (e) {
    return { ran: true, ok: false, reason: `osv-scanner JSON parse failed: ${e.message}` };
  }

  const counts = { critical: 0, high: 0, moderate: 0, low: 0, unknown: 0 };
  const results = parsed.results ?? [];

  for (const result of results) {
    for (const pkg of result.packages ?? []) {
      for (const vuln of pkg.vulnerabilities ?? []) {
        const sev = severityOf(vuln);
        counts[sev] += 1;
      }
    }
  }

  return { ran: true, ok: true, counts };
}

function severityOf(vuln) {
  // GHSA includes a "severity" string (CRITICAL/HIGH/MODERATE/LOW)
  const ghsa = vuln.database_specific?.severity;
  if (ghsa) {
    const s = String(ghsa).toLowerCase();
    if (s === "critical") return "critical";
    if (s === "high") return "high";
    if (s === "moderate" || s === "medium") return "moderate";
    if (s === "low") return "low";
  }

  // database_specific.cvss.score is a numeric value in many GHSA OSV entries
  const dbScore = vuln.database_specific?.cvss?.score;
  if (typeof dbScore === "number" && !Number.isNaN(dbScore)) {
    return scoreToSeverity(dbScore);
  }

  // severity[].score in the OSV spec is a CVSS *vector string*, not a number.
  // Older code tried parseFloat() on it, which always returns NaN for vectors.
  const cvss = (vuln.severity ?? []).find((s) => /CVSS/i.test(s.type));
  if (cvss?.score) {
    const numeric = parseFloat(cvss.score);
    if (!Number.isNaN(numeric)) return scoreToSeverity(numeric);

    // CVSS v3.x vector — compute base score via the official formula
    if (typeof cvss.score === "string" && /^CVSS:3\.[01]\//.test(cvss.score)) {
      const computed = computeCvssV3Score(cvss.score);
      if (computed !== null) return scoreToSeverity(computed);
    }

    // CVSS v4.0 vector — use worst-case impact metrics to estimate severity
    if (typeof cvss.score === "string" && cvss.score.startsWith("CVSS:4.")) {
      return estimateCvssV4Severity(cvss.score);
    }
  }

  return "unknown";
}

function scoreToSeverity(score) {
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "moderate";
  if (score >= 0.1) return "low";
  return "low";
}

// CVSS v3.0 / v3.1 base score from vector string (NIST spec).
function computeCvssV3Score(vector) {
  const parts = vector.split("/");
  const m = {};
  for (let i = 1; i < parts.length; i++) {
    const c = parts[i].indexOf(":");
    if (c > 0) m[parts[i].slice(0, c)] = parts[i].slice(c + 1);
  }
  const AV  = { N: 0.85, A: 0.62, L: 0.55, P: 0.20 };
  const AC  = { L: 0.77, H: 0.44 };
  const PrU = { N: 0.85, L: 0.62, H: 0.27 };
  const PrC = { N: 0.85, L: 0.68, H: 0.50 };
  const UI  = { N: 0.85, R: 0.62 };
  const IMP = { N: 0.00, L: 0.22, H: 0.56 };

  const av = AV[m.AV], ac = AC[m.AC];
  const pr = m.S === "C" ? PrC[m.PR] : PrU[m.PR];
  const ui = UI[m.UI];
  const c = IMP[m.C], intg = IMP[m.I], a = IMP[m.A];
  if ([av, ac, pr, ui, c, intg, a].some((v) => v === undefined)) return null;

  const iscBase = 1 - (1 - c) * (1 - intg) * (1 - a);
  const iss = m.S === "U"
    ? 6.42 * iscBase
    : 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15);
  if (iss <= 0) return 0.0;

  const expl = 8.22 * av * ac * pr * ui;
  const raw = m.S === "U"
    ? Math.min(iss + expl, 10)
    : Math.min(1.08 * (iss + expl), 10);
  return Math.ceil(raw * 10) / 10; // CVSS Roundup
}

// CVSS v4.0 — full formula is complex; derive severity from impact metrics.
function estimateCvssV4Severity(vector) {
  const parts = vector.split("/");
  const m = {};
  for (let i = 1; i < parts.length; i++) {
    const c = parts[i].indexOf(":");
    if (c > 0) m[parts[i].slice(0, c)] = parts[i].slice(c + 1);
  }
  const impacts = ["VC", "VI", "VA", "SC", "SI", "SA"];
  if (impacts.every((k) => !m[k] || m[k] === "N")) return "low";
  const highCount = impacts.filter((k) => m[k] === "H").length;
  const network = !m.AV || m.AV === "N";
  const lowAC = !m.AC || m.AC === "L";
  if (highCount >= 3 && network && lowAC) return "critical";
  if (highCount >= 2 && network) return "high";
  if (highCount >= 1 && network && lowAC) return "high";
  if (highCount >= 1) return "moderate";
  return "moderate";
}

// ──────────────────────────── pnpm audit fallback ──────────────────────
function runPnpmAudit() {
  const run = spawnSync("pnpm", ["audit", "--prod", "--json"], { encoding: "utf8" });
  const raw = (run.stdout || "").trim();
  if (!raw) return { ran: true, ok: false, reason: "empty pnpm audit output" };

  const candidates = [raw, ...raw.split("\n").map((l) => l.trim()).filter(Boolean)];
  const parsed = [];
  for (const c of candidates) {
    try { parsed.push(JSON.parse(c)); } catch { /* ignore */ }
  }
  if (parsed.length === 0) return { ran: true, ok: false, reason: "pnpm audit JSON parse failed" };

  const flat = parsed.flatMap((e) => (Array.isArray(e) ? e : [e]));
  const payload =
    flat.find((e) => e?.metadata?.vulnerabilities) ||
    flat.find((e) => e?.error?.code) ||
    flat[0];

  if (payload?.error?.code) {
    return { ran: true, ok: false, reason: `pnpm audit error ${payload.error.code}: ${payload.error.message ?? "unknown"}` };
  }

  const v = payload?.metadata?.vulnerabilities;
  if (!v) return { ran: true, ok: false, reason: "pnpm audit response missing vulnerability metadata" };

  return {
    ran: true,
    ok: true,
    counts: {
      critical: Number(v.critical || 0),
      high: Number(v.high || 0),
      moderate: Number(v.moderate || 0),
      low: Number(v.low || 0),
      unknown: 0,
    },
  };
}

// ───────────────────────────── decision ────────────────────────────────
function evaluate(source, counts) {
  console.log(
    `[${source}] critical=${counts.critical} high=${counts.high} moderate=${counts.moderate} low=${counts.low} unknown=${counts.unknown}`,
  );

  if (counts.critical > 0 || counts.high > 0) {
    fail("High/Critical vulnerabilities detected. Triage and remediate or explicitly waive before release.");
  }
  if (counts.unknown > 0) {
    fail(`${counts.unknown} unknown-severity vulnerabilities present. Treat as UNKNOWN and block release until classified.`);
  }
  if (counts.moderate > 0 || counts.low > 0) {
    console.warn("WARNING: moderate/low vulnerabilities present; track remediation.");
  }
  pass(`no high/critical dependency vulnerabilities (source: ${source}).`);
}

// ───────────────────────────── main ────────────────────────────────────
const osv = runOsvScanner();
if (osv.ran && osv.ok) {
  evaluate("osv-scanner", osv.counts);
}
if (osv.ran && !osv.ok) {
  console.warn(`osv-scanner could not produce a result (${osv.reason}); falling back to pnpm audit.`);
}

const audit = runPnpmAudit();
if (audit.ok) {
  evaluate("pnpm-audit", audit.counts);
}

fail(
  audit.reason ?? "no scanner produced a usable result. Install osv-scanner (https://google.github.io/osv-scanner/) or ensure pnpm audit has registry access.",
);
