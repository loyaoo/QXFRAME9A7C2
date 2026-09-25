import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Modal } from '../src/components/modal.js';
import { Drawer } from '../src/components/drawer.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const shell=read('src/core/overlayFrameShell.js');
const modal=read('src/components/modal.js');
const drawer=read('src/components/drawer.js');

function assertOverlayProfile(type,name){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(
    Object.keys(profile.ownership).sort(),
    ['capability','feedback','focus','interaction','motion','overlay'],
    name+' must declare exactly handbook F/I/C/M/O/B ownership.'
  );
  assert.equal(profile.ownership.focus,'FocusController');
  assert.equal(profile.ownership.interaction,'InteractionController');
  assert.equal(profile.ownership.capability,'CapabilityController');
  assert.equal(profile.ownership.motion,'MotionController');
  assert.equal(profile.ownership.overlay,'OverlayController');
  assert.equal(profile.ownership.feedback,'FeedbackController');
}
assertOverlayProfile(Modal,'Modal');
assertOverlayProfile(Drawer,'Drawer');

assert.match(shell,/InteractionController\.create\s*\(/,'OverlayFrameShell must own one shared InteractionController for frame actions.');
assert.match(shell,/PressInteraction\.create\s*\(/,'OverlayFrameShell actions must enter PressInteraction.');
assert.match(shell,/interactionController:interactionController/,'Frame action PressInteractions must share the shell InteractionController.');
assert.match(shell,/FeedbackController\.createForProjector\s*\(/,'Async overlay action loading must project through FeedbackController.');
assert.match(shell,/onStateChange:function\(state,detail\)\{[^}]*publishFeedback/s,'AsyncAction state must publish through FeedbackController.');
assert.doesNotMatch(shell,/onStateChange:function\(state\)\{[^}]*setLoading\(state\.pending/s,'OverlayFrameShell must not retain direct AsyncAction pending→loading projection.');
assert.doesNotMatch(shell,/DOM\.listen\(element,'click'/,'Footer action activation must not keep the old direct click listener.');
assert.match(shell,/getInteractionController:function\(\)\{return interactionController;\}/,'OverlayFrameShell must expose its shared InteractionController.');
assert.match(shell,/getCapabilityControllers:function\(\)/,'OverlayFrameShell must expose action CapabilityControllers.');
assert.match(shell,/getFeedbackControllers:function\(\)/,'OverlayFrameShell must expose action FeedbackControllers.');

for(const [name,source] of [['Modal',modal],['Drawer',drawer]]){
  assert.match(source,/OverlayController\.create\s*\(/,name+' must retain OverlayController resource ownership.');
  assert.match(source,/Transition\.create\s*\(/,name+' must retain Transition→MotionController presence ownership.');
  assert.match(source,/getInteractionController: function \(\) \{ return frameShell\.getInteractionController\(\); \}/,name+' must expose shared frame interaction authority.');
  assert.match(source,/getCapabilityControllers: function \(\) \{ return frameShell\.getCapabilityControllers\(\); \}/,name+' must expose frame capabilities.');
  assert.match(source,/getFeedbackControllers: function \(\) \{ return frameShell\.getFeedbackControllers\(\); \}/,name+' must expose frame feedback projectors.');
  assert.doesNotMatch(source,/DOM\.listen\(closeButton,\s*'click'/,name+' must not keep a duplicate close-button click owner.');
}

console.log(JSON.stringify({
  ok:true,
  components:['Modal','Drawer'],
  ownership:['FocusController','InteractionController','CapabilityController','MotionController','OverlayController','FeedbackController'],
  sharedActionShell:true
}));
