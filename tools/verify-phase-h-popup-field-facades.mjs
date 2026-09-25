import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { FieldComponent } from '../src/components/field.js';
import { PopupFieldComponent } from '../src/components/popup-field.js';
import { Select } from '../src/components/select.js';
import { TreeSelect } from '../src/components/tree-select.js';
import { Cascader } from '../src/components/cascader.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const fieldSource=read('src/components/field.js');
const popupFieldSource=read('src/components/popup-field.js');

assert.equal(typeof FieldComponent.prototype.bindFeedbackControl,'function','FieldComponent must expose the shared local feedback binder.');
assert.equal(typeof FieldComponent.prototype.getFeedbackController,'function','FieldComponent must expose canonical FeedbackController access.');
assert.match(fieldSource,/FeedbackController\.createForProjector\s*\(/,'FieldComponent local visible feedback must enter FeedbackController.');
assert.match(popupFieldSource,/getOverlayController\(\)/,'PopupFieldComponent must expose Trigger overlay authority.');
assert.match(popupFieldSource,/Trigger\.create\s*\(/,'PopupFieldComponent popup resource path must remain Trigger-owned.');

const expected=['value','focus','interaction','capability','selection','overlay','feedback','form'];
const owner={
  value:'ValueController',focus:'FocusController',interaction:'InteractionController',
  capability:'CapabilityController',selection:'SelectionController',overlay:'OverlayController',
  feedback:'FeedbackController',form:'FormController'
};

for(const [name,type,file] of [
  ['Select',Select,'src/components/select.js'],
  ['TreeSelect',TreeSelect,'src/components/tree-select.js'],
  ['Cascader',Cascader,'src/components/cascader.js']
]){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(Object.keys(profile.ownership).sort(),expected.slice().sort(),name+' must declare exactly V/F/I/C/S/O/B/R ownership.');
  expected.forEach(cap=>{
    assert.ok(profile[cap],name+' must declare '+cap+' capability metadata.');
    assert.equal(profile.ownership[cap],owner[cap],name+' '+cap+' must use canonical '+owner[cap]+'.');
  });
  assert.ok(type.prototype instanceof PopupFieldComponent || type.prototype instanceof FieldComponent,name+' must remain on shared field/popup base.');
  const source=read(file);
  assert.match(source,/instance\.bindFeedbackControl\(fieldControl\)/,name+' must bind its canonical Control to FieldComponent feedback.');
  assert.doesNotMatch(source,/FeedbackController\.create(?:ForProjector)?\s*\(/,name+' must not create a parallel component-local FeedbackController.');
}

console.log(JSON.stringify({
  ok:true,
  components:['Select','TreeSelect','Cascader'],
  ownership:expected.map(cap=>owner[cap]),
  sharedFeedback:'FieldComponent',
  sharedOverlay:'PopupFieldComponent→Trigger'
}));
