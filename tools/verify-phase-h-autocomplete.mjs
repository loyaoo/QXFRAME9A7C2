import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Autocomplete } from '../src/components/autocomplete.js';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { FocusController } from '../src/core/focusController.js';

const source=fs.readFileSync(new URL('../src/components/autocomplete.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Autocomplete.profile);
const expected=['value','focus','interaction','capability','selection','overlay','feedback','form'];
assert.equal(profile.name,'Autocomplete');
assert.deepEqual(Object.keys(profile.ownership).sort(),expected.slice().sort());
const controllerByCapability={
  value:'ValueController',focus:'FocusController',interaction:'InteractionController',capability:'CapabilityController',
  selection:'SelectionController',overlay:'OverlayController',feedback:'FeedbackController',form:'FormController'
};
expected.forEach(capability=>assert.equal(profile.ownership[capability],controllerByCapability[capability],capability+' owner'));

assert.match(source,/ValueController\.create\s*\(/,'Autocomplete committed/draft value must enter ValueController.');
assert.match(source,/bindValueController\s*\(valueState\)/,'Autocomplete FieldComponent must bind the same ValueController.');
assert.match(source,/bindFocusController\s*\(keyboardTarget/,'Autocomplete keyboard/focus region must enter FocusController.');
assert.doesNotMatch(source,/import \{ KeyboardNavigation \}/,'Autocomplete must not directly import KeyboardNavigation.');
assert.doesNotMatch(source,/KeyboardNavigation\.create\s*\(/,'Autocomplete must not create KeyboardNavigation directly.');
assert.equal(typeof FocusController.shouldPreserveNativeTextEditing,'function','FocusController must expose the native text-editing guard.');
assert.match(source,/FocusController\.shouldPreserveNativeTextEditing\s*\(/,'Autocomplete Home/End native-edit guard must enter FocusController.');
assert.match(source,/capabilityController\s*=\s*triggerSession\.getCapabilityController\s*\(\)/,'Autocomplete must reuse Trigger CapabilityController.');
assert.match(source,/capabilityController\.can\('edit'\)/,'Autocomplete input mutation must be capability gated.');
assert.match(source,/capabilityController\.can\('clear'\)/,'Autocomplete clear mutation must be capability gated.');
assert.match(source,/capabilityController\.can\('select'\)/,'Autocomplete suggestion commit must be capability gated.');
assert.match(source,/optionList\.getSelectionController\s*\(/,'Autocomplete must expose OptionList canonical SelectionController.');
assert.match(source,/bindFeedbackControl\s*\(control\)/,'Autocomplete local visible feedback must reuse FieldComponent FeedbackController.');
assert.match(source,/setupPopupFieldRuntime\s*\(/,'Autocomplete overlay must remain PopupFieldComponent→Trigger→OverlayController.');
assert.doesNotMatch(source,/SelectionController\.create\s*\(/,'Autocomplete must not create a second SelectionController.');
assert.doesNotMatch(source,/FeedbackController\.create\s*\(/,'Autocomplete must not create a second FeedbackController.');

console.log(JSON.stringify({
  ok:true,
  component:'Autocomplete',
  ownership:expected.map(key=>controllerByCapability[key]),
  keyboardOwner:'FocusController→KeyboardRegion→KeyboardNavigation→InteractionController.resolveKeyboardAction',
  selectionOwner:'OptionList→SelectionController',
  overlayOwner:'PopupFieldComponent→Trigger→OverlayController',
  feedbackOwner:'FieldComponent→FeedbackController'
}));
