import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const backup = path.join(root, '.verify-clean-pack-dist-backup');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.equal(pkg.scripts && pkg.scripts.prepare, 'npm run build', 'Git/clean package installs must build dist through prepare.');
assert.ok(!fs.existsSync(backup), 'clean-pack verifier backup from a previous interrupted run must be removed first.');

const hadDist = fs.existsSync(dist);
if (hadDist) fs.renameSync(dist, backup);

function parsePackPayload(stdout) {
    const text = String(stdout || '').trim();
    const marker = text.lastIndexOf('\n[');
    const json = marker >= 0 ? text.slice(marker + 1) : text.slice(text.indexOf('['));
    return JSON.parse(json)[0];
}

try {
    const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
        cwd: root,
        encoding: 'utf8',
        shell: process.platform === 'win32'
    });
    assert.equal(result.status, 0, `clean npm pack failed:\n${result.stdout}\n${result.stderr}`);
    assert.ok(fs.existsSync(path.join(dist, 'esm/index.js')), 'prepare must recreate dist/esm/index.js from a checkout with no dist directory.');
    assert.ok(fs.existsSync(path.join(dist, 'qxframe9a7c2.js')), 'prepare must recreate the browser bundle from a checkout with no dist directory.');
    assert.ok(fs.existsSync(path.join(dist, 'qxframe9a7c2.css')), 'prepare must recreate release CSS from a checkout with no dist directory.');

    const payload = parsePackPayload(result.stdout);
    const files = new Set((payload.files || []).map(record => record.path));
    for (const required of ['dist/esm/index.js', 'dist/qxframe9a7c2.js', 'dist/qxframe9a7c2.esm.js', 'dist/qxframe9a7c2.css', 'dist/qxframe9a7c2.d.ts']) {
        assert.ok(files.has(required), `clean npm pack is missing ${required}`);
    }
    console.log(JSON.stringify({ ok:true, cleanPack:true, prepareBuild:true, package:`${payload.name}@${payload.version}`, files:files.size }));
} finally {
    fs.rmSync(dist, { recursive:true, force:true });
    if (hadDist && fs.existsSync(backup)) fs.renameSync(backup, dist);
    else fs.rmSync(backup, { recursive:true, force:true });
}
