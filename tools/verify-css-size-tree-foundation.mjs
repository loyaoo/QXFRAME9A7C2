import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const exists=rel=>fs.existsSync(path.join(root,rel));
const source=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');

// The v1.5 canonical system no longer has a public 46-node Size Tree or
// Preset -> Theme geometry bridge. Geometry is authored as a small set of md
// inputs and expanded by framework-owned fixed rules for xs/sm/md/lg/xl.
for(const retired of [
  'src/styles/preset/_foundation.scss',
  'src/styles/theme/_default.scss',
  'src/styles/theme/_family.scss',
  'tools/manifests/css-size-tree-foundation.json'
]) assert.equal(exists(retired),false,'Retired Size Tree artifact must stay deleted: '+retired);

const contract=await verifyGeometryRuleSource(root,{sourceText:source});
assert.equal(contract.schema,3);
assert.equal(contract.evenLengths,true);
assert.equal(contract.legacyFiveSizeOverrides,false);
assert.equal(contract.styleSelectors,false);

// Guard against silently recreating the retired public preset tree under its
// old names. Private implementation constants are allowed while component
// geometry continues to converge on shared roles.
assert.doesNotMatch(source,/--qxframe9a7c2-size-\d+\s*:/,'Public Size Tree nodes must not return.');
assert.doesNotMatch(source,/--qxframe9a7c2-space-\d+\s*:/,'Public spacing preset bridge must not return.');
assert.doesNotMatch(source,/--qxframe9a7c2-font-size-\d+\s*:/,'Public numeric font preset bridge must not return.');

console.log(JSON.stringify({
  ok:true,
  legacySizeTreeRetired:true,
  geometryAuthority:'theme-v2-md-fixed-rules',
  geometryInputs:contract.inputNames,
  evenReferenceLengths:true,
  fiveSizeOutputsDerived:true
}));
