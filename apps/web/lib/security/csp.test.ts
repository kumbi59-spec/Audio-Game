import { afterEach, describe, expect, it } from "vitest";
import { buildScriptPolicy, cspHeaderName, cspMode, generateNonce } from "./csp";
import { parseCspReports } from "./csp-report";

const env = process.env as Record<string, string | undefined>;
const saved = env["CSP_SCRIPT_POLICY"];
afterEach(() => {
  if (saved === undefined) delete env["CSP_SCRIPT_POLICY"];
  else env["CSP_SCRIPT_POLICY"] = saved;
});

describe("script policy", () => {
  it("is nonce-based with strict-dynamic and a report endpoint", () => {
    const policy = buildScriptPolicy("abc123==");
    expect(policy).toContain("script-src 'nonce-abc123==' 'strict-dynamic'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("report-uri /api/csp-report");
    expect(policy).not.toContain("unsafe-eval");
    expect(buildScriptPolicy("x", { dev: true })).toContain("'unsafe-eval'");
  });

  it("generates distinct base64 nonces", () => {
    const a = generateNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(generateNonce()).not.toBe(a);
  });

  it("defaults to report-only and switches by env", () => {
    delete env["CSP_SCRIPT_POLICY"];
    expect(cspMode()).toBe("report-only");
    env["CSP_SCRIPT_POLICY"] = "enforce";
    expect(cspMode()).toBe("enforce");
    env["CSP_SCRIPT_POLICY"] = "off";
    expect(cspMode()).toBe("off");
    env["CSP_SCRIPT_POLICY"] = "bogus";
    expect(cspMode()).toBe("report-only");
    expect(cspHeaderName("enforce")).toBe("Content-Security-Policy");
    expect(cspHeaderName("report-only")).toBe("Content-Security-Policy-Report-Only");
  });
});

describe("parseCspReports", () => {
  it("normalises legacy report-uri bodies and strips query strings", () => {
    expect(parseCspReports({
      "csp-report": {
        "document-uri": "https://echoquest.us/play?token=secret",
        "blocked-uri": "https://evil.example/x.js?a=1",
        "effective-directive": "script-src-elem",
        disposition: "report",
      },
    })).toEqual([{
      directive: "script-src-elem",
      blocked: "https://evil.example/x.js",
      document: "https://echoquest.us/play",
      source: "",
      disposition: "report",
    }]);
  });

  it("accepts Reporting API arrays and ignores junk", () => {
    const reports = parseCspReports([
      { type: "csp-violation", body: { effectiveDirective: "script-src-elem", blockedURL: "inline", documentURL: "https://echoquest.us/" } },
      { type: "csp-violation" },
      "junk",
    ]);
    expect(reports).toHaveLength(1);
    expect(reports[0]!.blocked).toBe("inline");
    expect(parseCspReports({ nope: true })).toEqual([]);
    expect(parseCspReports(null)).toEqual([]);
  });
});
