import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { TokenInput } from '../src/core/tokenInput.js';
import { Tags } from '../src/components/tags.js';
import { TagInput } from '../src/components/tag-input.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const tagsSource=read('src/components/tags.js');
const tagInputSource=read('src/components/tag-input.js');
const tokenSource=read('src/core/tokenInput.js');
const fieldSource=read('src/components/field.js');

function assertProfile(type,name,owners){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(Object.keys(profile.ownership).sort(),owners.slice().sort(),name+' ownership must exactly match Phase H target.');
  const map={value:'ValueController',focus:'FocusController',interaction:'InteractionController',capability:'CapabilityController',selection:'SelectionController',overlay:'OverlayController',feedback:'FeedbackController',form:'FormController'};
  owners.forEach(capability=>assert.equal(profile.ownership[capability],map[capability],name+' '+capability+' owner'));
}
assertProfile(Tags,'Tags',['value','focus','interaction','capability','selection','overlay','feedback','form']);
assertProfile(TagInput,'TagInput',['value','focus','interaction','capability','selection','feedback','form']);

assert.match(tokenSource,/ValueController\.create\s*\(/,'TokenInput tag list must be ValueController-owned.');
assert.match(tokenSource,/getValueController:\s*function \(\) \{ return valueController; \}/,'TokenInput must expose its canonical ValueController.');
assert.match(read('src/core/valueController.js'),/getValueController\(\) \{ return controller; \}/,'ValueController bindings must expose their canonical controller without becoming a second owner.');
const token=TokenInput.create({tags:[{key:'a',value:'a',label:'A'}],creatable:true});
const tokenValue=token.getValueController();
assert.deepEqual(tokenValue.value.map(tag=>tag.value),['a']);
token.setTags([{key:'b',value:'b',label:'B'}],{silent:true,source:'verify'});
assert.deepEqual(tokenValue.value.map(tag=>tag.value),['b'],'TokenInput mutations must update the same ValueController.');
token.destroy();

assert.match(tagsSource,/selectionValueState\.getValueController\(\)/,'Checkable Tags must resolve the canonical selection ValueController.');
assert.match(tagsSource,/tokenInput\.getValueController\(\)/,'Non-checkable Tags must bind TokenInput canonical ValueController.');
assert.match(tagsSource,/projectValue:tokenValues/,'Tags must project token objects to public value[] without a second value store.');
const syncBlock=(tagsSource.match(/function syncFormBridge\(meta\) \{[\s\S]*?\n  \}/)||[])[0]||'';
assert.ok(syncBlock,'Tags syncFormBridge block missing.');
assert.doesNotMatch(syncBlock,/setFieldValue\s*\(/,'Tags form projection must not write projected values back into the canonical ValueController.');
assert.match(tagsSource,/Popover\.create\s*\(/,'Tags overflow must reuse Popover→Trigger overlay authority.');
assert.doesNotMatch(tagsSource,/\bLayerManager\b|OverlayRuntime\.create\s*\(/,'Tags must not create a parallel overlay authority.');
assert.match(tagsSource,/bindFeedbackProjector\s*\(/,'Tags visible status must enter FeedbackController through FieldComponent.');
assert.match(tagsSource,/getOverlayController:function\(\)\{return overflowPopover&&overflowPopover\.getOverlayController/,'Tags must expose the existing Popover OverlayController.');

assert.match(tagInputSource,/bindValueController\(valueState\.getValueController\(\),/,'TagInput must bind its StateController canonical ValueController into FieldComponent.');
assert.match(tagInputSource,/bindFocusController\s*\(/,'TagInput focus must enter FieldComponent→FocusController.');
assert.match(tagInputSource,/bindInteractionController\s*\(/,'TagInput key semantics must enter FieldComponent→InteractionController.');
assert.match(tagInputSource,/bindCapabilityController\s*\(/,'TagInput capability policy must enter FieldComponent→CapabilityController.');
assert.match(tagInputSource,/bindFeedbackControl\s*\(/,'TagInput visible status must enter FeedbackController through Control.');
assert.match(tagInputSource,/getSelectionController\(\)\{const tags=recordFor\(this\)\.control\?\.getTags/,'TagInput must reuse hosted Tags SelectionController.');
assert.doesNotMatch(tagInputSource,/import \{ KeyboardNavigation \}|KeyboardNavigation\.create\s*\(/,'TagInput must not own a parallel KeyboardNavigation.');
assert.doesNotMatch(tagInputSource,/SelectionController\.create\s*\(/,'TagInput must not create a second SelectionController.');

assert.match(fieldSource,/bindFeedbackProjector\(projector, options = \{\}\)/,'FieldComponent must own the shared FeedbackController projector binding.');
assert.match(fieldSource,/settings\.listen === false/,'Hosted Field interaction must support shared external key dispatch without a second listener.');

console.log(JSON.stringify({
  ok:true,
  components:['Tags','TagInput'],
  tags:['ValueController','FocusController','InteractionController','CapabilityController','SelectionController','OverlayController','FeedbackController','FormController'],
  tagInput:['ValueController','FocusController','InteractionController','CapabilityController','SelectionController','FeedbackController','FormController'],
  tokenInputValueOwner:'ValueController',
  tagInputDirectKeyboardNavigation:0
}));
