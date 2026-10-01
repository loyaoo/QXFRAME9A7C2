import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');

assert.match(css,/\.qxframe9a7c2-card\.is-horizontal\{display:flex\}/);
assert.match(css,/\.qxframe9a7c2-card\.is-horizontal>\.qxframe9a7c2-card-cover\{height:100%;flex:0 0 max\(7\.5rem,var\(--qxframe9a7c2-card-media-width,36%\)\);/);
assert.match(css,/\.qxframe9a7c2-card\.is-horizontal>\.qxframe9a7c2-card-main\{min-width:0;flex:1 1 0\}/);
assert.match(css,/@media \(max-width:38\.75rem\)\{\.qxframe9a7c2-card\.is-horizontal\{flex-direction:column\}/);
assert.doesNotMatch(css,/\.qxframe9a7c2-card\.is-horizontal\{[^}]*(?:display:grid|grid-template-columns)/);
console.log(JSON.stringify({ok:true,batch:'card-horizontal-grid-to-flex',convertedRules:2}));
