import { readFileSync } from 'node:fs';

const file = 'docs/product/platform-parity.md';
const text = readFileSync(file, 'utf8');

const start = text.indexOf('## Core Gameplay');
if (start < 0) {
  console.error('Missing "## Core Gameplay" section in parity matrix.');
  process.exit(1);
}

const nextSection = text.indexOf('\n## ', start + 1);
const section = nextSection >= 0 ? text.slice(start, nextSection) : text.slice(start);

const rows = section
  .split('\n')
  .filter((line) => line.startsWith('|') && !line.includes('---') && !line.includes('Capability'));

const failingRows = rows.filter((line) => /\|\s*❌\s*\|/.test(line));

if (failingRows.length > 0) {
  console.error('Platform parity gate failed: core gameplay contains unresolved ❌ entries.');
  for (const row of failingRows) console.error(` - ${row}`);
  process.exit(1);
}

console.log('Platform parity gate passed: no ❌ entries in Core Gameplay.');
