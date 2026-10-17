import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});

assert.match(css,/\.qxframe9a7c2-calendar\.is-period>\.qxframe9a7c2-calendar-grid\{column-gap:0;row-gap:0\}/);
assert.match(css,/\.qxframe9a7c2-calendar\.is-period \.qxframe9a7c2-calendar-cell\{[^}]*flex:0 0 25%/,'period Calendar cells fill row without gaps');
assert.match(css,/\.qxframe9a7c2-calendar\.is-period>\.qxframe9a7c2-calendar-grid\{[^}]*column-gap:0/,'period range highlights join');
assert.doesNotMatch(css,/\.qxframe9a7c2-calendar\.is-period>\.qxframe9a7c2-calendar-grid\{[^}]*(?:display:grid|grid-template-columns)/);

assert.match(css,/\.qxframe9a7c2-color-panel-fields\{display:flex;align-items:stretch;/);
assert.match(css,/\.qxframe9a7c2-color-panel-input\{min-width:0;width:auto;flex:1 1 0;/);
assert.doesNotMatch(css,/\.qxframe9a7c2-color-panel-fields\{[^}]*(?:display:grid|grid-template-columns)/);

assert.match(css,/\.qxframe9a7c2-picker-range-dual\{display:flex;align-items:center;/);
assert.match(css,/\.qxframe9a7c2-picker-range-control\{display:block;min-width:0;flex:1 1 0\}/);
assert.doesNotMatch(css,/\.qxframe9a7c2-picker-range-dual\{[^}]*(?:display:grid|grid-template-columns)/);

console.log(JSON.stringify({ok:true,batch:'period-color-range-grid-to-flex',convertedRules:3,retiredThemeSpacingDependency:false}));
