import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalComponentStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');

assert.match(css,/\.qxframe9a7c2-form-selectgroup-item\{flex:1 1 var\(--_qxframe9a7c2-form-selectgroup-item-basis,0\);min-width:var\(--_qxframe9a7c2-form-selectgroup-item-min-width,0\)\}/);
assert.match(theme,/--qxframe9a7c2-theme-form-selectgroup-image-basis:\s*calc\(var\(--qxframe9a7c2-size-38\) \+ var\(--qxframe9a7c2-size-4\)\)/);
assert.match(css,/\.qxframe9a7c2-form-selectgroup\.is-image-grid\{display:flex;--_qxframe9a7c2-form-selectgroup-item-basis:var\(--qxframe9a7c2-theme-form-selectgroup-image-basis\);--_qxframe9a7c2-form-selectgroup-item-min-width:var\(--qxframe9a7c2-theme-form-selectgroup-image-basis\);/);
assert.match(theme,/--qxframe9a7c2-theme-form-selectgroup-box-basis:\s*calc\(var\(--qxframe9a7c2-size-43\) \+ var\(--qxframe9a7c2-size-1\)\)/);
assert.match(css,/\.qxframe9a7c2-form-selectgroup\.is-boxes\{display:flex;--_qxframe9a7c2-form-selectgroup-item-basis:var\(--qxframe9a7c2-theme-form-selectgroup-box-basis\);--_qxframe9a7c2-form-selectgroup-item-min-width:var\(--qxframe9a7c2-theme-form-selectgroup-box-basis\)\}/);
assert.doesNotMatch(css,/\.qxframe9a7c2-form-selectgroup\.(?:is-image-grid|is-boxes)\{[^}]*display:grid/);
assert.doesNotMatch(css,/\.qxframe9a7c2-form-selectgroup\.(?:is-image-grid|is-boxes)\{[^}]*grid-template-columns/);

console.log(JSON.stringify({ok:true,batch:'selectgroup-auto-fit-to-flex',convertedRules:2}));
