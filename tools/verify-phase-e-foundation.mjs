import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { MotionController } from '../src/core/motionController.js';
import { OverlayController } from '../src/core/overlayController.js';

const __filename=fileURLToPath(import.meta.url);
const root=path.resolve(path.dirname(__filename),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const motionControllerSource=read('src/core/motionController.js');
const overlayControllerSource=read('src/core/overlayController.js');
const motionSource=read('src/core/motion.js');
const transitionSource=read('src/core/transition.js');
const triggerSource=read('src/components/trigger.js');
const coreIndex=read('src/core/index.js');

assert.match(motionControllerSource,/from ['"]\.\/motion\.js['"]/,'MotionController must delegate to MotionCore.');
assert.doesNotMatch(motionControllerSource,/var\s+generation\s*=/,'MotionController must not create a second generation authority.');
assert.match(overlayControllerSource,/from ['"]\.\/overlayRuntime\.js['"]/,'OverlayController must delegate to OverlayRuntime.');
assert.doesNotMatch(overlayControllerSource,/OpenStateBridge|\bopened\s*=/,'OverlayController must not own logical open state.');
assert.match(motionSource,/generation:\s*generation/,'MotionCore must expose its canonical generation through state.');
assert.match(motionSource,/function cancel\(meta\)/,'MotionCore must expose bounded cancellation without a second timer.');
assert.match(transitionSource,/MotionController\.create\s*\(/,'Transition must be a compatibility facade over MotionController.');
assert.doesNotMatch(transitionSource,/from ['"]\.\/motion\.js['"]/,'Transition must not bypass MotionController.');
assert.match(triggerSource,/OverlayController\.create\s*\(/,'Trigger must enter overlay resources through OverlayController.');
assert.doesNotMatch(triggerSource,/from ['"]\.\.\/core\/overlayRuntime\.js['"]/,'Trigger must not bypass OverlayController.');
assert.match(triggerSource,/getOverlayController/,'Trigger must expose OverlayController identity.');
assert.match(triggerSource,/getMotionController/,'Trigger must expose MotionController identity.');
assert.match(coreIndex,/export \{ MotionController \}/,'MotionController must be exported from core/index.');
assert.match(coreIndex,/export \{ OverlayController \}/,'OverlayController must be exported from core/index.');

let visible=false,generation=0,destroyed=false;
const fakeCore={
  setVisible(value){visible=value===true;generation+=1;return true;},
  cancel(){return true;},
  getState(){return Object.freeze({visible,generation,destroyed});},
  whenSettled(){return Promise.resolve(this.getState());},
  destroy(){destroyed=true;return true;}
};
const motion=MotionController.create({core:fakeCore,ownsCore:false});
assert.equal(motion.getCore(),fakeCore);
assert.equal(motion.show({reason:'test'}),true);
assert.equal(motion.getState().visible,true);
const firstGeneration=motion.getState().generation;
assert.equal(motion.reverse({reason:'reverse'}),true);
assert.equal(motion.getState().visible,false);
assert.ok(motion.getState().generation>firstGeneration);
assert.equal(motion.cancel({reason:'cancel'}),true);
assert.equal(motion.destroy(),false,'Borrowed MotionCore must not be destroyed by the facade.');

let active=false,runtimeDestroyed=false;
const fakeRuntime={
  mount(){return true;},
  activate(){active=true;return true;},
  activateInteraction(){return true;},
  deactivateInteraction(){return true;},
  deactivate(){active=false;return true;},
  updatePosition(){return true;},
  preparePosition(){return Promise.resolve(null);},
  setPositionSuspended(){return true;},
  updateOptions(){return this;},
  getState(){return Object.freeze({active,destroyed:runtimeDestroyed});},
  destroy(){runtimeDestroyed=true;return true;}
};
const overlay=OverlayController.create({runtime:fakeRuntime,ownsRuntime:false});
assert.equal(overlay.getRuntime(),fakeRuntime);
assert.equal(overlay.activate({reason:'test'}),true);
assert.equal(overlay.getState().active,true);
assert.equal(overlay.deactivate({reason:'test'}),true);
assert.equal(overlay.getState().active,false);
assert.equal(overlay.destroy(),false,'Borrowed OverlayRuntime must not be destroyed by the facade.');
assert.equal(OverlayController.normalizeReason('outside'),'outside-pointer');
assert.equal(OverlayController.normalizeReason('parent-teardown'),'ancestor-close');
assert.equal(OverlayController.normalizeReason('api'),'programmatic');

console.log(JSON.stringify({ok:true,motionController:true,overlayController:true,triggerFacade:true,noDuplicateGeneration:true,noOpenOwner:true}));
