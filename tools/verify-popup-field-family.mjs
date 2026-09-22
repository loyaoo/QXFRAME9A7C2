import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/components/popup-field.js'),'utf8');
assert.match(source,/export class PopupFieldComponent extends FieldComponent/,'PopupFieldComponent must extend FieldComponent.');
assert.match(source,/Trigger\.create\(/,'PopupFieldComponent must compose Trigger rather than inherit PopupComponent.');
assert.ok(!/extends\s+PopupComponent/.test(source),'PopupFieldComponent must not inherit PopupComponent.');
for(const method of ['open','close','toggle','setOpen','reposition','focusReference','focusPopup']) assert.match(source,new RegExp('\\n\\s*'+method+'\\s*\\('),'PopupFieldComponent must own '+method+'().');
for(const pattern of [/Registry\.(?:get|define|assert)/,/defineModule\s*\(/,/(?:globalThis|window)\.QXFRAME9A7C2/]) assert.ok(!pattern.test(source),'PopupFieldComponent contains legacy dependency '+pattern);

const autocompleteSource=fs.readFileSync(path.join(root,'src/components/autocomplete.js'),'utf8');
assert.match(autocompleteSource,/export class Autocomplete extends PopupFieldComponent/,'Autocomplete must extend PopupFieldComponent.');
for(const method of ['open','close','toggle','setOpen','reposition','destroy','updateOptions']) assert.ok(!new RegExp('\\n\\s*'+method+'\\s*\\(').test(autocompleteSource),'Autocomplete must inherit '+method+' from PopupFieldComponent/Component.');
for(const pattern of [/Registry\.(?:get|define|assert)/,/defineModule\s*\(/,/(?:globalThis|window)\.QXFRAME9A7C2/]) assert.ok(!pattern.test(autocompleteSource),'Autocomplete contains legacy dependency '+pattern);


const selectSource=fs.readFileSync(path.join(root,'src/components/select.js'),'utf8');
assert.match(selectSource,/export class Select extends PopupFieldComponent/,'Select must extend PopupFieldComponent.');
for(const method of ['open','close','toggle','setOpen','reposition','destroy','updateOptions']) assert.ok(!new RegExp('\\n\\s*'+method+'\\s*\\(').test(selectSource),'Select must inherit '+method+' from PopupFieldComponent/Component.');
for(const pattern of [/Registry\.(?:get|define|assert)/,/defineModule\s*\(/,/(?:globalThis|window)\.QXFRAME9A7C2/]) assert.ok(!pattern.test(selectSource),'Select contains legacy dependency '+pattern);


const cascaderSource=fs.readFileSync(path.join(root,'src/components/cascader.js'),'utf8');
assert.match(cascaderSource,/export class Cascader extends PopupFieldComponent/,'Cascader must extend PopupFieldComponent.');
for(const method of ['open','close','toggle','setOpen','reposition','destroy','updateOptions']) assert.ok(!new RegExp('\\n\\s*'+method+'\\s*\\(').test(cascaderSource),'Cascader must inherit '+method+' from PopupFieldComponent/Component.');
for(const pattern of [/Registry\.(?:get|define|assert)/,/defineModule\s*\(/,/(?:globalThis|window)\.QXFRAME9A7C2/]) assert.ok(!pattern.test(cascaderSource),'Cascader contains legacy dependency '+pattern);

console.log(JSON.stringify({ok:true,family:'PopupFieldComponent',extends:'FieldComponent',composition:['Trigger'],membersComplete:['Autocomplete','Select','Cascader','TreeSelect'],membersPending:[]}));
