import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
const family=fs.readFileSync(path.join(root,'src/styles/theme/_family.scss'),'utf8');
const plan=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-overflow-close-size.json'),'utf8'));

assert.equal(plan.previousPx-plan.targetPx,1);
assert.match(theme,/--qxframe9a7c2-theme-overflow-close-size:\s*var\(--qxframe9a7c2-size-8\)/);
const line=family.split(/\r?\n/).find(x=>x.includes('.qxframe9a7c2-overflow-close{'));
assert.ok(line,'Overflow close rule missing.');
assert.equal((line.match(/var\(--qxframe9a7c2-theme-overflow-close-size\)/g)||[]).length,3,'Width/height/flex-basis must share the same owner token.');
assert.doesNotMatch(line,/1\.0625rem|17px/,'17px geometry must be retired.');
assert.match(line,/border-radius:50%/,'Circle geometry must stay percentage-based.');
console.log(JSON.stringify({ok:true,previousPx:plan.previousPx,targetPx:plan.targetPx,deltaPx:plan.deltaPx}));
