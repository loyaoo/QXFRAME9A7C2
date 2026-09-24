import fs from 'node:fs';
import assert from 'node:assert/strict';
import { FieldComponent } from '../src/components/field.js';
import { FormController } from '../src/core/formController.js';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Autocomplete } from '../src/components/autocomplete.js';
import { Cascader } from '../src/components/cascader.js';
import { ColorPicker } from '../src/components/color-picker.js';
import { DatePicker } from '../src/components/date-picker.js';
import { Select } from '../src/components/select.js';
import { TreeSelect } from '../src/components/tree-select.js';
import { TimePicker } from '../src/components/time-picker.js';
import { WheelPicker } from '../src/components/wheel-picker.js';
import { Tags } from '../src/components/tags.js';
import { Transfer } from '../src/components/transfer.js';

class ProbeField extends FieldComponent {}

const form=FormController.create();
const left=new ProbeField({name:'same',value:'left'});
const right=new ProbeField({name:'same',value:'right'});
const leftRegistration=left.bindFormController(form,{
  fieldId:'left',
  validateSync:value=>value==='valid'||'left-invalid'
});
const rightRegistration=right.bindFormController(form,{fieldId:'right'});

assert.equal(left.getFormController(),form,'FieldComponent must retain the bound FormController identity.');
assert.equal(left.getFormRegistration(),leftRegistration);
assert.equal(right.getFormRegistration(),rightRegistration);
assert.deepEqual(form.getFieldsByName('same'),['left','right'],'same-name fields must remain distinct by fieldId.');
assert.equal(form.snapshot().fieldCount,2);

left.setFieldValue('changed',{source:'user',reason:'typing'});
assert.equal(form.getField('left').dirty,true,'user value changes must notify FormController dirty state.');
assert.equal(form.getField('right').dirty,false,'sibling field state must remain independent.');
left.markFormTouched(true,{source:'user'});
assert.equal(form.getField('left').touched,true);

let validation=await left.validateFormField({source:'user'});
assert.equal(validation.status,'invalid','FieldComponent validator adapter must enter FormController.');
assert.equal(form.getField('left').error,'left-invalid');
left.setFieldValue('valid',{source:'user'});
validation=await left.validateFormField({source:'user'});
assert.equal(validation.status,'applied');
assert.equal(form.getField('left').valid,true);

left.updateOptions({name:'renamed'});
assert.deepEqual(form.getFieldsByName('same'),['right'],'implicit form binding name must track component option changes.');
assert.deepEqual(form.getFieldsByName('renamed'),['left']);
assert.equal(form.serializeEntries().find(entry=>entry.fieldId==='left').value,'valid');

left.setFieldValue('external',{source:'external',reason:'owner-sync'});
assert.equal(form.getField('left').dirty,false,'external owner sync must not invent dirty state.');

assert.equal(right.destroy(),true);
assert.equal(form.snapshot().fieldCount,1,'FieldComponent destroy must unregister its FormController field.');
assert.deepEqual(form.getFieldsByName('same'),[]);
assert.equal(left.unbindFormController({reason:'explicit-unbind'}).status,'applied');
assert.equal(form.snapshot().fieldCount,0);
assert.equal(left.getFormController(),null);
left.destroy();
form.destroy();

for(const [name,type] of [
  ['Autocomplete',Autocomplete],['Cascader',Cascader],['ColorPicker',ColorPicker],['DatePicker',DatePicker],['Select',Select],
  ['TreeSelect',TreeSelect],['TimePicker',TimePicker],['WheelPicker',WheelPicker],['Tags',Tags],['Transfer',Transfer]
]){
  const profile=ComponentProfile.define(type.profile);
  assert.ok(profile.form,name+' must declare Form capability.');
  assert.equal(profile.ownership.form,'FormController',name+' must declare canonical FormController ownership.');
  assert.ok(FieldComponent.prototype.isPrototypeOf(type.prototype),name+' must inherit the shared FieldComponent form binding path.');
}

const fieldSource=fs.readFileSync(new URL('../src/components/field.js',import.meta.url),'utf8');
assert.match(fieldSource,/FormController\.bindField\s*\(/,'FieldComponent must enter FormController through the canonical binder.');
assert.doesNotMatch(fieldSource,/new\s+Map\s*\(/,'FieldComponent must not create a second field registry.');
assert.match(fieldSource,/FormBridge\.create\s*\(/,'FormBridge must remain the native carrier authority.');

console.log(JSON.stringify({
  ok:true,
  sharedFormBinding:true,
  sameNameFields:true,
  valueNotification:true,
  touched:true,
  validation:true,
  renameReindex:true,
  destroyUnregister:true,
  profileOwners:10
}));
