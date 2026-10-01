import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
const css=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');
const plan=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-card-skeleton-title-size.json'),'utf8'));

assert.equal(Math.abs(plan.targetPx-plan.previousPx),1);
assert.match(theme,/--qxframe9a7c2-theme-card-skeleton-title-height:\s*var\(--qxframe9a7c2-size-8\)/);
assert.match(css,/--qxframe9a7c2-card-skeleton-title-height:\s*var\(--qxframe9a7c2-theme-card-skeleton-title-height\)/);
const line=css.split(/\r?\n/).find(x=>x.includes('.qxframe9a7c2-card-skeleton-line.is-title{'));
assert.ok(line,'Card skeleton title rule missing.');
assert.match(line,/height:var\(--qxframe9a7c2-card-skeleton-title-height\)/);
assert.doesNotMatch(line,/\.9375rem|15px/,'15px skeleton title literal must be retired.');
assert.match(line,/width:42%/,'Existing skeleton title width must remain unchanged.');
console.log(JSON.stringify({ok:true,previousPx:plan.previousPx,targetPx:plan.targetPx,deltaPx:plan.deltaPx}));
