import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Upload } from '../src/components/upload.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/upload.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Upload.profile);
assert.equal(profile.name,'Upload');
assert.deepEqual(
  Object.keys(profile.ownership).sort(),
  ['capability','feedback','focus','form','interaction','overlay','selection','value'],
  'Upload must declare exactly V/F/I/C/S/O/B/R ownership.'
);
const expected={
  value:'ValueController',focus:'FocusController',interaction:'InteractionController',
  capability:'CapabilityController',selection:'SelectionController',overlay:'OverlayController',
  feedback:'FeedbackController',form:'FormController'
};
Object.entries(expected).forEach(([key,value])=>assert.equal(profile.ownership[key],value,'Upload '+key+' owner mismatch.'));

assert.match(source,/extends FieldComponent/,'Upload must inherit the shared FieldComponent V/F/I/C/B/R facade.');
assert.match(source,/bindCapabilityController\s*\(/,'Upload must bind CapabilityController.');
assert.match(source,/bindFocusController\s*\(/,'Upload must bind FocusController.');
assert.match(source,/bindInteractionController\s*\(/,'Upload keyboard activation must bind InteractionController.');
assert.match(source,/bindFeedbackProjector\s*\(/,'Upload visible task state must bind FeedbackController.');
assert.match(source,/SelectionController\.create\s*\(/,'Upload preview selection must use SelectionController.');
assert.match(source,/syncPreviewSelection\s*\(/,'Upload preview changes must project through SelectionController.');
assert.match(source,/OverlayController\.create\s*\(/,'Upload document preview must use OverlayController.');
assert.match(source,/Image\.createPreview\s*\(/,'Upload media preview must reuse the H-accepted Image preview controller family.');
assert.match(source,/api\.bindFormBridge\s*\(/,'Upload native form carrier must reuse FieldComponent/FormBridge.');
assert.doesNotMatch(source,/Control\.createFormFieldBridge\s*\(/,'Upload must not keep a second direct FormBridge setup path.');
assert.doesNotMatch(source,/getValue:\s*lifecycle\.getValue/,'Upload public committed value must not bypass FieldComponent ValueController.');
assert.match(source,/getValue:\s*function \(\) \{ return api\.value \|\| \[\]; \}/,'Upload public getValue must read FieldComponent committed value.');
assert.match(source,/detail && detail\.controlled === true && detail\.operation !== 'set-value'/,'Controlled add\/remove\/move proposals must not overwrite committed ValueController state.');
assert.match(source,/var canonical = controlledProposal \? \(api\.value \|\| \[\]\) : value/,'Upload set-value lifecycle events must synchronize the committed ValueController owner.');
assert.match(source,/source:own\(opts,'value'\) \? 'external' : 'component'/,'Initial controlled value must enter ValueController as external truth.');
assert.match(source,/capabilityController\.can\('open'\)/,'Upload open path must enter CapabilityController.');
assert.match(source,/capabilityController\.can\('select'\)/,'Upload add/drop path must enter CapabilityController.');
assert.match(source,/capabilityController\.can\('remove'\)/,'Upload remove path must enter CapabilityController.');

console.log(JSON.stringify({
  ok:true,
  component:'Upload',
  ownership:Object.values(expected),
  committedValueOwner:'ValueController',
  executionOwner:'UploadLifecycle',
  previewSelectionOwner:'SelectionController',
  formCarrier:'FieldComponent/FormBridge'
}));
