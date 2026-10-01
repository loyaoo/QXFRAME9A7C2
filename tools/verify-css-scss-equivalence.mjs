import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as sass from 'sass';
import { fileURLToPath } from 'node:url';
import { compileStyles } from './compile-styles.mjs';
import { getCanonicalStyleModulePaths, readCanonicalStyleSource, readPhaseABaseline } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline=readPhaseABaseline({root});
const modulePaths=getCanonicalStyleModulePaths({root});
const reconstructed=readCanonicalStyleSource({root});

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
