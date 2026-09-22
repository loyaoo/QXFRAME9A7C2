import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = ['src/index.js', 'src/index.umd.js'];
const staticImportRe = /(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicImportRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const anyDynamicImportRe = /\bimport\s*\(/g;
const nodeBuiltinRe = /(?:from\s*|import\s*\(\s*)['"]node:/;
const topLevelShimRe = /^(?:const|let|var|class|function)\s+(globalThis|window|self|module|exports|define)\b/m;
const migrationDependencyInjectorRe = /\b(?:configure|inject|set)[A-Za-z0-9_$]*Dependencies\b/;

function resolveImport(importer, specifier) {
    assert.ok(specifier.startsWith('.'), `Rollup source graph contains a non-relative dependency: ${specifier} from ${path.relative(root, importer)}`);
    let resolved = path.resolve(path.dirname(importer), specifier);
    if (!path.extname(resolved)) resolved += '.js';
    assert.ok(resolved.startsWith(path.join(root, 'src') + path.sep) || resolved === path.join(root, 'src'), `Import escapes src/: ${specifier}`);
    assert.ok(fs.existsSync(resolved), `Missing static import: ${path.relative(root, importer)} -> ${specifier}`);
    return resolved;
}

const graph = new Map();
function collect(file) {
    file = path.resolve(root, file);
    if (graph.has(file)) return;
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(!nodeBuiltinRe.test(source), `Browser release source imports a Node builtin: ${path.relative(root, file)}`);
    assert.ok(!/\bimport\.meta\b/.test(source), `Browser release source uses import.meta: ${path.relative(root, file)}`);
    assert.ok(!anyDynamicImportRe.test(source), `Browser release source uses dynamic import(): ${path.relative(root, file)}`);
    assert.ok(!migrationDependencyInjectorRe.test(source), `Browser release source still contains a migration-time dependency injector: ${path.relative(root, file)}`);
    const imports = [];
    staticImportRe.lastIndex = 0;
    for (let match; (match = staticImportRe.exec(source));) imports.push(match[1]);
    dynamicImportRe.lastIndex = 0;
    for (let match; (match = dynamicImportRe.exec(source));) imports.push(match[1]);
    graph.set(file, imports);
    for (const specifier of imports) collect(resolveImport(file, specifier));
}
for (const entry of entries) collect(entry);

const vendorRoot = path.join(root, 'src/vendor');
const vendorFiles = fs.existsSync(vendorRoot) ? fs.readdirSync(vendorRoot).filter(name => name.endsWith('.js')).map(name => path.join(vendorRoot, name)) : [];
for (const file of vendorFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const match = topLevelShimRe.exec(source);
    assert.ok(!match, `Vendor module must not declare top-level compatibility shim ${match && match[1]}: ${path.relative(root, file)}`);
}

let edges = 0;
for (const imports of graph.values()) edges += imports.length;
const esmEntry = path.join(root, 'src/index.js');
assert.ok(graph.has(esmEntry));
assert.ok(graph.has(path.join(root, 'src/index.umd.js')));

// Rollup preserveModules only emits modules reachable from its input. Every public
// package subpath must therefore be reachable from src/index.js even when it is
// also valid to import that source file directly during development.
const esmReachable = new Set();
const pending = [esmEntry];
while (pending.length) {
    const file = pending.pop();
    if (esmReachable.has(file)) continue;
    esmReachable.add(file);
    for (const specifier of graph.get(file) || []) pending.push(resolveImport(file, specifier));
}
function listPublicSubpaths(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...listPublicSubpaths(absolute));
        else if (entry.isFile() && entry.name.endsWith('.js')) out.push(absolute);
    }
    return out;
}
const publicSubpaths = ['components', 'core', 'utils']
    .flatMap(name => listPublicSubpaths(path.join(root, 'src', name)));
const unreachablePublicSubpaths = publicSubpaths.filter(file => !esmReachable.has(file));
assert.deepEqual(unreachablePublicSubpaths, [], `preserveModules package subpaths are not reachable from src/index.js: ${unreachablePublicSubpaths.map(file => path.relative(root, file)).join(', ')}`);

console.log(JSON.stringify({ ok: true, entries: entries.length, files: graph.size, staticEdges: edges, externalImports: 0, dynamicImports: 0, nodeBuiltins: 0, importMeta: 0, topLevelVendorShims: 0, migrationDependencyInjectors: 0, publicSubpaths: publicSubpaths.length, preserveModulesReachable: unreachablePublicSubpaths.length === 0 }));
