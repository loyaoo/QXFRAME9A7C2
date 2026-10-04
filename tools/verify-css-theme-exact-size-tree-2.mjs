import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';
import {GEOMETRY_RULE_VERSION,GEOMETRY_ROLES} from '../docs/assets/theme-generator/geometry-engine-v2.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=verifyGeometryRuleSource(root);
assert.equal(GEOMETRY_RULE_VERSION,'qx-md-2');
assert.equal(contract.inputNames,GEOMETRY_ROLES.length);
assert.equal(contract.legacyFiveSizeOverrides,false);

// Historical exact-literal and five-slot mappings were migration evidence for
// the retired Size Tree. v1.5 intentionally stores only md inputs and derives
// xs/sm/lg/xl with one fixed framework rule.
console.log(JSON.stringify({ok:true,geometryAuthority:GEOMETRY_RULE_VERSION,legacyExactSizeTreeRetired:true,mdInputs:GEOMETRY_ROLES.length,fiveSizeOverrides:false}));
