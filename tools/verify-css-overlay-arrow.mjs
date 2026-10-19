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
const popoverArrowSizing=[...css.matchAll(/\.qxframe9a7c2-popover-arrow\{([^{}]*)\}/g)]
  .map(([,body])=>body)
  .filter(body=>/(?:^|;)width:var\(--_qxframe9a7c2-popover-arrow-size\)(?:;|$)/.test(body));
assert.equal(popoverArrowSizing.length,1,'Popover arrow dimensions must have exactly one size owner.');
assert.match(popoverArrowSizing[0],/(?:^|;)height:var\(--_qxframe9a7c2-popover-arrow-size\)(?:;|$)/,'Popover arrow width and height must share one token.');
assert.match(popoverArrowSizing[0],/(?:^|;)transform:rotate\(45deg\)(?:;|$)/,'Popover arrow must retain its diagonal geometry.');
assert.match(css,/\.qxframe9a7c2-tooltip-arrow\{width:var\(--_qxframe9a7c2-popover-arrow-size\);height:var\(--_qxframe9a7c2-popover-arrow-size\)/,'Tooltip and Popconfirm share the identical arrow size owner.');
assert.doesNotMatch(css,/\.qxframe9a7c2-tooltip-root\[data-placement[^\n]*clip-path:/,'Tooltip cannot clip its arrow or diverge from Popconfirm.');
assert.match(css,/\.qxframe9a7c2-dropdown-arrow\{position:absolute;width:var\(--_qxframe9a7c2-dropdown-arrow-size\);height:var\(--_qxframe9a7c2-dropdown-arrow-size\)/,'Dropdown arrow dimensions must share one owner.');
const placementLines=css.split(/\r?\n/).filter(line=>line.includes('dropdown-panel[data-placement')&&line.includes('dropdown-arrow'));
assert.equal(placementLines.length,4,'Dropdown must retain four arrow placement rules.');
// v3 stage 2b inlined the root depth constant; all four placements must share one negated depth.
const depths=placementLines.map(line=>line.match(/(?:top|bottom|left|right):calc\(((?:var\(--[^)]+\))|-?\d*\.?\d+rem) \* -1\)/)?.[1]);
assert.ok(depths.every(Boolean),'Dropdown placement depth must be a negated shared depth.');
assert.equal(new Set(depths).size,1,'Dropdown placement rules must share one depth owner.');

console.log(JSON.stringify({ok:true,retiredTenPx:false,popoverOwner:'--_qxframe9a7c2-popover-arrow-size',dropdownOwner:'--_qxframe9a7c2-dropdown-arrow-size',placementRules:4}));
