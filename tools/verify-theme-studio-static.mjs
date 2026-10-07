// The docs theme entry is createApp (v3 stage 2 owner decision): theme-playground.html keeps the
// all-component canvas with a framework Card linking to create/; the retired Studio / Playground assets stay unloaded and deleted.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = rel => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
const exists = rel => fs.existsSync(new URL('../' + rel, import.meta.url));
const html = read('docs/theme-playground.html');

for (const retired of ['docs/assets/qxframe9a7c2-theme-studio.js', 'docs/assets/qxframe9a7c2-theme-studio.css']) {
  assert.equal(exists(retired), false, 'Retired theme editor asset must stay deleted: ' + retired);
}
assert.doesNotMatch(html, /theme-generator\/|theme-studio|data-theme-studio-v2|data-qxframe9a7c2-visual=/, 'Playground must not load the retired Studio.');
assert.match(html, /href="create\/"/, 'Playground must link to createApp.');
assert.match(html, /class="qxframe9a7c2-card"/, 'Playground entry must use the framework Card.');
assert.match(html, /qxframe9a7c2-theme-playground\.js/, 'Playground keeps the all-component canvas.');
for (const file of ['docs/create/index.html', 'docs/create/app.js', 'docs/create/compiler.js', 'docs/create/tokens.js']) assert.ok(exists(file), 'createApp file missing: ' + file);
console.log(JSON.stringify({ ok: true, themeEntry: 'docs/create/', retiredStudioLoaded: false }));
