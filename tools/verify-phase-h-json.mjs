import fs from 'node:fs';
import assert from 'node:assert/strict';
import { JSON as JSONComponent } from '../src/components/json.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/json.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(JSONComponent.profile);
const expected=['focus','interaction','capability','feedback'];
assert.equal(profile.name,'JSON');
assert.deepEqual(Object.keys(profile.ownership).sort(),expected.slice().sort());
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.feedback,'FeedbackController');

assert.match(source,/FocusController\.create\s*\(/,'JSON root keyboard region must enter FocusController.');
assert.doesNotMatch(source,/import \{ KeyboardRegion \}/,'JSON must not directly import KeyboardRegion.');
assert.doesNotMatch(source,/KeyboardRegion\.create\s*\(/,'JSON must not create KeyboardRegion directly.');
assert.match(source,/getKeyboardRegion: function \(\) \{ return focusController \? focusController\.getKeyboardRegion\(\) : null; \}/,'JSON compatibility KeyboardRegion accessor must forward through FocusController.');
assert.match(source,/CapabilityController\.create\s*\(/,'JSON edit/toolbar policy must enter CapabilityController.');
assert.match(source,/capabilityController\.can\('edit'\)/,'JSON edit start/commit must be capability gated.');
assert.match(source,/capabilityController\.can\('activate'\)/,'JSON toolbar activation must be capability gated.');
assert.match(source,/capabilityController\.can\('copy'\)/,'JSON copy must be capability gated.');
assert.match(source,/FeedbackController\.createForProjector\s*\(/,'JSON visible feedback must enter FeedbackController.');
assert.match(source,/getFocusController\(\)/,'JSON must expose FocusController.');
assert.match(source,/getCapabilityController\(\)/,'JSON must expose CapabilityController.');
assert.match(source,/getFeedbackController\(\)/,'JSON must expose FeedbackController.');

console.log(JSON.stringify({
  ok:true,
  component:'JSON',
  ownership:['FocusController','InteractionController','CapabilityController','FeedbackController'],
  keyboardOwner:'FocusController→KeyboardRegion→KeyboardNavigation→InteractionController.resolveKeyboardAction'
}));
