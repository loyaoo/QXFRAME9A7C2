import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { OverlayController } from '../src/core/overlayController.js';
import { Tooltip } from '../src/components/tooltip.js';
import { Popover } from '../src/components/popover.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const tooltipSource=read('src/components/tooltip.js');
const popupSource=read('src/components/popup.js');
const popoverSource=read('src/components/popover.js');

let profile=ComponentProfile.define(Tooltip.profile);
assert.equal(profile.name,'Tooltip');
assert.deepEqual(Object.keys(profile.ownership).sort(),['motion','overlay']);
assert.equal(profile.ownership.motion,'MotionController');
assert.equal(profile.ownership.overlay,'OverlayController');

profile=ComponentProfile.define(Popover.profile);
assert.equal(profile.name,'Popover');
assert.deepEqual(Object.keys(profile.ownership).sort(),['capability','focus','interaction','motion','overlay']);
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.motion,'MotionController');
assert.equal(profile.ownership.overlay,'OverlayController');

assert.doesNotMatch(tooltipSource,/\bLayerManager\b/,'Tooltip must not bypass OverlayController for layer singleton/parent lookup.');
assert.match(tooltipSource,/OverlayController\.findParentLayerId\s*\(/,'Tooltip parent-layer lookup must enter OverlayController.');
assert.match(tooltipSource,/OverlayController\.acquireSingleton\s*\(/,'Tooltip singleton allocation must enter OverlayController.');
assert.match(tooltipSource,/Trigger\.create\s*\(/,'Tooltip visible overlay/motion remains Trigger-owned.');

assert.match(popoverSource,/setupPopupRuntime\s*\(/,'Popover must enter the shared PopupComponent→Trigger runtime.');
assert.match(popupSource,/getInteractionController\s*\(\)/,'PopupComponent must expose inherited InteractionController.');
assert.match(popupSource,/getCapabilityController\s*\(\)/,'PopupComponent must expose inherited CapabilityController.');
assert.match(popupSource,/getOverlayController\s*\(\)/,'PopupComponent must expose inherited OverlayController.');
assert.match(popupSource,/getMotionController\s*\(\)/,'PopupComponent must expose inherited MotionController.');

const calls=[];
const fakeManager={
  findParentId(target){calls.push(['parent',target]);return 'parent-layer';},
  acquireSingleton(options){calls.push(['singleton',options]);return {value:{ok:true},release(){return true;}};},
  register(){throw new Error('unexpected register');}
};
const target={nodeType:1,ownerDocument:{}};
assert.equal(OverlayController.findParentLayerId(target,{layerManager:fakeManager}),'parent-layer');
const lease=OverlayController.acquireSingleton({
  layerManager:fakeManager,target,type:'Tooltip',group:'shared',parentId:'parent-layer',
  create:()=>({ok:true})
});
assert.equal(lease.value.ok,true);
assert.equal(calls[1][0],'singleton');
assert.equal(calls[1][1].type,'Tooltip');
assert.equal(calls[1][1].group,'shared');

console.log(JSON.stringify({
  ok:true,
  components:['Tooltip','Popover'],
  tooltipOwnership:['MotionController','OverlayController'],
  popoverOwnership:['FocusController','InteractionController','CapabilityController','MotionController','OverlayController'],
  directTooltipLayerManager:0
}));
