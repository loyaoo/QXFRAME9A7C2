import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { DatePicker } from '../src/components/date-picker.js';
import { TimePicker } from '../src/components/time-picker.js';
import { ColorPicker } from '../src/components/color-picker.js';
import { WheelPicker } from '../src/components/wheel-picker.js';

const root=new URL('../',import.meta.url);
const read=rel=>fs.readFileSync(new URL(rel,root),'utf8');

const expected={
  DatePicker:['value','focus','interaction','capability','motion','selection','overlay','feedback','form'],
  TimePicker:['value','focus','interaction','capability','motion','selection','overlay','feedback','form'],
  ColorPicker:['value','focus','interaction','capability','motion','overlay','feedback','form'],
  WheelPicker:['value','focus','interaction','capability','motion','selection','overlay','feedback','form']
};
const controller={
  value:'ValueController',focus:'FocusController',interaction:'InteractionController',capability:'CapabilityController',
  motion:'MotionController',selection:'SelectionController',overlay:'OverlayController',feedback:'FeedbackController',form:'FormController'
};
for(const Type of [DatePicker,TimePicker,ColorPicker,WheelPicker]){
  const profile=ComponentProfile.define(Type.profile);
  const wanted=expected[profile.name];
  assert.ok(wanted,profile.name+' missing Picker family target.');
  const actual=ComponentProfile.capabilities.filter(key=>profile[key]!=null);
  assert.deepEqual(actual.slice().sort(),wanted.slice().sort(),profile.name+' must match the handbook Picker target exactly.');
  assert.deepEqual(Object.keys(profile.ownership).sort(),wanted.slice().sort(),profile.name+' ownership must cover every declared capability.');
  wanted.forEach(key=>assert.equal(profile.ownership[key],controller[key],profile.name+' '+key+' owner mismatch.'));
}

const pickerSource=read('src/components/picker.js');
const popupFieldSource=read('src/components/popup-field.js');
const pickerFieldSource=read('src/components/picker-field.js');
assert.match(pickerSource,/SelectionController\.create\s*\(/,'PickerComponent must create the shared semantic SelectionController.');
assert.match(pickerSource,/syncPickerSelection\s*\(/,'PickerComponent must expose one semantic selection projection path.');
assert.match(pickerSource,/bindFeedbackControl\s*\(/,'PickerComponent must bind local feedback once through FieldComponent.');
assert.match(pickerSource,/getFocusController\s*\(/,'PickerComponent must expose the PickerField FocusController.');
assert.match(popupFieldSource,/getInteractionController\s*\(/,'PopupFieldComponent must expose Trigger InteractionController.');
assert.match(popupFieldSource,/getCapabilityController\s*\(/,'PopupFieldComponent must expose Trigger CapabilityController.');
assert.match(popupFieldSource,/getOverlayController\s*\(/,'PopupFieldComponent must expose Trigger OverlayController.');
assert.match(popupFieldSource,/getMotionController\s*\(/,'PopupFieldComponent must expose Trigger MotionController.');
assert.match(pickerFieldSource,/FocusController\.create\s*\(/,'PickerField keyboard ownership must enter FocusController.');
assert.doesNotMatch(pickerFieldSource,/keyboard\s*=\s*KeyboardNavigation\.create\s*\(/,'PickerField must not retain a direct parallel KeyboardNavigation owner.');
assert.match(pickerFieldSource,/getFocusController:\s*function/,'PickerField must expose its canonical FocusController.');

const cases=[
  ['DatePicker','src/components/date-picker.js',true,/DateUnit\.key\s*\(/],
  ['TimePicker','src/components/time-picker.js',true,/TimeUnit\.format24\s*\(/],
  ['ColorPicker','src/components/color-picker.js',false,null],
  ['WheelPicker','src/components/wheel-picker.js',true,/item\s*&&\s*item\.key/]
];
for(const [name,file,hasSelection,keyPattern] of cases){
  const source=read(file);
  assert.equal((source.match(/bindValueController\(draft\)/g)||[]).length,1,name+' must bind exactly one picker-session ValueController into FieldComponent.');
  assert.match(source,/setFieldValue\([^\n]*sync:\s*true/,name+' committed changes must project through FieldComponent without a second Value write.');
  if(hasSelection){
    assert.equal((source.match(/setupPickerSelection\s*\(/g)||[]).length,1,name+' must create exactly one semantic SelectionController.');
    assert.match(source,/syncSelectionController\s*\(/,name+' must project draft/selected keys through SelectionController.');
    assert.match(source,keyPattern,name+' selection channel must use stable keys instead of business value objects.');
  }else{
    assert.doesNotMatch(source,/setupPickerSelection\s*\(/,'ColorPicker must not invent SelectionController ownership.');
  }
}

console.log(JSON.stringify({
  ok:true,
  publicPickers:Object.keys(expected),
  sharedValueController:true,
  sharedFocusController:true,
  sharedFeedbackController:true,
  semanticSelection:['DatePicker','TimePicker','WheelPicker'],
  colorSelection:false
}));
