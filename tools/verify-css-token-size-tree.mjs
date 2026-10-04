import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';
import './verify-theme-single-system.mjs';

verifyGeometryRuleSource();
console.log(JSON.stringify({ok:true,legacySizeTreeRetired:true,geometryAuthority:'theme-v2-md-fixed-rules'}));
