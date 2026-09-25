import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Popconfirm } from '../src/components/popconfirm.js';

const source=fs.readFileSync(new URL('../src/components/popconfirm.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Popconfirm.profile);
assert.equal(profile.name,'Popconfirm');
assert.deepEqual(
  Object.keys(profile.ownership).sort(),
  ['capability','feedback','focus','interaction','motion','overlay'],
  'Popconfirm must declare exactly handbook F/I/C/M/O/B ownership.'
);
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.motion,'MotionController');
assert.equal(profile.ownership.overlay,'OverlayController');
assert.equal(profile.ownership.feedback,'FeedbackController');

assert.match(source,/AsyncAction\.create\s*\(/,'AsyncAction must remain the async confirm task owner.');
assert.match(source,/CapabilityController\.create\s*\(/,'Popconfirm confirm/cancel availability must enter CapabilityController.');
assert.match(source,/actionCapability\.can\('activate'\)/,'Popconfirm action guards must query CapabilityController.');
assert.match(source,/FeedbackController\.createForProjector\s*\(/,'Popconfirm visible async feedback must enter FeedbackController.');
assert.match(source,/onStateChange:\(snapshot,detail\)=>\{ this\.#publishActionFeedback/,'AsyncAction state must project through FeedbackController.');
assert.doesNotMatch(source,/const pending=.*action.*snapshot\(\).*classList\.toggle\('is-loading'/s,'Popconfirm view sync must not own a second pending→loading projection.');
assert.match(source,/createActionFeedbackProjector[\s\S]*classList\.toggle\('is-loading', pending\)/,'Feedback projector must be the visible loading-state owner.');
assert.match(source,/getFeedbackController\(\)/,'Popconfirm must expose its FeedbackController.');
assert.match(source,/getActionCapabilityController\(\)/,'Popconfirm must expose its action CapabilityController.');
assert.match(source,/Popover\.create\s*\(/,'Popconfirm popup F/I/C/M/O path must remain inherited through Popover→Trigger.');

console.log(JSON.stringify({
  ok:true,
  component:'Popconfirm',
  ownership:['FocusController','InteractionController','CapabilityController','MotionController','OverlayController','FeedbackController'],
  asyncOwner:'AsyncAction',
  visibleFeedbackOwner:'FeedbackController'
}));
