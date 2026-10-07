// v3 section 5 gate: closed --qxframe9a7c2-theme-* inventory declared only in :root / .dark, no
// public component tokens declared by the framework, no non-theme declarations on :root, colour
// literals only inside theme blocks, one owner per final property, theme files ≤ 16KB (warning).
// Ratchet against tools/manifests/css-gate-baseline.json (section5).
//   node tools/verify-theme-tokens.mjs [--theme-file=<exported.css> ...] [--write-baseline] [--allow-increase] [--list=<rule>]
import fs from 'node:fs';
import { collectSection5, countViolations, readBaseline, compareToBaseline, writeBaselineSection, readDistCss, checkThemeFile, extractDefaultThemeBlocks, THEME_FILE_WARN_BYTES } from './css-gates.mjs';

export const SECTION5_RULES = ['theme-token-outside-root', 'public-component-token-declared', 'root-non-theme-declaration', 'hardcoded-color', 'duplicate-owner', 'unregistered-theme-token'];

const args = process.argv.slice(2);
const css = readDistCss();
const violations = collectSection5(css);
const counts = countViolations(violations);
const list = (args.find(a => a.startsWith('--list=')) || '').slice(7);
if (list) for (const v of violations.filter(v => v.rule === list)) console.log(`${v.segment}\t${v.detail}`);

if (args.includes('--write-baseline')) {
  writeBaselineSection('section5', counts, { allowIncrease: args.includes('--allow-increase'), rules: SECTION5_RULES });
  console.log(JSON.stringify({ ok: true, wrote: 'section5' }));
  process.exit(0);
}

let failed = false;
const warnings = [];
// Exported theme files are checked strictly (no ratchet).
for (const file of args.filter(a => a.startsWith('--theme-file=')).map(a => a.slice(13))) {
  const result = checkThemeFile(fs.readFileSync(file, 'utf8'));
  for (const error of result.errors) { console.error(`[theme-file] ${file}: ${error}`); failed = true; }
  if (result.warn) warnings.push(`${file} is ${result.bytes} bytes (> ${THEME_FILE_WARN_BYTES})`);
}
const defaultTheme = extractDefaultThemeBlocks(css);
const defaultBytes = Buffer.byteLength(defaultTheme);
if (defaultBytes > THEME_FILE_WARN_BYTES) warnings.push(`default theme block is ${defaultBytes} bytes (> ${THEME_FILE_WARN_BYTES})`);
for (const w of warnings) console.log(`::warning::theme file size: ${w}`);

const baseline = readBaseline().section5 || {};
const { increased, decreased } = compareToBaseline(counts, baseline, SECTION5_RULES);
const totals = Object.fromEntries(SECTION5_RULES.map(r => [r, Object.values(counts[r] || {}).reduce((a, b) => a + b, 0)]));
for (const row of decreased) console.log(`[ratchet] ${row.rule} ${row.segment}: ${row.baseline} → ${row.actual}; lower the baseline with --write-baseline.`);
for (const row of increased) {
  console.error(`[theme-tokens] ${row.rule} in ${row.segment}: ${row.baseline} → ${row.actual}`);
  for (const v of violations.filter(v => v.rule === row.rule && v.segment === row.segment).slice(0, 5)) console.error(`    ${v.detail}`);
}
if (increased.length) failed = true;
console.log(JSON.stringify({ ok: !failed, totals, defaultThemeBytes: defaultBytes, sizeWarnings: warnings.length, increased: increased.length, baselineDecreased: decreased.length }));
process.exit(failed ? 1 : 0);
