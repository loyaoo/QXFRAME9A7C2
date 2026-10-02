import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
assert.doesNotMatch(css,/\bdisplay\s*:\s*(?:inline-)?grid\b|\bgrid-(?:template|column|row|area|auto-(?:columns|rows|flow))\s*:/i,'Component CSS must not retain CSS Grid declarations.');
assert.doesNotMatch(css,/(^|[^a-z0-9.-])-?\d*\.?\d+fr\b/i,'Component CSS must not retain fr units.');
assert.doesNotMatch(css,/--qxframe9a7c2-grid-gap-[xy]:\s*\d*\.?\d+rem\s*;/,'Grid gutter utilities must consume Theme Grid gap tokens, not raw rem literals.');
for(let i=1;i<=24;i++){
  assert.ok(theme.includes(`--qxframe9a7c2-theme-grid-gap-${i}: var(--qxframe9a7c2-size-${i});`),`Theme Grid gap ${i} must map to Size Tree node ${i}.`);
  assert.ok(css.includes(`var(--qxframe9a7c2-theme-grid-gap-${i})`),`Grid gutter utilities must consume Theme Grid gap ${i}.`);
}
assert.match(css,/\.qxframe9a7c2-card-grid\{display:flex;flex-wrap:wrap\}/);
assert.match(css,/\.qxframe9a7c2-card-grid-item,\.qxframe9a7c2-card-grid>\*\{[^}]*min-width:var\(--qxframe9a7c2-card-grid-min,var\(--qxframe9a7c2-theme-card-grid-min-width\)\);[^}]*flex-basis:calc\(100% \/ var\(--qxframe9a7c2-card-grid-columns,999\)\)/);
assert.match(css,/\.qxframe9a7c2-card\.is-horizontal\{display:flex;align-items:stretch\}/);
assert.match(css,/\.qxframe9a7c2-descriptions-grid\{display:flex;flex-wrap:wrap;/);
assert.match(css,/\.qxframe9a7c2-descriptions-item\{[^}]*flex:0 0 var\(--_qxframe9a7c2-descriptions-item-basis\)/);
assert.match(css,/\.qxframe9a7c2-descriptions\.is-bordered\.is-vertical \.qxframe9a7c2-descriptions-item\{flex-direction:column\}/);
assert.match(css,/\.qxframe9a7c2-form\.is-layout-horizontal \.qxframe9a7c2-form-field\{[^}]*display:flex;flex-flow:row wrap;/);
assert.match(css,/\.qxframe9a7c2-form-check\{[^}]*display:flex;flex-wrap:wrap;/);
assert.match(css,/\.qxframe9a7c2-carousel\.is-fade \.qxframe9a7c2-carousel-track\{position:relative;display:flex;flex-direction:row;/);
assert.match(css,/\.qxframe9a7c2-carousel\.is-fade \.qxframe9a7c2-carousel-slide:not\(:first-child\)\{margin-inline-start:-100%\}/);
console.log(JSON.stringify({ok:true,actualGridRuleCount:0,actualGridDeclarationCount:0,families:['Card','Descriptions','Form','Carousel']}));