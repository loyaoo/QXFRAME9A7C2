import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';
import {readCanonicalStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
const fixed=fs.readFileSync(path.join(root,'src/styles/main/fixed-values.css'),'utf8');
const foundation=fs.readFileSync(path.join(root,'src/styles/main/foundation.css'),'utf8');
const css=readCanonicalStyleSource({root});
const contract=await verifyGeometryRuleSource(root,{sourceText:theme});

assert.equal(contract.evenLengths,true);
assert.equal(contract.legacyFiveSizeOverrides,false);
assert.equal(contract.styleSelectors,false);

// 1px is the only odd visible length exception. Focus geometry is a private
// framework contract rather than a Theme input: keyboard focus is 2px with a
// -1px offset, while pointer styling continues to use border/background/shadow.
assert.match(foundation,/--_qxframe9a7c2-size-1:\s*0?\.125rem\s*;/,'Private size-1 must remain the 2px reference.');
assert.match(fixed,/--_qxframe9a7c2-focus-visible-width:\s*var\(--qxframe9a7c2-focus-visible-width,\s*var\(--_qxframe9a7c2-size-1\)\)\s*;/,'Keyboard focus width must resolve from the 2px private reference.');
assert.match(fixed,/--_qxframe9a7c2-focus-visible-offset:\s*var\(--qxframe9a7c2-focus-visible-offset,\s*-1px\)\s*;/,'Keyboard focus offset must remain -1px.');
assert.match(css,/--_qxframe9a7c2-focus-visible-outline:\s*var\(--_qxframe9a7c2-focus-visible-width\) solid var\(--_qxframe9a7c2-semantic-focus-visible\)/,'Canonical focus outline must consume the shared private focus geometry.');
assert.doesNotMatch(theme,/--qxframe9a7c2-focus-ring\s*:/,'Retired public focus-ring alias must not return in Theme.');

for(const retired of ['src/styles/preset/_foundation.scss','src/styles/theme/_default.scss','src/styles/theme/_family.scss']){
  assert.equal(fs.existsSync(path.join(root,retired)),false,'Retired geometry source must stay deleted: '+retired);
}

console.log(JSON.stringify({ok:true,geometryAuthority:'theme-v2-md-fixed-rules',focusAuthority:'private-framework-contract',evenReferenceLengths:true,hairlineExceptionPx:1,focusRingPx:2,focusOffsetPx:-1}));
