import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { compileStyles, segmentName, SEGMENT_BEGIN, SEGMENT_END } from './compile-styles.mjs';
import { getCanonicalStyleModulePaths } from './style-source.mjs';

// dist/qxframe9a7c2.css must be the direct, marker-delimited concatenation of the ordered sources.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=getCanonicalStyleModulePaths({root});
const canonical=compileStyles({root}).css;

const markers=[...canonical.matchAll(/\/\* @qxframe9a7c2-(begin|end) ([a-z0-9/-]+) \*\//g)].map(m=>[m[1],m[2]]);
const expected=modules.flatMap(rel=>[['begin',segmentName(rel)],['end',segmentName(rel)]]);
assert.deepEqual(markers,expected,'Segment markers must match css-order.json one-to-one and in order.');

let cursor=0;
for(const rel of modules){
  const name=segmentName(rel);
  const begin=`${SEGMENT_BEGIN}${name} */\n`;
  assert.equal(canonical.slice(cursor,cursor+begin.length),begin,'Missing begin marker for '+name);
  cursor+=begin.length;
  let body=fs.readFileSync(path.join(root,rel),'utf8');
  if(!body.endsWith('\n')) body+='\n';
  assert.equal(canonical.slice(cursor,cursor+body.length),body,'Segment body must equal its source file verbatim: '+rel);
  cursor+=body.length;
  const end=`${SEGMENT_END}${name} */\n`;
  assert.equal(canonical.slice(cursor,cursor+end.length),end,'Missing end marker for '+name);
  cursor+=end.length;
}
assert.equal(cursor,canonical.length,'Release CSS contains bytes outside source segments.');
assert.doesNotMatch(canonical,/@(?:import|use|forward)\b/,'Module directives must not leak into release CSS.');

const dist=path.join(root,'dist','qxframe9a7c2.css');
if(fs.existsSync(dist)) assert.equal(fs.readFileSync(dist,'utf8'),canonical,'dist/qxframe9a7c2.css is stale; rebuild.');

for(const protectedPattern of [
  /@font-face\b/,
  /\.qxframe9a7c2-row\b/,
  /\[data-qxframe9a7c2-theme=(?:"?light"?)\]/,
  /\[data-qxframe9a7c2-theme=(?:"?dark"?)\]/,
  /\.is-keyboard-focus\b/
]) {
  assert.match(canonical,protectedPattern,'Release CSS lost a protected contract.');
}

console.log(JSON.stringify({ok:true,moduleCount:modules.length,compiledBytes:Buffer.byteLength(canonical),markersOneToOne:true,verbatimSegments:true,distChecked:fs.existsSync(dist)}));
