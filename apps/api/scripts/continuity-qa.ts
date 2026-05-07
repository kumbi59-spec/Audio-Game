import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { continuityHeuristics } from "../src/gm/continuity.js";

type Fixture = {
  id: string;
  memoryFacts: string[];
  narration: string;
  expected: { contradiction: boolean; omission: boolean };
};

const fixturePath = resolve(process.cwd(), "scripts/fixtures/continuity-qa-fixtures.json");
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8")) as Fixture[];

let matched = 0;
const rows = fixtures.map((f) => {
  const baseline = { contradiction: false, omission: false };
  const now = continuityHeuristics(f.memoryFacts, f.narration);
  const after = {
    contradiction: now.contradictionFlags.length > 0,
    omission: now.omissionFlags.length > 0,
  };
  const ok = after.contradiction === f.expected.contradiction && after.omission === f.expected.omission;
  if (ok) matched += 1;
  return { id: f.id, baseline, after, expected: f.expected, ok };
});

console.table(rows);
console.log(JSON.stringify({
  event: "continuity_qa_summary",
  total: fixtures.length,
  matched,
  baselineMatched: fixtures.filter((f) => f.expected.contradiction === false && f.expected.omission === false).length,
  afterMatched: matched,
}));

if (matched !== fixtures.length) {
  process.exitCode = 1;
}
