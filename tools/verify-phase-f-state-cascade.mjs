import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/qxframe9a7c2.css'),'utf8');

const count=(needle)=>css.split(needle).length-1;
const pos=(needle)=>css.indexOf(needle);

assert.equal(/unlayered overrides|kept last to preserve original cascade strength/i.test(css),false,
  'Canonical CSS must not depend on a late patch bucket for cascade strength.');

const focusTail=pos('/* Unified keyboard focus-visible contract.');
assert.ok(focusTail>0,'Unified focus contract boundary is missing.');

const movedOwners=[
  '.qxframe9a7c2-picker-field-footer-actions',
  '.qxframe9a7c2-time-picker-now.is-footer-action',
  '.qxframe9a7c2-table-filter-popup',
  '.qxframe9a7c2-table-filter-options',
  '.qxframe9a7c2-table-filter-actions',
  '.qxframe9a7c2-table-filter-search',
  '.qxframe9a7c2-table-filter-option-spacer',
  '.qxframe9a7c2-form-input-group>.qxframe9a7c2-form-input-group-item:hover',
  '.qxframe9a7c2-form-input-group>.qxframe9a7c2-form-input-group-item:focus-within',
  '.qxframe9a7c2-card{overflow:visible}'
];
for(const selector of movedOwners){
  assert.equal(css.indexOf(selector,focusTail),-1,selector+' must live with its component owner, not in the file-tail focus/compatibility area.');
}

assert.equal(count('.qxframe9a7c2-picker-field-footer-actions{'),1,'Picker footer-actions must have one canonical owner rule.');
assert.match(css,/\.qxframe9a7c2-picker-field-footer-actions\{[^}]*display:flex;[^}]*width:100%;/,
  'Picker footer-actions width must be resolved in the Picker owner rule.');

assert.equal(count('.qxframe9a7c2-time-picker-now.is-footer-action{'),1,'TimePicker footer action must have one canonical owner rule.');
const timeBase=pos('.qxframe9a7c2-time-picker-now{');
const timeFooter=pos('.qxframe9a7c2-time-picker-now.is-footer-action{');
const colorPicker=pos('.qxframe9a7c2-color-picker-panel{');
assert.ok(timeBase>=0 && timeFooter>timeBase && timeFooter<colorPicker,
  'TimePicker footer action must stay inside the TimePicker owner section.');

assert.equal(count('.qxframe9a7c2-table-filter-popup{'),1,'Table filter popup must have one canonical owner rule.');
const table=pos('.qxframe9a7c2-table{');
const tableFilterPopup=pos('.qxframe9a7c2-table-filter-popup{');
const transfer=pos('.qxframe9a7c2-transfer{');
assert.ok(table>=0 && tableFilterPopup>table && tableFilterPopup<transfer,
  'Table filter popup/options must stay inside the Table owner section before Transfer.');

assert.match(css,/\.qxframe9a7c2-form-input-group-item\{--_qxframe9a7c2-group-stack:1;position:relative;z-index:var\(--_qxframe9a7c2-group-stack\);/,
  'InputGroup item must consume its private group-stack channel in the canonical base rule.');
assert.match(css,/\.qxframe9a7c2-form-input-group>\.qxframe9a7c2-form-input-group-item:hover\{--_qxframe9a7c2-group-stack:2\}/,
  'InputGroup hover must resolve stacking through the private group-stack state channel.');
assert.match(css,/\.qxframe9a7c2-form-input-group>\.qxframe9a7c2-form-input-group-item:focus-within\{--_qxframe9a7c2-group-stack:4\}/,
  'InputGroup focus must resolve stacking through the private group-stack state channel.');

assert.equal(count('.qxframe9a7c2-card{'),1,'Card root must not be reopened as a late override.');
assert.match(css,/\.qxframe9a7c2-card\{[^}]*overflow:visible;/,
  'Card generic root must keep overflow:visible in its canonical owner.');
const card=pos('.qxframe9a7c2-card{');
const cardCorner=pos('.qxframe9a7c2-card>.qxframe9a7c2-card-cover:first-child{');
const descriptions=pos('.qxframe9a7c2-descriptions{');
assert.ok(card>=0 && cardCorner>card && cardCorner<descriptions,
  'Card direct-child cover corner correction must stay with the Card owner.');

assert.equal(css.includes('@layer'),false,'Phase F must not introduce @layer.');
assert.equal(css.includes(':is('),false,'Phase F must not introduce :is().');
assert.equal(css.includes(':where('),false,'Phase F must not introduce :where().');

console.log(JSON.stringify({
  ok:true,
  latePatchBucket:false,
  pickerOwner:true,
  tableOwner:true,
  inputGroupStateChannel:true,
  cardOwner:true
}));
