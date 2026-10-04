import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';
import './verify-theme-single-system.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
verifyGeometryRuleSource(root);
console.log(JSON.stringify({ok:true,legacySizeTreeRetired:true,geometryAuthority:'theme-v2-md-fixed-rules'}));
