import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Trigger } from '../src/components/trigger.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const triggerSource=read('src/components/trigger.js');
const overlayRuntimeSource=read('src/core/overlayRuntime.js');
const pressSource=read('src/core/pressInteraction.js');
const triggerInteractionSource=read('src/core/triggerInteraction.js');

const profile=ComponentProfile.define(Trigger.profile);
assert.equal(profile.name,'Trigger');
assert.deepEqual(
  Object.keys(profile.ownership).sort(),
  ['capability','focus','interaction','motion','overlay'],
  'Trigger must declare exactly the handbook F/I/C/M/O target.'
);
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.motion,'MotionController');
assert.equal(profile.ownership.overlay,'OverlayController');

assert.match(triggerSource,/CapabilityController\.create\s*\(/,'Trigger open/activation capability must enter CapabilityController.');
assert.match(triggerSource,/InteractionController\.create\s*\(/,'Trigger semantic key/action routing must enter InteractionController.');
assert.match(triggerSource,/OverlayController\.create\s*\(/,'Trigger popup resources must enter OverlayController.');
assert.match(triggerSource,/Transition\.create\s*\(/,'Trigger presence must stay on Transition→MotionController.');
assert.match(triggerSource,/capability\.can\('open'\)/,'Trigger open path must be gated by CapabilityController.');
assert.match(triggerSource,/capabilityController:\s*capability/,'TriggerInteraction must share Trigger CapabilityController.');
assert.match(triggerSource,/interactionController:\s*interactionController/,'TriggerInteraction must share Trigger InteractionController.');
assert.doesNotMatch(triggerSource,/\bInteractionPolicy\b/,'Trigger must not bypass CapabilityController through InteractionPolicy.');

assert.match(overlayRuntimeSource,/import \{ FocusController \} from '\.\/focusController\.js';/,'OverlayRuntime focus resources must enter FocusController.');
assert.match(overlayRuntimeSource,/FocusController\.createManager\s*\(/,'OverlayRuntime focus manager must be created by FocusController.');
assert.match(overlayRuntimeSource,/FocusController\.createScope\s*\(/,'OverlayRuntime focus scope must be created by FocusController.');
assert.match(overlayRuntimeSource,/FocusController\.normalizeScopeMode\s*\(/,'OverlayRuntime focus mode normalization must enter FocusController.');
assert.doesNotMatch(overlayRuntimeSource,/import \{ FocusManager \}/,'OverlayRuntime must not directly import FocusManager.');
assert.doesNotMatch(overlayRuntimeSource,/import \{ FocusScope \}/,'OverlayRuntime must not directly import FocusScope.');

assert.match(pressSource,/InteractionController\.create\s*\(/,'PressInteraction keyboard semantics must enter InteractionController.');
assert.match(pressSource,/interactionController\.registerScope\s*\(/,'PressInteraction must register a semantic action scope.');
assert.match(pressSource,/interactionController\.dispatch\s*\(/,'PressInteraction keydown must dispatch through InteractionController.');
assert.match(pressSource,/CapabilityController\.create\s*\(/,'PressInteraction capability policy must enter CapabilityController.');
assert.doesNotMatch(pressSource,/if \(key === 'Enter'[^\n]*press\(/,'PressInteraction must not own a parallel direct Enter→press semantic path.');

assert.match(triggerInteractionSource,/capabilityController:\s*settings\.capabilityController/,'TriggerInteraction must forward shared capability authority into PressInteraction.');
assert.match(triggerInteractionSource,/interactionController:\s*settings\.interactionController/,'TriggerInteraction must forward shared interaction authority into PressInteraction.');

console.log(JSON.stringify({
  ok:true,
  component:'Trigger',
  ownership:['FocusController','InteractionController','CapabilityController','MotionController','OverlayController'],
  directLegacyFocusImports:0,
  sharedPressControllers:true
}));
