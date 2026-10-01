import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as sass from 'sass';
import { fileURLToPath } from 'node:url';
import { compileStyles } from './compile-styles.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline=fs.readFileSync(path.join(root,'src/qxframe9a7c2.css'),'utf8');
const modulePaths=[
  "src/styles/base/_reset.scss",
  "src/styles/preset/_foundation.scss",
  "src/styles/theme/_default.scss",
  "src/styles/theme/_family.scss",
  "src/styles/components/_components.scss"
];
const sourceModules=modulePaths.map(rel=>fs.readFileSync(path.join(root,rel),'utf8'));
const reconstructed=sourceModules.join('');

assert.equal(
  reconstructed,
  baseline,
  'Phase A SCSS modules must reconstruct the frozen CSS baseline byte-for-byte before token refactoring begins.'
);

const direct=sass.compileString(baseline,{
  syntax:'scss',
  style:'expanded',
  charset:false,
  sourceMap:false,
  url:new URL('file://' + path.join(root,'src/styles/_baseline.scss').replaceAll('\\','/'))
}).css;
const canonical=compileStyles({root}).css;
const directNormalized=direct.endsWith('\n')?direct:direct+'\n';

assert.equal(canonical,directNormalized,'Canonical SCSS modules must compile to exactly the same Sass output as the frozen Phase A baseline.');
assert.doesNotMatch(canonical,/@use\b|@forward\b/,'SCSS module directives must not leak into release CSS.');

for(const protectedPattern of [
  /@font-face\b/,
  /\.qxframe9a7c2-row\b/,
  /\[data-qxframe9a7c2-theme=(?:"?light"?)\]/,
  /\[data-qxframe9a7c2-theme=(?:"?dark"?)\]/,
  /\.is-keyboard-focus\b/
]) {
  assert.match(canonical,protectedPattern,'Compiled CSS lost a protected Phase A contract.');
}

console.log(JSON.stringify({
  ok:true,
  phase:'A',
  baselineBytes:Buffer.byteLength(baseline),
  compiledBytes:Buffer.byteLength(canonical),
  moduleCount:modulePaths.length,
  byteIdenticalModuleConcat:true,
  sassOutputEquivalent:true
}));
