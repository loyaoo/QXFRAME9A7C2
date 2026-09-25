import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { QXFRAME9A7C2, ComponentRuntime, ComponentProfile } from '../src/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const target=JSON.parse(read('tools/manifests/phase-h-target-profiles.json'));
const acceptance=read('FOUR_UNIFICATIONS_ACCEPTANCE.md');
const workState=read('AI_WORK_STATE.md');
const pkg=JSON.parse(read('package.json'));

const names=Object.keys(target.components||{}).sort();
const runtimeNames=Object.keys(QXFRAME9A7C2.Components||{}).sort();
assert.equal(names.length,40,'Phase I requires exactly 40 public target components.');
assert.deepEqual(names,runtimeNames,'Phase I target matrix must match the public runtime namespace.');
assert.equal(Number(target.minimumProfiled),40,'Phase I must freeze profiled coverage at 40.');
assert.equal(Number(target.minimumComplete),40,'Phase I must freeze completed profile coverage at 40.');

const capabilities=ComponentProfile.capabilities.slice();
const missing=[];
for(const name of names){
  const wanted=target.components[name]||[];
  const profile=ComponentRuntime.profileFor(name);
  if(!profile){missing.push({name,reason:'missing-profile'});continue;}
  const actual=capabilities.filter(capability=>profile[capability]!=null);
  const ownership=profile.ownership||{};
  const missingCaps=wanted.filter(capability=>!actual.includes(capability));
  const extraCaps=actual.filter(capability=>!wanted.includes(capability));
  const badOwners=wanted.filter(capability=>ownership[capability]!==target.controllerByCapability[capability]);
  if(missingCaps.length||extraCaps.length||badOwners.length) missing.push({name,missingCaps,extraCaps,badOwners});
}
assert.deepEqual(missing,[],'Phase I requires all 40 public components to match the Phase H target matrix.');

const rows=acceptance.split(/\r?\n/).filter(line=>line.startsWith('| ')&&!line.startsWith('| ---')&&!line.startsWith('| Public component'));
assert.equal(rows.length,40,'Acceptance ledger must contain exactly 40 public component rows.');
const notHAccepted=rows.filter(line=>!/\| H accepted; I (?:pending|accepted) \|$/.test(line));
assert.deepEqual(notHAccepted,[],'Every public component must remain H accepted while Phase I acceptance advances from pending to accepted.');
assert.match(acceptance,/40\/40/,'Acceptance ledger must state the 40/40 Phase H public-component result.');

assert.match(workState,/- Current Phase: [^\\r\\n]+/,'AI_WORK_STATE must declare the current lifecycle phase.');\nassert.match(workState,/### PHASE-I-001[^\\n]*[\\s\\S]*?Status: DONE/,'AI_WORK_STATE must preserve evidence that Phase I release-integrity completed before the lifecycle advances.');
assert.match(workState,/- Current Task: `[^`]+`/,'AI_WORK_STATE must declare the current task without freezing a historical checkpoint id.');
const current=workState.split('## CURRENT')[1]?.split('## Current authority snapshot')[0]||'';
assert.doesNotMatch(current,/### PHASE-H-027|Table is the last|pending PHASE-H-027/,'CURRENT checkpoint must not retain stale final-Table Phase H state.');
assert.doesNotMatch(workState,/DatePicker\/TimePicker preset selection must respect `needConfirm`/,'Superseded needConfirm issue must not remain active after picker-family browser acceptance.');

const requiredVerify=[
  'verify:architecture','verify:contracts','verify:esm-graph','verify:types','verify:browser',
  'verify:docs-canonical','verify:release','verify:package','verify:final','verify:phase-h-target-matrix','verify:phase-h-table-final'
];
for(const key of requiredVerify) assert.ok(pkg.scripts&&pkg.scripts[key],key+' must remain available for Phase I release integrity.');
for(const key of ['verify:architecture','verify:contracts','verify:esm-graph','verify:types','verify:docs-canonical','verify:final','verify:phase-h-target-matrix','verify:phase-h-table-final']){
  assert.ok(pkg.scripts.verify.includes('npm run '+key),'Main verify chain must include '+key+'.');
}
for(const key of ['verify','verify:browser','verify:legacy-browser','verify:release','verify:package']){
  assert.ok(pkg.scripts.release.includes('npm run '+key),'Release chain must include '+key+'.');
}
assert.equal(pkg.scripts['audit:completion'],'node tools/audit-final-completion.mjs','Completion audit entry must remain canonical.');

console.log(JSON.stringify({
  ok:true,
  phaseHAccepted:40,
  componentProfiles:40,
  phaseI:'release-integrity-complete',
  broadAstraAudit:'state-driven'
},null,2));
