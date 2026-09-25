import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Menu } from '../src/components/menu.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/menu.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Menu.profile);

assert.equal(profile.name,'Menu');
assert.deepEqual(
  Object.keys(profile.ownership).sort(),
  ['capability','focus','interaction','overlay','selection','value'],
  'Menu must declare exactly the handbook V/F/I/C/S/O target.'
);
assert.equal(profile.ownership.value,'ValueController');
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.selection,'SelectionController');
assert.equal(profile.ownership.overlay,'OverlayController');

assert.match(source,/ValueController\.create\s*\(/,'Menu selectedKey(s) canonical state must enter ValueController.');
assert.match(source,/SelectionController\.create\s*\(/,'Menu selection projection must enter SelectionController.');
assert.match(source,/CapabilityController\.create\s*\(/,'Menu disabled/activation policy must enter CapabilityController.');
assert.match(source,/FocusController\.create\s*\(/,'Menu virtual focus must remain FocusController-owned.');
assert.match(source,/InteractionController\.create\s*\(/,'Menu semantic keyboard actions must remain InteractionController-owned.');
assert.match(source,/capability:capabilityController/,'Menu InteractionController scope must share CapabilityController.');
assert.match(source,/Trigger\.create\s*\(/,'Menu popup submenus must continue through Trigger→OverlayController.');
assert.match(source,/getValueController\(\)/,'Menu must expose canonical ValueController identity.');
assert.match(source,/getSelectionController\(\)/,'Menu must expose SelectionController identity.');
assert.match(source,/getCapabilityController\(\)/,'Menu must expose CapabilityController identity.');
assert.match(source,/getOverlayControllers\(\)/,'Menu must expose Trigger overlay controller identities.');

assert.doesNotMatch(source,/import \{ Selection \} from '\.\.\/core\/selection\.js';/,'Menu must not directly own Selection.');
assert.doesNotMatch(source,/Selection\.create\s*\(/,'Menu must not construct Selection directly.');
assert.doesNotMatch(source,/\bInteractionPolicy\b/,'Menu must not bypass CapabilityController through InteractionPolicy.');

console.log(JSON.stringify({
  ok:true,
  component:'Menu',
  ownership:['ValueController','FocusController','InteractionController','CapabilityController','SelectionController','OverlayController'],
  directSelectionOwner:false
}));
