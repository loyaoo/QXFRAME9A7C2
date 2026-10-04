import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});
const line=css.split(/\r?\n/).find(x=>x.includes('.qxframe9a7c2-overflow-close{'));
assert.ok(line,'Overflow close rule missing.');
assert.doesNotMatch(line,/1\.0625rem|17px/,'Retired 17px close geometry must not return.');
assert.match(line,/border-radius:50%/,'Overflow close remains an intrinsic circle.');

const width=line.match(/width:var\((--[^)]+)\)/)?.[1];
const height=line.match(/height:var\((--[^)]+)\)/)?.[1];
const basis=line.match(/flex:0 0 var\((--[^)]+)\)/)?.[1];
assert.ok(width&&height&&basis,'Overflow close width/height/flex-basis must use one geometry owner.');
assert.equal(height,width,'Overflow close height must share width owner.');
assert.equal(basis,width,'Overflow close flex-basis must share width owner.');

console.log(JSON.stringify({ok:true,geometryOwner:width,retired17px:false,intrinsicCircle:true}));
