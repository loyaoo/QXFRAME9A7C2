import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { QXFRAME9A7C2, ComponentRuntime, ComponentProfile } from '../src/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/phase-h-target-profiles.json'),'utf8'));
const names=Object.keys(target.components).sort();
const runtimeNames=Object.keys(QXFRAME9A7C2.Components).sort();
assert.equal(names.length,40,'Phase H target matrix must contain exactly 40 public components.');
assert.deepEqual(names,runtimeNames,'Phase H target matrix must exactly match the public Components namespace.');

const capabilities=ComponentProfile.capabilities.slice();
const controllers=ComponentProfile.controllers.slice();
assert.deepEqual(Object.keys(target.controllerByCapability).sort(),capabilities.slice().sort(),'Phase H target matrix must cover every Runtime Controller capability exactly once.');
for(const capability of capabilities){
  const controller=target.controllerByCapability[capability];
  assert.ok(controllers.includes(controller),'Unknown target controller for '+capability+': '+controller);
}

let profiled=0,complete=0;
const missingByComponent={};
const missingOwnershipByComponent={};
for(const name of names){
  const wanted=target.components[name];
  assert.ok(Array.isArray(wanted)&&wanted.length>0,name+' must declare at least one target capability.');
  assert.equal(new Set(wanted).size,wanted.length,name+' target capabilities must be unique.');
  wanted.forEach(capability=>assert.ok(capabilities.includes(capability),name+' has unknown target capability '+capability));
  const profile=ComponentRuntime.profileFor(name);
  if(!profile){
    missingByComponent[name]=wanted.slice();
    missingOwnershipByComponent[name]=wanted.slice();
    continue;
  }
  profiled+=1;
  assert.equal(profile.name,name,name+' profile name must match runtime component name.');
  const actual=capabilities.filter(capability=>profile[capability]!=null);
  const extras=actual.filter(capability=>!wanted.includes(capability));
  assert.deepEqual(extras,[],name+' profile must not declare capabilities outside the handbook Phase H target.');
  const ownership=profile.ownership||{};
  const ownershipKeys=Object.keys(ownership);
  const ownershipExtras=ownershipKeys.filter(capability=>!wanted.includes(capability));
  assert.deepEqual(ownershipExtras,[],name+' ownership must not declare capabilities outside the handbook target.');
  ownershipKeys.forEach(capability=>{
    assert.equal(ownership[capability],target.controllerByCapability[capability],name+' '+capability+' must use the canonical Runtime Controller.');
  });
  const missing=wanted.filter(capability=>!actual.includes(capability));
  const missingOwners=wanted.filter(capability=>ownership[capability]!==target.controllerByCapability[capability]);
  if(missing.length)missingByComponent[name]=missing;
  if(missingOwners.length)missingOwnershipByComponent[name]=missingOwners;
  if(!missing.length&&!missingOwners.length)complete+=1;
}
assert.ok(profiled>=Number(target.minimumProfiled||0),'Phase H profile coverage regressed below the frozen baseline.');
assert.ok(Array.isArray(target.internalTargets)&&target.internalTargets.length>=20,'Phase H internal/base target ledger is incomplete.');

console.log(JSON.stringify({
  ok:true,
  publicComponents:names.length,
  profiled,
  complete,
  remaining:names.length-complete,
  missingCapabilities:missingByComponent,
  missingOwnership:missingOwnershipByComponent,
  internalTargets:target.internalTargets.length
},null,2));
