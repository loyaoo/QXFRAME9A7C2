import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});

assert.match(css,/\.qxframe9a7c2-color-picker-gradient\{display:flex;flex-wrap:wrap;/,'ColorPicker gradient host must use wrapped Flex.');
assert.match(css,/\.qxframe9a7c2-color-picker-gradient-hint\{width:100%;flex:1 0 100%;/,'Gradient hint must keep a full row.');
assert.match(css,/\.qxframe9a7c2-color-picker-gradient-track\{[^}]*width:100%;flex:1 0 100%;/,'Gradient track must keep a full row.');
assert.match(css,/\.qxframe9a7c2-color-picker-gradient-angle\{[^}]*width:(?:var\(--[^)]+\)|calc\([^;{}]+\)|-?\d*\.?\d+rem);[^}]*flex:0 0 auto;margin-inline-end:auto;/,'Gradient angle must preserve token-owned fixed width while retaining Grid-equivalent remaining space.');
assert.doesNotMatch(css,/\.qxframe9a7c2-color-picker-gradient\{[^}]*display:grid/);
assert.doesNotMatch(css,/\.qxframe9a7c2-color-picker-gradient-(?:hint|track)\{[^}]*grid-column/);

assert.match(css,/\.qxframe9a7c2-upload-list\{display:flex;flex-direction:column;/,'Upload list must be a vertical Flex list.');
assert.match(css,/\.qxframe9a7c2-upload\.is-picture-card \.qxframe9a7c2-upload-list,\.qxframe9a7c2-upload\.is-picture-circle \.qxframe9a7c2-upload-list\{flex-direction:row;flex-wrap:wrap\}/,'Picture upload lists must wrap horizontally.');
assert.match(css,/\.qxframe9a7c2-upload\.is-picture-card \.qxframe9a7c2-upload-item,\.qxframe9a7c2-upload\.is-picture-circle \.qxframe9a7c2-upload-item\{[^}]*flex:1 1 (?:var\(--[^)]+\)|calc\([^;{}]+\)|-?\d*\.?\d+rem);/,'Picture upload item growth basis must remain token-owned.');
assert.doesNotMatch(css,/\.qxframe9a7c2-upload-list\{[^}]*display:grid/);
assert.doesNotMatch(css,/\.qxframe9a7c2-upload\.is-picture-(?:card|circle)[^{]*\{[^}]*grid-template-columns/);

console.log(JSON.stringify({ok:true,colorPickerGridRulesRemoved:3,uploadGridRulesRemoved:2,retiredThemeSizeDependency:false}));
