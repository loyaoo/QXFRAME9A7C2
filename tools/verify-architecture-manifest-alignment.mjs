import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { QXFRAME9A7C2, ComponentRuntime } from '../src/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ownership=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/state-ownership.json'),'utf8'));
const canonical=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/canonical-systems.json'),'utf8'));
const names=Object.keys(QXFRAME9A7C2.Components).sort();
assert.equal(ownership.version,2,'State ownership manifest must use the ComponentProfile-aligned schema.');
assert.equal(ownership.generatedFrom,'ComponentRuntime.profileFor(name).ownership');
assert.deepEqual(Object.keys(ownership.components).sort(),names,'State ownership manifest must exactly cover public components.');
for(const name of names){
  const runtime={...(ComponentRuntime.profileFor(name)?.ownership||{})};
  assert.deepEqual(ownership.components[name].ownership,runtime,name+' ownership manifest drifted from ComponentProfile.');
  const declared=[ownership.components[name].primary,...ownership.components[name].secondary].filter(Boolean).sort();
  assert.deepEqual(declared,[...new Set(Object.values(runtime))].sort(),name+' owner summary drifted from ComponentProfile.');
}
const systems=canonical.systems||canonical;
assert.equal(systems['Controlled State'].canonicalOwner[0],'ValueController');
assert.equal(systems.Selection.canonicalOwner[0],'SelectionController');
assert.equal(systems.Overlay.canonicalOwner[0],'OverlayController');
for(const stale of ['Headless.StateController','Headless.Selection','DOMHeadless.OverlayRuntime']){
  assert.equal(JSON.stringify(canonical).includes(stale),false,'Stale canonical owner remains: '+stale);
}
console.log(JSON.stringify({ok:true,components:names.length,valueOwner:'ValueController',selectionOwner:'SelectionController',overlayOwner:'OverlayController'}));
