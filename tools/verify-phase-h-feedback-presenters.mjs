import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { FeedbackController } from '../src/core/feedbackController.js';
import { Progress } from '../src/components/progress.js';
import { Result } from '../src/components/result.js';
import { Loading } from '../src/components/loading.js';

function ownershipOf(type,name,expected){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(Object.keys(profile.ownership).sort(),expected.slice().sort());
  return profile;
}
let profile=ownershipOf(Progress,'Progress',['feedback']);
assert.equal(profile.ownership.feedback,'FeedbackController');
assert.equal(typeof Progress.prototype.createFeedbackController,'function');

profile=ownershipOf(Result,'Result',['feedback']);
assert.equal(profile.ownership.feedback,'FeedbackController');
assert.equal(typeof Result.prototype.createFeedbackController,'function');

profile=ownershipOf(Loading,'Loading',['capability','motion','overlay','feedback']);
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.motion,'MotionController');
assert.equal(profile.ownership.overlay,'OverlayController');
assert.equal(profile.ownership.feedback,'FeedbackController');
assert.equal(typeof Loading.prototype.createFeedbackController,'function');
assert.equal(typeof Loading.prototype.getCapabilityController,'function');
assert.equal(typeof Loading.prototype.getMotionController,'function');
assert.equal(typeof Loading.prototype.getOverlayController,'function');

const projectorLog=[];
const controller=FeedbackController.createForProjector({
  show(record){projectorLog.push(['show',record.status,record.progress]);return {id:record.identity};},
  update(handle,record){projectorLog.push(['update',record.status,record.progress]);return handle;},
  close(_handle,record,reason){projectorLog.push(['close',record.status,reason]);return true;}
},{ownerId:'presenter-test'},'local');
let result=controller.publish({operation:'load',requestId:'r1',status:'pending',progress:10});
assert.equal(result.status,'applied');
result=controller.publish({operation:'load',requestId:'r1',status:'progress',progress:50});
assert.equal(result.status,'applied');
result=controller.publish({operation:'load',requestId:'r1',status:'idle'});
assert.equal(result.status,'applied');
assert.deepEqual(projectorLog.map(entry=>entry[0]),['show','update','close']);
controller.destroy();

const loadingSource=fs.readFileSync(new URL('../src/components/loading.js',import.meta.url),'utf8');
assert.match(loadingSource,/CapabilityController\.create\s*\(/,'Loading must consume CapabilityController, not only declare it.');
assert.match(loadingSource,/record\.capability\.can\('open'\)/,'Loading open path must enter CapabilityController.');
assert.match(loadingSource,/FeedbackController\.createForProjector\s*\(/,'Loading must bind visible feedback through FeedbackController.');
for(const file of ['progress.js','result.js']){
  const source=fs.readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8');
  assert.match(source,/FeedbackController\.createForProjector\s*\(/,file+' must bind through FeedbackController.');
}

console.log(JSON.stringify({
  ok:true,
  presenters:['Progress','Result','Loading'],
  profileCoverageAdded:3,
  loadingControllers:['CapabilityController','MotionController','OverlayController','FeedbackController']
}));
