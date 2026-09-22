import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateTypes } from './generate-types.mjs';
import { writeReleaseMetadata } from './generate-release-metadata.mjs';

const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function copyFile(source, target) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
}

export async function runPostbuild({ root = ownRoot, distDir = path.join(root, 'dist') } = {}) {
    fs.mkdirSync(distDir, { recursive: true });

    copyFile(path.join(root, 'src/qxframe9a7c2.css'), path.join(distDir, 'qxframe9a7c2.css'));
    const fontsDir = path.join(distDir, 'fonts');
    fs.rmSync(fontsDir, { recursive: true, force: true });
    for (const name of fs.readdirSync(path.join(root, 'src/fonts'))) copyFile(path.join(root, 'src/fonts', name), path.join(fontsDir, name));

    writeReleaseMetadata({ root, distDir });
    await generateTypes({ root, distDir });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runPostbuild();
