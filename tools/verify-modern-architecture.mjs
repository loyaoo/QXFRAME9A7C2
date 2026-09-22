import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const forbiddenPaths = ['src/modules','src/compat','src/qxframe9a7c2.js','src/cutover-entry.js','src/legacy-entry.mjs'];
for (const relative of forbiddenPaths) assert.ok(!fs.existsSync(path.join(root, relative)), `${relative} must be absent from modern src.`);

function walk(dir) {
    const out=[];
    for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
        const absolute=path.join(dir,entry.name);
        if(entry.isDirectory()) out.push(...walk(absolute));
        else if(entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) out.push(absolute);
    }
    return out;
}
const files=walk(src);
const patterns=[
    /\bqx\.defineModule\s*\(/, /\bdefineModule\s*\(/,
    /\b(?:CoreRegistry|HeadlessRegistry|DOMHeadlessRegistry|ComponentRegistry|BuildingBlockRegistry)\b/,
    /(?:globalThis|window|self)\.QXFRAME9A7C2/, /TEMP-ESM-BRIDGE/
];
const violations=[];
for(const file of files){
    const source=fs.readFileSync(file,'utf8');
    for(const pattern of patterns) if(pattern.test(source)) violations.push({file:path.relative(root,file).replaceAll(path.sep,'/'),pattern:String(pattern)});
}
assert.deepEqual(violations,[],'Modern src must not contain legacy loader/registry/global namespace dependencies.');

const beforeQX=globalThis.QXFRAME9A7C2;
const beforeDOM=globalThis.FloatingUIDOM;
const beforeCore=globalThis.FloatingUICore;
try { delete globalThis.QXFRAME9A7C2; delete globalThis.FloatingUIDOM; delete globalThis.FloatingUICore; } catch {}
const mod=await import('../src/index.js?verify-modern='+Date.now());
const qx=mod.QXFRAME9A7C2;
assert.ok(qx && qx.Core && qx.Headless && qx.DOMHeadless && qx.BuildingBlocks && qx.Components && qx.ModuleManifest && qx.ComponentRuntime && qx.ComponentInitializer,'Static runtime namespace is incomplete.');
for(const key of ['CoreRegistry','HeadlessRegistry','DOMHeadlessRegistry','ComponentRegistry','BuildingBlockRegistry','defineModule','load','use','ready']) assert.ok(!(key in qx),`Legacy runtime key must be removed: ${key}`);
assert.equal(Object.keys(qx.Components).length,40,'Expected 40 public component authorities.');
assert.equal(qx.ModuleManifest.list().length,72,'Expected 72 static module manifest records.');
assert.equal(globalThis.QXFRAME9A7C2,undefined,'Importing src/index.js must not write globalThis.QXFRAME9A7C2.');
assert.equal(globalThis.FloatingUIDOM,undefined,'Floating UI vendor authority must not leak FloatingUIDOM globally.');
assert.equal(globalThis.FloatingUICore,undefined,'Floating UI vendor authority must not leak FloatingUICore globally.');
assert.ok(qx.DOMHeadless.PositionAdapter,'PositionAdapter must be exposed by canonical DOMHeadless namespace.');
if(beforeQX!==undefined) globalThis.QXFRAME9A7C2=beforeQX;
if(beforeDOM!==undefined) globalThis.FloatingUIDOM=beforeDOM;
if(beforeCore!==undefined) globalThis.FloatingUICore=beforeCore;
console.log(JSON.stringify({ok:true,sourceFiles:files.length,legacyViolations:violations.length,components:Object.keys(qx.Components).length,moduleManifest:qx.ModuleManifest.list().length,staticRuntime:true,globalSideEffectFree:true}));
