import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Steps } from '../src/components/steps.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/steps.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Steps.profile);
const expected=['value','focus','interaction','capability','feedback'];
assert.equal(profile.name,'Steps');
assert.deepEqual(Object.keys(profile.ownership).sort(),expected.slice().sort());
assert.equal(profile.ownership.value,'ValueController');
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.feedback,'FeedbackController');

assert.match(source,/StateController\.create\s*\(/,'Steps current must enter StateController→ValueController.');
assert.match(source,/getValueController\(\) \{ return recordFor\(this\)\.valueState; \}/,'Steps must expose the canonical ValueController.');
assert.match(source,/FocusController\.create\s*\(/,'Steps navigation must enter FocusController.');
assert.doesNotMatch(source,/import \{ KeyboardNavigation \}/,'Steps must not directly import KeyboardNavigation.');
assert.doesNotMatch(source,/KeyboardNavigation\.create\s*\(/,'Steps must not create KeyboardNavigation directly.');
assert.match(source,/CapabilityController\.create\s*\(/,'Steps interaction policy must enter CapabilityController.');
assert.match(source,/capabilityController\.can\('navigate'\)/,'Steps keyboard navigation must be capability gated.');
assert.match(source,/capabilityController\.can\('activate'\)/,'Steps click activation must be capability gated.');
assert.match(source,/FeedbackController\.createForProjector\s*\(/,'Steps visible feedback must enter FeedbackController.');
assert.match(source,/getFeedbackController\(\)/,'Steps must expose its FeedbackController.');

console.log(JSON.stringify({
  ok:true,
  component:'Steps',
  ownership:['ValueController','FocusController','InteractionController','CapabilityController','FeedbackController'],
  keyboardOwner:'FocusController→KeyboardRegion→KeyboardNavigation→InteractionController.resolveKeyboardAction'
}));
