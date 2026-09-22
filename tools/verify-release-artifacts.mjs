import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { QXFRAME9A7C2 as SourceRuntime } from '../src/index.js';

const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function verifySourceMap(file) {
    const map = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(map.version, 3, `Invalid source map version: ${file}`);
    assert.ok(Array.isArray(map.sources), `Source map sources must be an array: ${file}`);
    assert.equal(typeof map.mappings, 'string', `Source map mappings must be a string: ${file}`);
    if (map.sources.length === 0) assert.match(map.mappings, /^;*$/, `Source map without sources may contain only unmapped lines: ${file}`);
    for (const source of map.sources) {
        assert.ok(!path.isAbsolute(source), `Source map contains absolute path: ${source}`);
        assert.ok(!/(?:^|\/)src\/(?:modules|compat)(?:\/|$)/.test(source), `Source map references legacy runtime source: ${source}`);
    }
}

export async function verifyReleaseArtifacts({ root = ownRoot, distDir = path.join(root, 'dist') } = {}) {
    const required = [
        'qxframe9a7c2.js',
        'qxframe9a7c2.js.map',
        'qxframe9a7c2.esm.js',
        'qxframe9a7c2.esm.js.map',
        'esm/index.js',
        'esm/index.js.map',
        'esm/components/index.js',
        'esm/components/index.js.map',
        'esm/components/index.d.ts',
        'esm/components/date-picker.d.ts',
        'esm/core/index.js',
        'esm/core/index.js.map',
        'esm/core/index.d.ts',
        'esm/core/component.d.ts',
        'esm/utils/index.js',
        'esm/utils/index.js.map',
        'esm/utils/index.d.ts',
        'esm/utils/treeQuery.d.ts',
        'qxframe9a7c2.css',
        'qxframe9a7c2.d.ts',
        'qxframe9a7c2-api.json',
        'qxframe9a7c2-module-manifest.json',
        'qxframe9a7c2-migration.json'
    ];
    const missingArtifacts = required.filter(relative => !fs.existsSync(path.join(distDir, relative)));
    assert.deepEqual(missingArtifacts, [], `Missing release artifacts: ${missingArtifacts.join(', ')}`);

    function walkPublicSource(dir) {
        const out = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const absolute = path.join(dir, entry.name);
            if (entry.isDirectory()) out.push(...walkPublicSource(absolute));
            else if (entry.isFile() && entry.name.endsWith('.js')) out.push(absolute);
        }
        return out;
    }
    const publicSourceFiles = ['components', 'core', 'utils']
        .flatMap(name => walkPublicSource(path.join(root, 'src', name)));
    const publicReleaseTriples = publicSourceFiles.flatMap(sourceFile => {
        const relative = path.relative(path.join(root, 'src'), sourceFile).replaceAll(path.sep, '/');
        const js = `esm/${relative}`;
        return [js, `${js}.map`, js.replace(/\.js$/, '.d.ts')];
    });
    const missingPublicArtifacts = publicReleaseTriples.filter(relative => !fs.existsSync(path.join(distDir, relative)));
    assert.deepEqual(missingPublicArtifacts, [], `Public preserveModules release coverage is incomplete: ${missingPublicArtifacts.join(', ')}`);

    const mapFiles = [];
    const preserveJsFiles = [];
    function walkPreserved(dir) {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const absolute = path.join(dir, entry.name);
            if (entry.isDirectory()) walkPreserved(absolute);
            else if (entry.isFile() && entry.name.endsWith('.map')) mapFiles.push(absolute);
            else if (entry.isFile() && entry.name.endsWith('.js')) preserveJsFiles.push(absolute);
        }
    }
    walkPreserved(path.join(distDir, 'esm'));
    const missingPreserveMaps = preserveJsFiles.filter(file => !fs.existsSync(`${file}.map`));
    assert.deepEqual(missingPreserveMaps, [], `preserveModules JS is missing source maps: ${missingPreserveMaps.map(file => path.relative(distDir, file)).join(', ')}`);
    const orphanPreserveMaps = mapFiles.filter(file => !fs.existsSync(file.slice(0, -4)));
    assert.deepEqual(orphanPreserveMaps, [], `preserveModules contains orphan source maps: ${orphanPreserveMaps.map(file => path.relative(distDir, file)).join(', ')}`);
    for (const relative of required.filter(name => name.endsWith('.map'))) verifySourceMap(path.join(distDir, relative));
    for (const file of mapFiles) verifySourceMap(file);

    const sourceComponents = Object.keys(SourceRuntime.Components).sort();
    const sourceManifest = SourceRuntime.ModuleManifest.list();
    const sourceModules = sourceManifest.map(x => x.name).sort();
    const normalizeManifest = list => JSON.parse(JSON.stringify(list.map(record => ({ name: record.name, modules: (record.modules || []).slice(), capabilities: record.capabilities || {} }))));
    const forbidden = ['CoreRegistry','HeadlessRegistry','DOMHeadlessRegistry','ComponentRegistry','BuildingBlockRegistry','defineModule','load','use'];
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const esmUrl = pathToFileURL(path.join(distDir, 'qxframe9a7c2.esm.js')).href + `?verify=${nonce}`;
    const esm = await import(esmUrl);
    const esmRuntime = esm.QXFRAME9A7C2 || esm.default;
    assert.ok(esmRuntime, 'ESM bundle must export QXFRAME9A7C2/default runtime.');
    assert.deepEqual(Object.keys(esmRuntime.Components).sort(), sourceComponents, 'ESM bundle component inventory drifted.');
    assert.deepEqual(normalizeManifest(esmRuntime.ModuleManifest.list()), normalizeManifest(sourceManifest), 'ESM bundle ModuleManifest metadata drifted.');
    for (const key of forbidden) assert.ok(!(key in esmRuntime), `ESM bundle exposes legacy key ${key}.`);

    const preserved = await import(pathToFileURL(path.join(distDir, 'esm/index.js')).href + `?verify=${nonce}`);
    const preservedRuntime = preserved.QXFRAME9A7C2 || preserved.default;
    assert.ok(preservedRuntime, 'preserveModules entry must export runtime.');
    assert.deepEqual(Object.keys(preservedRuntime.Components).sort(), sourceComponents, 'preserveModules component inventory drifted.');
    assert.deepEqual(normalizeManifest(preservedRuntime.ModuleManifest.list()), normalizeManifest(sourceManifest), 'preserveModules ModuleManifest metadata drifted.');

    const umdCode = fs.readFileSync(path.join(distDir, 'qxframe9a7c2.js'), 'utf8');
    const context = { console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, Promise, URL };
    context.globalThis = context; context.window = context; context.self = context;
    vm.createContext(context);
    vm.runInContext(umdCode, context, { filename: path.join(distDir, 'qxframe9a7c2.js') });
    const umdRuntime = context.QXFRAME9A7C2;
    assert.ok(umdRuntime, 'IIFE bundle must initialize globalThis.QXFRAME9A7C2 synchronously.');
    assert.equal(context.QXFRAME9A7C2Bundle, undefined, 'IIFE bundle must not leak an auxiliary QXFRAME9A7C2Bundle global.');
    assert.deepEqual(Array.from(Object.keys(umdRuntime.Components).sort()), sourceComponents, 'IIFE component inventory drifted.');
    assert.deepEqual(normalizeManifest(Array.from(umdRuntime.ModuleManifest.list())), normalizeManifest(sourceManifest), 'IIFE ModuleManifest metadata drifted.');
    for (const key of forbidden) assert.ok(!(key in umdRuntime), `IIFE bundle exposes legacy key ${key}.`);

    const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'qxframe9a7c2-module-manifest.json'), 'utf8'));
    assert.deepEqual(normalizeManifest(manifest.modules || []), normalizeManifest(sourceManifest), 'Generated release module manifest metadata drifted.');

    return { ok: true, iife: true, esmBundle: true, preserveModules: true, publicSubpaths: publicSourceFiles.length, publicSubpathArtifacts: publicReleaseTriples.length, sourceMaps: mapFiles.length + 2, preserveModuleJs: preserveJsFiles.length, sourceMapParity: true, components: sourceComponents.length, modules: sourceModules.length, legacyGlobalKeys: 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    console.log(JSON.stringify(await verifyReleaseArtifacts()));
}
