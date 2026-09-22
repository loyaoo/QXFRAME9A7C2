import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/manifests/frozen-production-hashes.json'), 'utf8'));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const checked = [];
for (const [relative, expected] of Object.entries(manifest.files)) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) throw new Error(`Frozen production artifact is missing: ${relative}`);
    const actual = sha256(absolute);
    if (actual !== expected) throw new Error(`Frozen production artifact drifted: ${relative}\nexpected ${expected}\nactual   ${actual}`);
    checked.push({ file: relative, sha256: actual });
}
console.log(JSON.stringify({ ok: true, mode: 'archival-frozen-production-check', checked }, null, 2));
