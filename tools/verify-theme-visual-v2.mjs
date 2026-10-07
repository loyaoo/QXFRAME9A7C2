// Theme contract gate (script name kept for the release pipeline). createApp v3 §5 supersedes the
// THEME-VISUAL-V2 generator: the createApp compiler writes the closed --qxframe9a7c2-theme-* list,
// qxframe.css owns every shared formula. This gate checks
//   - every style × default configuration compiles to a complete, valid theme file (:root + .dark),
//   - compilation is deterministic and the export header round-trips the configuration,
//   - the shared consumer formulas stay source-locked (mutation detection),
//   - (--browser) consumers resolve the compiled tokens for every style in light and dark.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifySemanticRuleSource } from './theme-v2-contract.mjs';
import { verifyGeometryRuleSource } from './theme-v2-geometry-contract.mjs';
import { checkThemeFile, THEME_FILE_WARN_BYTES } from './css-gates.mjs';
import { compileStyles } from './compile-styles.mjs';
import { browserProbes } from './audit-css-schema-acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const model = await import(pathToFileURL(path.join(root, 'docs/create/model.js')).href);
const STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'];

const verified = verifySemanticRuleSource(root);
await verifyGeometryRuleSource(root);
// The detector must reject a modified shared formula.
assert.throws(() => verifySemanticRuleSource(root, { sourceText: verified.source.replace('in oklch', 'in oklab') }), /Unmapped or modified/);

const themes = {};
for (const style of STYLES) {
  const config = model.normalizeConfig({ style });
  const fixed = { version: 'test', generatedAt: '2026-10-07T00:00:00.000Z' };
  const first = model.compileTheme(config, fixed), second = model.compileTheme(config, fixed);
  assert.equal(first.css, second.css, 'Compilation must be deterministic: ' + style);
  const check = checkThemeFile(first.body);
  assert.deepEqual(check.errors, [], 'Invalid compiled theme for ' + style);
  assert.ok(check.bytes <= THEME_FILE_WARN_BYTES, style + ' theme exceeds 16KB');
  const back = model.parseThemeHeader(first.css);
  assert.ok(back.ok, 'Header must round-trip: ' + style);
  assert.equal(model.serializeConfig(back.config), model.serializeConfig(config));
  themes[style] = first.body;
}
// The default block inside qxframe.css is the Nova + neutral compiler output.
const shipped = fs.readFileSync(path.join(root, 'src/styles/main/theme.css'), 'utf8');
assert.ok(shipped.includes(model.compileTheme(model.defaultConfig()).body), 'theme.css must equal the default compiler output.');

const report = { ok: true, contract: 'createapp-v3-theme', styles: STYLES.length, sourceLockedFormulas: verified.expressions.length };

if (process.argv.includes('--browser')) {
  const css = compileStyles({ root }).css;
  const failures = [];
  for (const style of STYLES) {
    const expression = `(() => {
      const failures = [];
      const style = document.createElement('style'); style.textContent = ${JSON.stringify(themes[style])} + '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(style);
      const scope = document.getElementById('scope');
      const probe = (cls, tag) => { const el = document.createElement(tag || 'div'); el.className = cls; scope.appendChild(el); return el; };
      const card = probe('qxframe9a7c2-card'), button = probe('qxframe9a7c2-button is-primary is-solid is-md', 'button');
      const outline = probe('qxframe9a7c2-button is-default is-outlined is-md', 'button'), input = probe('qxframe9a7c2-form-input', 'input');
      const sample = name => { const el = document.createElement('i'); el.style.color = 'var(--qxframe9a7c2-theme-' + name + ')'; scope.appendChild(el); const v = getComputedStyle(el).color; el.remove(); return v; };
      for (const mode of ['light', 'dark']) {
        scope.classList.toggle('dark', mode === 'dark');
        const expect = (label, actual, token) => { const want = sample(token); if (actual !== want) failures.push({ style: ${JSON.stringify(style)}, mode, label, actual, want }); };
        expect('card background', getComputedStyle(card).backgroundColor, 'card');
        expect('card text', getComputedStyle(card).color, 'card-foreground');
        expect('primary button', getComputedStyle(button).backgroundColor, 'primary');
        expect('outline button', getComputedStyle(outline).backgroundColor, 'outline');
        expect('input background', getComputedStyle(input).backgroundColor, 'field');
      }
      style.remove();
      return { checks: 10, failures };
    })()`;
    const result = await browserProbes({ cssText: css, expression });
    failures.push(...result.failures);
  }
  report.browser = { failures };
  assert.deepEqual(failures, [], 'Consumers must resolve the compiled theme tokens: ' + JSON.stringify(failures.slice(0, 10)));
}

fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/theme-visual-v2.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
