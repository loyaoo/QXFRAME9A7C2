import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { FieldComponent } from '../src/components/field.js';
import { InputNumber } from '../src/components/input-number.js';
import { InputOTP } from '../src/components/input-otp.js';
import { Rate } from '../src/components/rate.js';
import { Slider } from '../src/components/slider.js';

const expected=Object.freeze({
  InputNumber:['value','focus','interaction','capability','feedback','form'],
  InputOTP:['value','focus','interaction','capability','feedback','form'],
  Rate:['value','focus','interaction','capability','feedback','form'],
  Slider:['value','focus','interaction','capability','feedback','form']
});
const controllerByCapability=Object.freeze({
  value:'ValueController',focus:'FocusController',interaction:'InteractionController',
  capability:'CapabilityController',feedback:'FeedbackController',form:'FormController'
});
for(const type of [InputNumber,InputOTP,Rate,Slider]){
  const profile=ComponentProfile.define(type.profile);
  const wanted=expected[profile.name];
  assert.ok(wanted,profile.name+' missing H-013 target');
  const actual=wanted.filter(key=>profile[key]!=null);
  assert.deepEqual(actual,wanted,profile.name+' profile must declare exact V/F/I/C/B/R capabilities');
  assert.deepEqual(Object.keys(profile.ownership).sort(),wanted.slice().sort(),profile.name+' ownership must be exact V/F/I/C/B/R');
  for(const capability of wanted)assert.equal(profile.ownership[capability],controllerByCapability[capability],profile.name+' '+capability+' owner mismatch');
}
assert.equal(typeof FieldComponent.prototype.bindSimpleControllers,'function');
assert.equal(typeof FieldComponent.prototype.bindFeedbackProjector,'function');
assert.equal(typeof FieldComponent.prototype.bindFeedbackClasses,'function');
assert.equal(typeof FieldComponent.prototype.bindFormController,'function');
assert.equal(typeof FieldComponent.prototype.bindValueController,'function');

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const field=read('src/components/field.js');
const numeric=read('src/core/numericInput.js');
const inputNumber=read('src/components/input-number.js');
const inputOtp=read('src/components/input-otp.js');
const control=read('src/components/control.js');
const rate=read('src/components/rate.js');
const slider=read('src/components/slider.js');

assert.match(field,/FocusController\.create\s*\(/,'simple Field bundle must create FocusController');
assert.match(field,/InteractionController\.create\s*\(/,'simple Field bundle must create InteractionController');
assert.match(field,/CapabilityController\.create\s*\(/,'simple Field bundle must create CapabilityController');
assert.match(field,/FeedbackController\.createForProjector\s*\(/,'Field feedback must enter FeedbackController');
assert.match(numeric,/getValueController:\s*function/,'NumericInput must expose its canonical ValueController');
assert.match(inputNumber,/bindValueController\(numeric\.getValueController\(\)\)/,'InputNumber must bind NumericInput canonical ValueController');
assert.match(inputNumber,/interaction\.dispatch\(event\)/,'InputNumber keyboard path must dispatch through InteractionController');
assert.match(inputNumber,/capability\.can\('edit'\)/,'InputNumber stepping must be CapabilityController-gated');
assert.match(inputOtp,/onSegmentKeydown:[\s\S]{0,220}interaction\.dispatch/,'InputOTP segment keyboard path must dispatch through InteractionController');
assert.match(control,/opts\.onSegmentKeydown/,'Control must expose only an opt-in segment pre-hook');
assert.match(rate,/interaction\.dispatch\(event\)/,'Rate keyboard path must dispatch through InteractionController');
assert.match(rate,/bindFeedbackClasses\(root\)/,'Rate feedback must reuse shared Field projector');
assert.match(slider,/interaction\.dispatch\(event\)/,'Slider keyboard path must dispatch through InteractionController');
assert.match(slider,/handleControllerAction/,'Slider key semantics must be action-based');
assert.match(slider,/bindFeedbackClasses\(root\)/,'Slider feedback must reuse shared Field projector');
assert.doesNotMatch(slider,/if\(event\.key==='ArrowRight'\|\|event\.key==='ArrowUp'\).*setValues/s,'Slider must not keep a parallel direct keyboard value semantic path');

console.log(JSON.stringify({
  ok:true,
  components:Object.keys(expected),
  ownership:'V/F/I/C/B/R',
  numericValueOwner:'ValueController',
  sharedFieldControllers:true,
  sharedFeedbackProjection:true
}));
