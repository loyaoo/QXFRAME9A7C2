import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { InputNumber } from '../src/components/input-number.js';
import { InputOTP } from '../src/components/input-otp.js';
import { Rate } from '../src/components/rate.js';
import { Slider } from '../src/components/slider.js';

const EXPECTED=['capability','feedback','focus','form','interaction','value'];
for(const Type of [InputNumber,InputOTP,Rate,Slider]){
  const profile=ComponentProfile.define(Type.profile);
  assert.deepEqual(Object.keys(profile.ownership).sort(),EXPECTED,Type.name+' must match the exact V/F/I/C/B/R target.');
  assert.equal(profile.ownership.value,'ValueController');
  assert.equal(profile.ownership.focus,'FocusController');
  assert.equal(profile.ownership.interaction,'InteractionController');
  assert.equal(profile.ownership.capability,'CapabilityController');
  assert.equal(profile.ownership.feedback,'FeedbackController');
  assert.equal(profile.ownership.form,'FormController');
}

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const field=read('src/components/field.js');
assert.match(field,/export function createSimpleFieldProfile\s*\(/,'simple Field profiles must come from one shared factory.');
assert.match(field,/bindCapabilityController\s*\(/);
assert.match(field,/bindFocusController\s*\(/);
assert.match(field,/bindInteractionController\s*\(/);
assert.match(field,/bindFeedbackControl\s*\(/);
assert.match(field,/state\.syncExternalValue !== false/,'specialized ValueControllers must be able to suppress the generic external-value rewrite.');

const numeric=read('src/core/numericInput.js');
assert.match(numeric,/getValueController:\s*function \(\) \{ return valueState; \}/,'NumericInput must expose its canonical ValueController.');
assert.match(numeric,/projectValue:\s*external/,'InputNumber Field projection must reuse NumericInput external-value projection.');

const control=read('src/components/control.js');
assert.match(control,/opts\.onKeydown\(event, api, \{ segmentIndex:index/,'Control segments must give the owning InteractionController first refusal.');
const cases=[
  ['src/components/input-number.js','InputNumber'],
  ['src/components/input-otp.js','InputOTP'],
  ['src/components/rate.js','Rate'],
  ['src/components/slider.js','Slider']
];
for(const [file,name] of cases){
  const source=read(file);
  assert.match(source,new RegExp("createSimpleFieldProfile\\\\(['\\\"]"+name+"['\\\"]\\\\)"));
  for(const method of ['bindCapabilityController','bindFocusController','bindInteractionController','bindFeedbackControl']) assert.match(source,new RegExp(method+'\\s*\\('),name+' must bind '+method+'.');
  assert.match(source,/syncExternal:false/,name+' specialized ValueController must own options external sync.');
}
assert.doesNotMatch(read('src/components/rate.js'),/DOM\.listen\(root,'keydown'/,'Rate must not keep a parallel root keydown semantic owner.');
assert.doesNotMatch(read('src/components/slider.js'),/DOM\.listen\(handle,'keydown'/,'Slider handles must not keep a parallel direct keydown semantic owner.');

console.log(JSON.stringify({ok:true,components:['InputNumber','InputOTP','Rate','Slider'],target:'V/F/I/C/B/R',sharedFieldFacade:true}));
