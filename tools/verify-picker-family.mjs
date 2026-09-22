import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PickerComponent } from '../src/components/picker.js';
import { PopupFieldComponent } from '../src/components/popup-field.js';
import { WheelPicker } from '../src/components/wheel-picker.js';
import { TimePicker } from '../src/components/time-picker.js';
import { ColorPicker } from '../src/components/color-picker.js';
import { DatePicker } from '../src/components/date-picker.js';
import { PickerField } from '../src/components/picker-field.js';
import { WheelPanel } from '../src/components/wheel-panel.js';
import { TimePanel } from '../src/components/time-panel.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.equal(Object.getPrototypeOf(PickerComponent.prototype),PopupFieldComponent.prototype,'PickerComponent must directly extend PopupFieldComponent.');
for(const Type of [WheelPicker,TimePicker,ColorPicker,DatePicker]) assert.equal(Object.getPrototypeOf(Type.prototype),PickerComponent.prototype,`${Type.name} must directly extend PickerComponent.`);
for(const [name,file] of [['WheelPicker','wheel-picker.js'],['TimePicker','time-picker.js'],['ColorPicker','color-picker.js'],['DatePicker','date-picker.js']]){
  const source=fs.readFileSync(path.join(root,'src/components',file),'utf8');
  assert.ok(!/(?:Core|Headless|DOMHeadless|Component|BuildingBlock)Registry\.(?:get|define|assert)\s*\(/.test(source),`${name} must not use registry lookup.`);
  assert.ok(!/globalThis\.QXFRAME9A7C2|\bbrand\./.test(source),`${name} must not use global runtime lookup.`);
  assert.ok(!/function\s+(?:updateOptions|destroy)\s*\(/.test(source),`${name} must leave public update/destroy lifecycle to Component.`);
}
for(const [name,api] of [['PickerField',PickerField],['WheelPanel',WheelPanel],['TimePanel',TimePanel]]) assert.equal(typeof api.create,'function',`${name} ESM support authority must expose create().`);
console.log(JSON.stringify({ok:true,family:'PickerComponent',extends:'PopupFieldComponent',members:['WheelPicker','TimePicker','ColorPicker','DatePicker'],support:['PickerField','WheelPanel','TimePanel'],publicLifecycleOwner:'PickerComponent'}));
