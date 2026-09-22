import fs from 'node:fs';
import path from 'node:path';

export function recoveryBackupPath(root) {
    return path.join(root, '.release-dist-backup');
}

export function assertNoPendingReleaseRecovery(root) {
    const backup = recoveryBackupPath(root);
    if (fs.existsSync(backup)) {
        throw new Error(`[release-transaction] Recovery backup already exists at ${backup}. Refusing to start a new release until it is inspected/restored manually.`);
    }
    return true;
}

export function createReleaseStage(root) {
    assertNoPendingReleaseRecovery(root);
    const stageRoot = path.join(root, '.release-stage');
    fs.rmSync(stageRoot, { recursive: true, force: true });
    fs.mkdirSync(stageRoot, { recursive: true });
    return { stageRoot, stageDist: path.join(stageRoot, 'dist') };
}

export function stageOutput(output, stageRoot) {
    const staged = { ...output };
    if (output.file) staged.file = path.join(stageRoot, output.file);
    if (output.dir) staged.dir = path.join(stageRoot, output.dir);
    return staged;
}

export function replaceDistAtomically({ root, stageDist }) {
    const dist = path.join(root, 'dist');
    const backup = recoveryBackupPath(root);
    assertNoPendingReleaseRecovery(root);

    let backedUp = false;
    try {
        if (fs.existsSync(dist)) {
            fs.renameSync(dist, backup);
            backedUp = true;
        }
        fs.renameSync(stageDist, dist);
        if (backedUp) fs.rmSync(backup, { recursive: true, force: true });
        return { replaced: true, restored: false, recoveryBackup: false };
    } catch (error) {
        try {
            if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
            if (backedUp && fs.existsSync(backup)) fs.renameSync(backup, dist);
        } catch (rollbackError) {
            error.rollbackError = rollbackError;
            error.recoveryBackup = fs.existsSync(backup) ? backup : null;
        }
        throw error;
    }
}

export function cleanupReleaseStage(root) {
    // Only staging is disposable. A recovery backup may be the sole surviving
    // copy after a failed commit + failed rollback and must never be auto-deleted.
    fs.rmSync(path.join(root, '.release-stage'), { recursive: true, force: true });
}
