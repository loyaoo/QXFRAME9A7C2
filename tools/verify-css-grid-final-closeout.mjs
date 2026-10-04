import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});

assert.doesNotMatch(css,/\bdisplay\s*:\s*(?:inline-)?grid\b|\bgrid-(?:template|column|row|area|auto-(?:columns|rows|flow))\s*:/i,'Component CSS must not retain CSS Grid declarations.');
assert.doesNotMatch(css,/(^|[^a-z0-9.-])-?\d*\.?\d+fr\b/i,'Component CSS must not retain fr units.');
assert.doesNotMatch(css,/--qxframe9a7c2-grid-gap-[xy]:\s*\d*\.?\d+rem\s*;/,'Grid gutter utilities must consume shared fixed gap owners, not raw rem literals.');
for(let i=1;i<=24;i++){
  const owner='--_qxframe9a7c2-fixed-grid-gap-'+i;
  assert.ok(css.includes('--qxframe9a7c2-grid-gap-x:var('+owner+')'),'Grid gx/g gutter '+i+' must consume '+owner+'.');
  assert.ok(css.includes('--qxframe9a7c2-grid-gap-y:var('+owner+')'),'Grid gy/g gutter '+i+' must consume '+owner+'.');
}
assert.match(css,/\.qxframe9a7c2-card-grid\{display:flex;flex-wrap:wrap\}/);
assert.match(css,/\.qxframe9a7c2-card-grid-item,\.qxframe9a7c2-card-grid>\*\{[^}]*min-width:var\(--[^)]+(?:,[^)]+)?\);[^}]*flex-basis:calc\(100% \/ var\(--qxframe9a7c2-card-grid-columns,999\)\)/,'Card grid items must preserve token-owned minimum width and percentage Flex basis.');
assert.match(css,/\.qxframe9a7c2-card\.is-horizontal\{display:flex;align-items:stretch\}/);
assert.match(css,/\.qxframe9a7c2-descriptions-grid\{display:flex;flex-wrap:wrap;/);
assert.match(css,/\.qxframe9a7c2-descriptions-item\{[^}]*flex:0 0 var\(--_qxframe9a7c2-descriptions-item-basis\)/);
assert.match(css,/\.qxframe9a7c2-descriptions\.is-bordered\.is-vertical \.qxframe9a7c2-descriptions-item\{flex-direction:column\}/);
assert.match(css,/\.qxframe9a7c2-form\.is-layout-horizontal \.qxframe9a7c2-form-field\{[^}]*display:flex;flex-flow:row wrap;/);
assert.match(css,/\.qxframe9a7c2-form-check\{[^}]*display:flex;flex-wrap:wrap;/);
assert.match(css,/\.qxframe9a7c2-carousel\.is-fade \.qxframe9a7c2-carousel-track\{position:relative;display:flex;flex-direction:row;/);
assert.match(css,/\.qxframe9a7c2-carousel\.is-fade \.qxframe9a7c2-carousel-slide:not\(:first-child\)\{margin-inline-start:-100%\}/);

console.log(JSON.stringify({ok:true,actualGridRuleCount:0,actualGridDeclarationCount:0,gapAuthority:'private-fixed-grid-gap-1..24',families:['Grid','Card','Descriptions','Form','Carousel']}));
