import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});
const dragLines=css.split(/\r?\n/).filter(line=>line.includes('sort-item.is-drag')||line.includes('upload-item.is-drag'));
assert.ok(dragLines.length>0,'Sort/Upload drag indicator rules must exist.');
assert.equal(dragLines.some(line=>/(?:^|[^0-9])3px\b|:-3px\b/.test(line)),false,'Retired 3/-3px drag indicator literals must not return.');
assert.match(css,/height:var\(--_qxframe9a7c2-sort-drop-indicator-size\)/,'Sort indicator height must keep one geometry owner.');
assert.match(css,/width:var\(--_qxframe9a7c2-sort-drop-indicator-size\)/,'Sort indicator width must keep one geometry owner.');
assert.match(css,/calc\(var\(--_qxframe9a7c2-sort-drop-indicator-size\) \* -1\)/,'Sort indicator offset must derive from its size owner.');
assert.match(css,/height:var\(--_qxframe9a7c2-upload-drop-indicator-size\)/,'Upload indicator height must keep one geometry owner.');
assert.match(css,/calc\(var\(--_qxframe9a7c2-upload-drop-indicator-size\) \* -1\)/,'Upload indicator offset must derive from its size owner.');

console.log(JSON.stringify({ok:true,retiredThreePx:false,sortOwner:'--_qxframe9a7c2-sort-drop-indicator-size',uploadOwner:'--_qxframe9a7c2-upload-drop-indicator-size'}));
