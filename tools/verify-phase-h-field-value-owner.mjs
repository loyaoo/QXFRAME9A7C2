import fs from 'node:fs';
import assert from 'node:assert/strict';
import { FieldComponent } from '../src/components/field.js';
import { ValueController } from '../src/core/valueController.js';

class ProbeField extends FieldComponent {}

const field=new ProbeField({name:'probe',defaultValue:'seed'});
const owned=field.getValueController();
assert.ok(owned&&typeof owned.setValue==='function','FieldComponent must expose its canonical ValueController.');
assert.equal(field.value,'seed');
assert.equal(owned.value,'seed');

let changes=[];
field.on('change',detail=>changes.push(detail));
assert.equal(field.setFieldValue('next',{source:'user',reason:'typing'}),true);
assert.equal(field.value,'next');
assert.equal(owned.value,'next');
assert.equal(changes.length,1);
assert.equal(changes[0].value,'next');
assert.equal(changes[0].previous,'seed');

field.updateOptions({value:'external'});
assert.equal(field.value,'external','options value sync must enter ValueController.');
assert.equal(owned.value,'external');

const external=ValueController.create({value:'controller-owned'});
field.bindValueController(external);
assert.equal(field.getValueController(),external,'bound ValueController identity must become the FieldComponent authority.');
assert.equal(field.value,'controller-owned','bound ValueController must win over the retired FieldComponent controller value.');
field.setFieldValue('shared',{source:'user',reason:'shared-write'});
assert.equal(external.value,'shared','FieldComponent writes must enter the bound ValueController.');
assert.equal(field.value,'shared');

const bridgeField=new ProbeField({name:'bridge',defaultValue:'a'});
const bridge=bridgeField.bindFormBridge({name:'bridge'});
assert.equal(bridgeField.setFieldValue('b',{source:'user'}),true);
assert.equal(bridge.getValue(),'b','FormBridge must project the ValueController-owned committed value.');

const source=fs.readFileSync(new URL('../src/components/field.js',import.meta.url),'utf8');
assert.match(source,/ValueController\.create\s*\(/,'FieldComponent must create its default ValueController authority.');
assert.match(source,/getValueController\s*\(/,'FieldComponent must expose its canonical ValueController.');
assert.match(source,/bindValueController\s*\(/,'FieldComponent must support adopting a component-owned ValueController.');
assert.doesNotMatch(source,/\b(?:record|state)\.value\b/,'FieldComponent must not retain a parallel plain committed-value mirror.');
assert.match(source,/state\.valueController\.syncExternal\s*\(/,'external option sync must enter ValueController.');
assert.match(source,/controller\.setValue\s*\(/,'component writes must enter ValueController.');

assert.equal(field.destroy(),true);
assert.equal(external.destroyed,false,'FieldComponent must not destroy an externally bound ValueController unless explicitly owned.');
assert.equal(external.destroy(),true);
assert.equal(bridgeField.destroy(),true);

console.log(JSON.stringify({
  ok:true,
  internalTarget:'FieldComponent',
  committedValueAuthority:'ValueController',
  plainValueMirror:false,
  externalControllerAdoption:true,
  formBridgeProjection:true
}));
