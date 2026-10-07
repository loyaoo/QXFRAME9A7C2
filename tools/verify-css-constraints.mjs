// v3 section 6 gate: Flex only; no @layer, :is(), :where(), grid, fr or viewport units; lengths
// in rem (1px hairline excepted); no !important; every rule inside a marked source segment.
// Ratchet against tools/manifests/css-gate-baseline.json (section6).
//   node tools/verify-css-constraints.mjs [--write-baseline] [--allow-increase] [--list=<rule>]
import { collectSection6, countViolations, readBaseline, compareToBaseline, writeBaselineSection, readDistCss } from './css-gates.mjs';

export const SECTION6_RULES = ['import', 'layer', 'is-where', 'grid', 'fr-unit', 'viewport-unit', 'non-rem-length', 'important', 'outside-segment'];
// Rules with no live occurrences that must stay at zero regardless of the baseline.
const HARD_ZERO = ['import', 'layer', 'is-where', 'grid', 'fr-unit', 'viewport-unit', 'outside-segment'];

const args = process.argv.slice(2);
const violations = collectSection6(readDistCss());
const counts = countViolations(violations);
const list = (args.find(a => a.startsWith('--list=')) || '').slice(7);
if (list) for (const v of violations.filter(v => v.rule === list)) console.log(`${v.segment}\t${v.detail}`);

if (args.includes('--write-baseline')) {
  writeBaselineSection('section6', counts, { allowIncrease: args.includes('--allow-increase'), rules: SECTION6_RULES });
  console.log(JSON.stringify({ ok: true, wrote: 'section6', counts: Object.fromEntries(SECTION6_RULES.map(r => [r, Object.values(counts[r] || {}).reduce((a, b) => a + b, 0)])) }));
  process.exit(0);
}

const baseline = readBaseline().section6 || {};
const { increased, decreased } = compareToBaseline(counts, baseline, SECTION6_RULES);
const hard = HARD_ZERO.filter(rule => Object.values(counts[rule] || {}).some(n => n > 0));
const totals = Object.fromEntries(SECTION6_RULES.map(r => [r, Object.values(counts[r] || {}).reduce((a, b) => a + b, 0)]));
for (const row of decreased) console.log(`[ratchet] ${row.rule} ${row.segment}: ${row.baseline} → ${row.actual}; lower the baseline with --write-baseline.`);
if (increased.length || hard.length) {
  for (const row of increased) {
    console.error(`[css-constraints] ${row.rule} in ${row.segment}: ${row.baseline} → ${row.actual}`);
    for (const v of violations.filter(v => v.rule === row.rule && v.segment === row.segment).slice(0, 5)) console.error(`    ${v.detail}`);
  }
  for (const rule of hard) console.error(`[css-constraints] ${rule} must be zero.`);
  console.log(JSON.stringify({ ok: false, totals, increased: increased.length, hardZero: hard }));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, totals, baselineDecreased: decreased.length }));
