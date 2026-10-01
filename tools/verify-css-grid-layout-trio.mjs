import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');

assert.match(css,/\.qxframe9a7c2-period-panel-grid\{display:flex;flex-wrap:wrap;/);
assert.match(css,/\.qxframe9a7c2-period-panel-cell\{[^}]*flex:0 0 calc\(25% - \(var\(--qxframe9a7c2-theme-space-2\) \* \.75\)\)/);
assert.doesNotMatch(css,/\.qxframe9a7c2-period-panel-grid\{[^}]*(?:display:grid|grid-template-columns)/);

assert.match(css,/\.qxframe9a7c2-color-panel-fields\{display:flex;align-items:stretch;/);
assert.match(css,/\.qxframe9a7c2-color-panel-input\{min-width:0;width:auto;flex:1 1 0;/);
assert.doesNotMatch(css,/\.qxframe9a7c2-color-panel-fields\{[^}]*(?:display:grid|grid-template-columns)/);

assert.match(css,/\.qxframe9a7c2-picker-range-dual\{display:flex;align-items:center;/);
assert.match(css,/\.qxframe9a7c2-picker-range-control\{display:block;min-width:0;flex:1 1 0\}/);
assert.doesNotMatch(css,/\.qxframe9a7c2-picker-range-dual\{[^}]*(?:display:grid|grid-template-columns)/);

console.log(JSON.stringify({ok:true,batch:'period-color-range-grid-to-flex',convertedRules:3}));
