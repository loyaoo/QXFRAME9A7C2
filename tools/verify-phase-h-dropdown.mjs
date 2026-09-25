import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Dropdown } from '../src/components/dropdown.js';
import { PopupComponent } from '../src/components/popup.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/dropdown.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Dropdown.profile);

assert.equal(profile.name,'Dropdown');
assert.deepEqual(
  Object.keys(profile.ownership).sort(),
  ['capability','focus','interaction','motion','overlay','selection','value'],
  'Dropdown must declare exactly the handbook V/F/I/C/M/S/O target.'
);
assert.equal(profile.ownership.value,'ValueController');
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.motion,'MotionController');
assert.equal(profile.ownership.selection,'SelectionController');
assert.equal(profile.ownership.overlay,'OverlayController');

assert.ok(Dropdown.prototype instanceof PopupComponent,'Dropdown must continue to inherit PopupComponent/Trigger overlay authorities.');
assert.match(source,/ValueController\.createOptionValueBinding\s*\(/,'Dropdown value must enter canonical ValueController binding.');
assert.match(source,/valueState\.getValueController\s*\(/,'Dropdown must expose the canonical ValueController behind its binding.');
assert.match(source,/SelectionController\.create\s*\(/,'Dropdown selected values must enter SelectionController.');
assert.match(source,/selectionController\.createHierarchy\s*\(/,'Dropdown hierarchy selection semantics must share SelectionController facade.');
assert.match(source,/FocusController\.create\s*\(/,'Dropdown reference keyboard region must enter FocusController.');
assert.match(source,/getValueController\(\)/,'Dropdown must expose ValueController owner identity.');
assert.match(source,/getFocusController\(\)/,'Dropdown must expose FocusController owner identity.');
assert.match(source,/getSelectionController\(\)/,'Dropdown must expose SelectionController owner identity.');

assert.doesNotMatch(source,/import \{ Selection \} from '\.\.\/core\/selection\.js';/,'Dropdown must not directly own Selection.');
assert.doesNotMatch(source,/import \{ HierarchicalSelection \}/,'Dropdown must not bypass SelectionController for hierarchy semantics.');
assert.doesNotMatch(source,/import \{ KeyboardNavigation \}/,'Dropdown must not directly own KeyboardNavigation; FocusController owns the region.');
assert.doesNotMatch(source,/KeyboardNavigation\.create\s*\(/,'Dropdown must not construct KeyboardNavigation directly.');

for(const inherited of ['getInteractionController','getCapabilityController','getMotionController','getOverlayController']){
  assert.equal(typeof PopupComponent.prototype[inherited],'function','PopupComponent must expose inherited '+inherited+' for Dropdown.');
}

console.log(JSON.stringify({
  ok:true,
  component:'Dropdown',
  ownership:['ValueController','FocusController','InteractionController','CapabilityController','MotionController','SelectionController','OverlayController'],
  directSelectionOwner:false,
  directKeyboardOwner:false
}));
