import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});
const line=css.split(/\r?\n/).find(x=>x.includes('.qxframe9a7c2-card-skeleton-line.is-title{'));
assert.ok(line,'Card skeleton title rule missing.');
assert.doesNotMatch(line,/\.9375rem|15px/,'Retired 15px skeleton title literal must not return.');
assert.match(line,/height:var\(--[^)]+\)/,'Skeleton title height must use a shared geometry owner.');
assert.match(line,/width:42%/,'Existing skeleton title width must remain unchanged.');

console.log(JSON.stringify({ok:true,retired15px:false,titleWidth:'42%',heightOwnedByVariable:true}));
