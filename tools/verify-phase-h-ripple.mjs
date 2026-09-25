import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Ripple } from '../src/components/ripple.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/ripple.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Ripple.profile);
assert.equal(profile.name,'Ripple');
assert.deepEqual(Object.keys(profile.ownership).sort(),['capability','interaction','motion']);
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.motion,'MotionController');

assert.match(source,/PressInteraction\.create\s*\(/,'Ripple press semantics must remain on PressInteraction.');
assert.match(source,/pressInteraction\.getInteractionController\(\)/,'Ripple must expose PressInteraction shared InteractionController.');
assert.match(source,/pressInteraction\.getCapabilityController\(\)/,'Ripple must expose PressInteraction shared CapabilityController.');
assert.match(source,/MotionController\.waitMotionEnd\s*\(/,'Ripple CSS animation lifecycle must enter MotionController.');
assert.doesNotMatch(source,/DOM\.listen\(wave,\s*['"]animationend['"]/,'Ripple must not own a parallel raw animationend wait path.');
assert.doesNotMatch(source,/addEventListener\(['"]animationend['"]/,'Ripple must not own a parallel raw animationend wait path.');

console.log(JSON.stringify({
  ok:true,
  component:'Ripple',
  ownership:['InteractionController','CapabilityController','MotionController'],
  pressAuthority:'PressInteraction',
  motionWaitAuthority:'MotionController.waitMotionEnd'
}));
