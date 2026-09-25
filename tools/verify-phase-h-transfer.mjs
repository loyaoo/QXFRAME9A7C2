import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Transfer } from '../src/components/transfer.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/transfer.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Transfer.profile);
const expected=['value','focus','interaction','capability','selection','feedback','form'];
const owners={
  value:'ValueController',
  focus:'FocusController',
  interaction:'InteractionController',
  capability:'CapabilityController',
  selection:'SelectionController',
  feedback:'FeedbackController',
  form:'FormController'
};
assert.equal(profile.name,'Transfer');
assert.deepEqual(expected.filter(key=>profile[key]!=null).sort(),expected.slice().sort(),'Transfer must declare exact V/F/I/C/S/B/R target.');
assert.deepEqual(Object.keys(profile.ownership).sort(),expected.slice().sort(),'Transfer ownership must match the exact handbook target.');
for(const key of expected)assert.equal(profile.ownership[key],owners[key],key+' must use canonical owner '+owners[key]);

assert.match(source,/createSimpleFieldProfile\('Transfer'\)/,'Transfer must reuse the shared FieldComponent V/F/I/C/B/R profile.');
assert.match(source,/api\.bindFormBridge\s*\(/,'Transfer native form carrier must use FieldComponent bindFormBridge().');
assert.doesNotMatch(source,/Control\.createFormFieldBridge\s*\(/,'Transfer must not create a parallel native form bridge.');
assert.match(source,/api\.bindCapabilityController\s*\(/,'Transfer mutation policy must enter CapabilityController.');
assert.match(source,/capability\.can\('edit'\)/,'Transfer mutation path must consult the bound CapabilityController.');
assert.doesNotMatch(source,/CapabilityController\.mutationLocked\s*\(/,'Transfer must not keep the old static capability bypass.');
assert.match(source,/api\.bindFocusController\s*\(/,'Transfer composite focus scope must enter FocusController.');
assert.match(source,/api\.bindInteractionController\s*\(/,'Transfer operation keyboard semantics must enter InteractionController.');
for(const action of ['move-right','move-left','move-up','move-down'])assert.match(source,new RegExp("'"+action+"'"),'Transfer must expose '+action+' semantic action.');
assert.match(source,/api\.bindFeedbackControl\s*\(/,'Transfer visible busy/error/warning feedback must enter FeedbackController.');
assert.match(source,/SelectionController\.create\s*\(/,'Transfer checked state must retain one canonical SelectionController.');

console.log(JSON.stringify({
  ok:true,
  component:'Transfer',
  ownership:expected.map(key=>owners[key]),
  sharedFieldProfile:true,
  sharedFormBridge:true,
  semanticOperationKeys:true
}));
