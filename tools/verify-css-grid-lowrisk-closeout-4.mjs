import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});

assert.match(css,/\.qxframe9a7c2-card-actions\{display:flex;/);
assert.match(css,/\.qxframe9a7c2-card-action\{display:flex;min-width:0;min-height:var\(--[^)]+\);flex:1 1 0;/);
assert.doesNotMatch(css,/\.qxframe9a7c2-card-actions\{[^}]*display:grid/);

assert.match(css,/\.qxframe9a7c2-form-selectgroup-image\{display:flex;[^}]*flex-direction:column/);
assert.doesNotMatch(css,/\.qxframe9a7c2-form-selectgroup-image\{[^}]*display:grid/);

assert.match(css,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-check-wrap\{[^}]*display:inline-flex;[^}]*align-items:center;[^}]*justify-content:center/);
assert.doesNotMatch(css,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-check-wrap\{[^}]*grid-template-/);
assert.doesNotMatch(css,/\.qxframe9a7c2-tree \.qxframe9a7c2-tree-check-indicator\{[^}]*(?:grid-column|grid-row)/);

assert.match(css,/\.qxframe9a7c2-upload-preview-panel\{[^}]*display:flex;[^}]*flex-direction:column/);
assert.doesNotMatch(css,/\.qxframe9a7c2-upload-preview-panel\{[^}]*display:grid/);

assert.match(css,/\.qxframe9a7c2-image\{[^}]*display:inline-flex;[^}]*align-items:stretch/);
assert.doesNotMatch(css,/\.qxframe9a7c2-image\{[^}]*display:inline-grid/);

console.log(JSON.stringify({ok:true,batch:'css-grid-lowrisk-closeout-4',convertedRules:6,retiredThemeSizeDependency:false}));
