import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { QXFRAME9A7C2 } from '../src/index.js';
import { loadRollupProvider } from './rollup-provider.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const removed=['src/modules','src/compat','src/qxframe9a7c2.js','src/cutover-entry.js','src/legacy-entry.mjs'];
for(const relative of removed) assert.ok(!fs.existsSync(path.join(root,relative)),`${relative} must be removed from runtime src.`);
const authorities=['esm-component-authority.json','esm-support-authority.json','esm-building-block-authority.json'];
const covered=[];
for(const file of authorities){
  const data=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests',file),'utf8'));
  for(const entry of data.authorities||[]) covered.push(entry.module);
}
const manifestOnly=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/esm-manifest-only-modules.json'),'utf8')).modules||[];
for(const entry of manifestOnly) covered.push(entry.module);
assert.equal(new Set(covered).size,72,'Every frozen module must have exactly one ESM authority or manifest-only owner.');
assert.equal(QXFRAME9A7C2.ModuleManifest.list().length,72,'Static ModuleManifest must preserve all 72 public module records.');
for(const key of ['CoreRegistry','HeadlessRegistry','DOMHeadlessRegistry','ComponentRegistry','BuildingBlockRegistry','defineModule','load','use']) assert.ok(!(key in QXFRAME9A7C2),`Legacy runtime key still exists: ${key}`);
const rollupInstalled=fs.existsSync(path.join(root,'node_modules/rollup/package.json'));
const rollupWasmInstalled=fs.existsSync(path.join(root,'node_modules/@rollup/wasm-node/package.json'));
const providerProbe=await loadRollupProvider({root,optional:true});
const releaseBundlerInstalled=providerProbe.available;
const productionArtifactsReady=['dist/qxframe9a7c2.esm.js','dist/qxframe9a7c2.js.map','dist/esm/index.js'].every(relative=>fs.existsSync(path.join(root,relative)));
console.log(JSON.stringify({ok:true,moduleCoverage:'72/72',reachableLegacyModuleImplementations:0,compatRuntimeFiles:0,registryRemovalAuthorityReady:true,sourceRegistryRemovalComplete:true,rollupInstalled,rollupWasmInstalled,releaseBundlerInstalled,rollupProvider:providerProbe.provider,rollupProviderInjected:providerProbe.injected,productionArtifactsReady,productionCutoverReady:releaseBundlerInstalled&&productionArtifactsReady},null,2));
