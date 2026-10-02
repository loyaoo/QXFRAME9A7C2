import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalStyleSource } from './style-source.mjs';
import { browserProbes } from './audit-css-schema-acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'tools/manifests/css-static-color-baseline.json'), 'utf8'));
const source = readCanonicalStyleSource({ root }).replace(/\/\*[\s\S]*?\*\//g, '');
assert.doesNotMatch(source, /color-mix\s*\(/, 'Runtime color synthesis must not return.');
for (const entry of baseline.entries) {
  assert.ok(source.includes(entry.themeToken + ':'), 'Static Theme role is missing: ' + entry.id);
  assert.ok(source.includes('var(' + entry.resolvedToken + ')'), 'Static role is disconnected: ' + entry.id);
  assert.ok(entry.decision && entry.consumers.length, 'Every retired formula needs a consumer decision.');
}
if (process.argv.includes('--browser')) {
  const expression = `(() => {
    const baseline = ${JSON.stringify(baseline)}, failures = [];
    const scope = document.getElementById('scope'), probe = document.createElement('div');
    probe.style.setProperty('transition','none','important'); probe.style.setProperty('animation','none','important'); scope.appendChild(probe);
    let checks = 0;
    for (const row of baseline.rows) {
      scope.setAttribute('data-qxframe9a7c2-theme',row.mode);
      probe.className = 'qxframe9a7c2-button' + (row.variant === 'bare' ? '' : ' is-' + row.variant);
      baseline.entries.forEach((entry,index) => {
        // This old formula was undefined without a physical color class and was
        // never consumed there. The static default is Blue; test every real axis.
        if (entry.normalized.includes('accent-seed)') && ['bare','default','primary','success','warning','error','info'].includes(row.variant)) return;
        probe.style.backgroundColor = 'var(' + entry.resolvedToken + ')';
        const actual = getComputedStyle(probe).backgroundColor;
        const reference = document.createElement('div'); reference.style.backgroundColor = row.values[index]; document.body.appendChild(reference);
        const expected = getComputedStyle(reference).backgroundColor; reference.remove();
        checks++;
        if (actual !== expected) failures.push({mode:row.mode,axis:row.variant,role:entry.id,actual,expected});
      });
    }
    return {checks,failures};
  })()`;
  const result = await browserProbes({ expression });
  console.log(JSON.stringify({ colorRegression: result }));
  assert.deepEqual(result.failures, [], 'Static defaults must preserve Light/Dark and all color axes.');
}
console.log(JSON.stringify({ ok: true, staticRoles: baseline.entries.length, modeAxisRows: baseline.rows.length, allConsumerDecisionsRecorded: true }));
