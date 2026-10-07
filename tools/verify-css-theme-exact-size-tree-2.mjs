import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource,GEOMETRY_TOKENS} from './theme-v2-geometry-contract.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=await verifyGeometryRuleSource(root);
assert.equal(contract.inputNames,GEOMETRY_TOKENS.length);
assert.equal(contract.legacyFiveSizeOverrides,false);
console.log(JSON.stringify({ok:true,geometryAuthority:contract.rules,legacyExactSizeTreeRetired:true,mdInputs:GEOMETRY_TOKENS.length,fiveSizeOverrides:false}));
