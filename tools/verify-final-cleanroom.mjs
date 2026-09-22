import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const removed = ['modules','compat','manifests','qxframe9a7c2.js','cutover-entry.js','legacy-entry.mjs'];
for (const name of removed) assert.ok(!fs.existsSync(path.join(src, name)), `Legacy runtime source must stay removed: src/${name}`);

const patterns = [
    ['defineModule', /\bdefineModule\b/],
    ['CoreRegistry', /\bCoreRegistry\b/],
    ['HeadlessRegistry', /\bHeadlessRegistry\b/],
    ['DOMHeadlessRegistry', /\bDOMHeadlessRegistry\b/],
    ['ComponentRegistry', /\bComponentRegistry\b/],
    ['BuildingBlockRegistry', /\bBuildingBlockRegistry\b/],
    ['TEMP-ESM-BRIDGE', /TEMP-ESM-BRIDGE/]
];
const violations = [];
let files = 0;
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) {
            files += 1;
            const text = fs.readFileSync(full, 'utf8');
            const stripped = text.replace(/^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*/, '');
            if (/^(?:!|\()?function\s*\((?:global|window|root|self)\b/.test(stripped) && /\}\)\s*\((?:globalThis|window|self|this)\)\s*;?\s*$/.test(stripped)) violations.push(`${path.relative(root, full)}: IIFE module wrapper`);
            for (const [label, pattern] of patterns) if (pattern.test(text)) violations.push(`${path.relative(root, full)}: ${label}`);
            if (path.basename(full) !== 'initializer.js' && path.basename(full) !== 'index.umd.js' && /globalThis\.QXFRAME9A7C2|window\.QXFRAME9A7C2/.test(text)) violations.push(`${path.relative(root, full)}: global namespace write/read outside initializer boundary`);
        }
    }
}
walk(src);
assert.equal(violations.length, 0, `Final cleanroom violations:\n${violations.join('\n')}`);
console.log(JSON.stringify({ ok: true, scannedFiles: files, legacyRuntimeMarkers: 0, removedLegacyPaths: removed.length }));
