import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});
const arrowLines=css.split(/\r?\n/).filter(line=>line.includes('popover-arrow')||line.includes('dropdown-arrow'));
assert.ok(arrowLines.length>0,'Popover/Dropdown arrow rules must exist.');
assert.equal(arrowLines.some(line=>/\b10px\b|:-5px\b/.test(line)),false,'Retired 10px/-5px overlay-arrow literals must not return.');
assert.match(css,/--_qxframe9a7c2-popover-arrow-half:calc\(var\(--_qxframe9a7c2-popover-arrow-size\) \* -\.5\)/,'Popover half-offset must derive from arrow size.');
assert.match(css,/--_qxframe9a7c2-dropdown-arrow-half:calc\(var\(--_qxframe9a7c2-dropdown-arrow-size\) \* -\.5\)/,'Dropdown half-offset must derive from arrow size.');
assert.match(css,/\.qxframe9a7c2-popover-arrow\{width:var\(--_qxframe9a7c2-popover-arrow-size\);height:var\(--_qxframe9a7c2-popover-arrow-size\)/,'Popover arrow dimensions must share one owner.');
assert.match(css,/\.qxframe9a7c2-dropdown-arrow\{position:absolute;width:var\(--_qxframe9a7c2-dropdown-arrow-size\);height:var\(--_qxframe9a7c2-dropdown-arrow-size\)/,'Dropdown arrow dimensions must share one owner.');
const placementLines=css.split(/\r?\n/).filter(line=>line.includes('dropdown-panel[data-placement')&&line.includes('dropdown-arrow'));
assert.equal(placementLines.length,4,'Dropdown must retain four arrow placement rules.');
for(const line of placementLines)assert.match(line,/(?:top|bottom|left|right):calc\(var\(--[^)]+\) \* -1\)/,'Dropdown placement depth must stay token-owned.');

console.log(JSON.stringify({ok:true,retiredTenPx:false,popoverOwner:'--_qxframe9a7c2-popover-arrow-size',dropdownOwner:'--_qxframe9a7c2-dropdown-arrow-size',placementRules:4}));
