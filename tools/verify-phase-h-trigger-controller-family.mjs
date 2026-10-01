import { readCanonicalStyleSource } from './style-source.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Trigger } from '../src/components/trigger.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const triggerSource=read('src/components/trigger.js');
const overlayRuntimeSource=read('src/core/overlayRuntime.js');
const pressSource=read('src/core/pressInteraction.js');
const triggerInteractionSource=read('src/core/triggerInteraction.js');
const cssSource=readCanonicalStyleSource({root});

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
assert.match(triggerSource,/beginPositioningGate\(\);[\s\S]*surface\.show\(info\);[\s\S]*runtime\.activate/,'Trigger must keep the floating surface invisible while the first placement is prepared.');
assert.match(triggerSource,/beginPositioningMeasure\(\);[\s\S]*runtime\.preparePosition\('motion-enter-prepare'\)/,'Trigger first placement must be measured without the entry motion transform.');
assert.match(triggerSource,/clearPositioningMeasure\(\);[\s\S]*clearPositioningGate\(\);/,'Trigger must reveal only after full-size placement measurement completes.');
assert.match(cssSource,/\.qxframe9a7c2-trigger-positioning\{visibility:hidden!important;pointer-events:none!important\}/,'Trigger positioning gate must remain measurable but invisible.');
assert.match(cssSource,/\.qxframe9a7c2-trigger-positioning-measure\{transform:none!important\}/,'Trigger positioning measure must neutralize popup scale/translate transforms.');
assert.match(cssSource,/\[data-placement="bottom-start"\]\[class\*="qxframe9a7c2-motion-popup-placement-"\]\{transform-origin:0 0\}/,'bottom-start popup motion must stay anchored to the reference start edge.');
assert.match(cssSource,/\[data-placement="bottom-end"\]\[class\*="qxframe9a7c2-motion-popup-placement-"\]\{transform-origin:100% 0\}/,'bottom-end popup motion must stay anchored to the reference end edge.');

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
