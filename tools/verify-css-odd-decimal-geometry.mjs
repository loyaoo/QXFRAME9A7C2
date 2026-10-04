import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/styles/theme/_visual-v2.scss'),'utf8');
const contract=verifyGeometryRuleSource(root,{sourceText:source});

assert.equal(contract.evenLengths,true);
assert.equal(contract.legacyFiveSizeOverrides,false);
assert.equal(contract.canonicalScopes,true);

// 1px is the only odd visible length exception. The canonical contract above
// rejects every other odd reference length in Theme v2. Keep focus geometry
// explicit as a regression guard because pointer/keyboard origin separation
// depends on the 2px visual ring contract.
assert.match(source,/--_qxframe9a7c2-focus-visible-width:\s*\.125rem\s*;/,'Keyboard focus ring must remain 2px.');
assert.match(source,/--_qxframe9a7c2-focus-visible-offset:\s*-\.0625rem\s*;/,'Keyboard focus offset must remain -1px.');
assert.doesNotMatch(source,/--qxframe9a7c2-focus-ring\s*:/,'Retired public focus-ring alias must not return.');

// No legacy Preset/Theme geometry source may be needed by this check again.
for(const retired of ['src/styles/preset/_foundation.scss','src/styles/theme/_default.scss','src/styles/theme/_family.scss']){
  assert.equal(fs.existsSync(path.join(root,retired)),false,'Retired geometry source must stay deleted: '+retired);
}

console.log(JSON.stringify({ok:true,geometryAuthority:'theme-v2-md-fixed-rules',evenReferenceLengths:true,hairlineExceptionPx:1,focusRingPx:2,focusOffsetPx:-1}));
