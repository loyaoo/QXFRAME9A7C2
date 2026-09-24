import fs from 'node:fs';
import assert from 'node:assert/strict';
import { OverlayController } from '../src/core/overlayController.js';
import { Message } from '../src/components/message.js';
import { Notification } from '../src/components/notification.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const noticeSource=fs.readFileSync(new URL('../src/core/noticeService.js',import.meta.url),'utf8');
assert.doesNotMatch(noticeSource,/\bLayerManager\b/,'NoticeService must not bypass OverlayController for layer ownership.');
assert.match(noticeSource,/OverlayController\.createLayerLease\s*\(/,'NoticeService must acquire notice layers through OverlayController.');
assert.equal(typeof OverlayController.createLayerLease,'function');

const calls=[];
const fakeHandle={
  update(next){calls.push(['update',next]);return true;},
  bringToFront(){calls.push(['front']);return true;},
  getZIndex(){return 4321;},
  getState(){return {id:'notice-lease'};},
  destroy(){calls.push(['destroy']);return true;}
};
const fakeManager={
  register(element,options){calls.push(['register',element,options]);return fakeHandle;}
};
const element={nodeType:1,ownerDocument:{}};
const lease=OverlayController.createLayerLease({
  element,
  document:element.ownerDocument,
  layerManager:fakeManager,
  id:'notice-lease',
  kind:'notice',
  componentType:'message',
  zIndexOffset:7
});
assert.equal(calls[0][0],'register');
assert.equal(calls[0][2].kind,'notice');
assert.equal(calls[0][2].componentType,'message');
assert.equal(calls[0][2].zIndexOffset,7);
assert.equal(lease.getZIndex(),4321);
assert.equal(lease.update({zIndexOffset:9}),lease);
assert.equal(calls.at(-1)[0],'update');
assert.equal(lease.bringToFront(),true);
assert.equal(lease.destroy(),true);
assert.equal(lease.destroy(),false,'layer lease destroy must be idempotent');

function assertProfile(api,name){
  const profile=ComponentProfile.define(api.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(Object.keys(profile.ownership).sort(),['feedback','motion','overlay']);
  assert.equal(profile.ownership.motion,'MotionController');
  assert.equal(profile.ownership.overlay,'OverlayController');
  assert.equal(profile.ownership.feedback,'FeedbackController');
  assert.ok(profile.motion&&profile.overlay&&profile.feedback);
  assert.equal(typeof api.createFeedbackController,'function');
}
assertProfile(Message,'Message');
assertProfile(Notification,'Notification');

const log=[];
const channel={
  create(payload){
    log.push(['create',payload]);
    return {
      updateOptions(next){log.push(['update',next]);return this;},
      close(reason){log.push(['close',reason]);return true;}
    };
  },
  close(){return true;}
};
const projector=(await import('../src/core/feedbackController.js')).FeedbackController.createNoticeProjector(channel);
const feedback=(await import('../src/core/feedbackController.js')).FeedbackController.create({ownerId:'verify-notice',globalProjector:projector});
let result=feedback.publish({operation:'load',status:'pending',message:'Loading',requestId:'req-1',target:'global'});
assert.equal(result.status,'applied');
result=feedback.publish({operation:'load',status:'success',message:'Ready',requestId:'req-1',target:'global'});
assert.equal(result.status,'applied');
assert.deepEqual(log.map(entry=>entry[0]),['create','update'],'same operation identity must update one notice instead of duplicating it');
feedback.destroy();

console.log(JSON.stringify({
  ok:true,
  noticeLayerOwner:'OverlayController',
  messageProfile:['MotionController','OverlayController','FeedbackController'],
  notificationProfile:['MotionController','OverlayController','FeedbackController'],
  identityUpdate:true
}));
