import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertNoPendingReleaseRecovery, createReleaseStage, stageOutput, replaceDistAtomically, cleanupReleaseStage, recoveryBackupPath } from './release-transaction.mjs';

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-release-transaction-'));
try {
    const dist = path.join(sandbox, 'dist');
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, 'marker.txt'), 'old');

    let stage = createReleaseStage(sandbox);
    fs.mkdirSync(stage.stageDist, { recursive: true });
    fs.writeFileSync(path.join(stage.stageDist, 'marker.txt'), 'new');
    const mappedFile = stageOutput({ file: 'dist/a.js', format: 'es' }, stage.stageRoot);
    const mappedDir = stageOutput({ dir: 'dist/esm', format: 'es' }, stage.stageRoot);
    assert.equal(mappedFile.file, path.join(stage.stageRoot, 'dist/a.js'));
    assert.equal(mappedDir.dir, path.join(stage.stageRoot, 'dist/esm'));
    replaceDistAtomically({ root: sandbox, stageDist: stage.stageDist });
    assert.equal(fs.readFileSync(path.join(dist, 'marker.txt'), 'utf8'), 'new', 'Successful release transaction did not commit staged dist.');
    assert.ok(!fs.existsSync(recoveryBackupPath(sandbox)), 'Successful transaction leaked backup directory.');

    fs.rmSync(dist, { recursive: true, force: true });
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, 'marker.txt'), 'stable');
    stage = createReleaseStage(sandbox);
    const missingStage = path.join(stage.stageRoot, 'dist-missing');
    assert.throws(() => replaceDistAtomically({ root: sandbox, stageDist: missingStage }));
    assert.equal(fs.readFileSync(path.join(dist, 'marker.txt'), 'utf8'), 'stable', 'Failed release transaction did not restore previous dist.');
    assert.ok(!fs.existsSync(recoveryBackupPath(sandbox)), 'Successful rollback leaked backup directory.');

    // A leftover recovery backup is evidence of an incomplete previous release.
    // It must block a new release and cleanup must preserve it for manual recovery.
    const backup = recoveryBackupPath(sandbox);
    fs.mkdirSync(backup, { recursive: true });
    fs.writeFileSync(path.join(backup, 'marker.txt'), 'recovery-copy');
    assert.throws(() => assertNoPendingReleaseRecovery(sandbox), /Recovery backup already exists/);
    assert.throws(() => createReleaseStage(sandbox), /Recovery backup already exists/);
    assert.throws(() => replaceDistAtomically({ root: sandbox, stageDist: path.join(sandbox, 'anything') }), /Recovery backup already exists/);
    cleanupReleaseStage(sandbox);
    assert.equal(fs.readFileSync(path.join(backup, 'marker.txt'), 'utf8'), 'recovery-copy', 'Cleanup deleted the recovery backup.');

    console.log(JSON.stringify({ ok: true, stagedOutputs: true, atomicCommit: true, rollbackRestore: true, recoveryBackupPreserved: true, pendingRecoveryBlocksRelease: true }));
} finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
}
