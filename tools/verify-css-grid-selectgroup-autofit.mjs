import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');

assert.match(css,/\.qxframe9a7c2-form-selectgroup-item\{flex:1 1 var\(--_qxframe9a7c2-form-selectgroup-item-basis,0\);min-width:var\(--_qxframe9a7c2-form-selectgroup-item-min-width,0\)\}/);
assert.match(css,/\.qxframe9a7c2-form-selectgroup\.is-image-grid\{display:flex;--_qxframe9a7c2-form-selectgroup-item-basis:8\.5rem;--_qxframe9a7c2-form-selectgroup-item-min-width:8\.5rem;/);
assert.match(css,/\.qxframe9a7c2-form-selectgroup\.is-boxes\{display:flex;--_qxframe9a7c2-form-selectgroup-item-basis:13\.125rem;--_qxframe9a7c2-form-selectgroup-item-min-width:13\.125rem\}/);
assert.doesNotMatch(css,/\.qxframe9a7c2-form-selectgroup\.(?:is-image-grid|is-boxes)\{[^}]*display:grid/);
assert.doesNotMatch(css,/\.qxframe9a7c2-form-selectgroup\.(?:is-image-grid|is-boxes)\{[^}]*grid-template-columns/);

console.log(JSON.stringify({ok:true,batch:'selectgroup-auto-fit-to-flex',convertedRules:2}));
