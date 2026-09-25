import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Table } from '../src/components/table.js';

const source=fs.readFileSync(new URL('../src/components/table.js',import.meta.url),'utf8');
const modelSource=fs.readFileSync(new URL('../src/core/tableModel.js',import.meta.url),'utf8');
const profile=ComponentProfile.define(Table.profile);
assert.equal(profile.name,'Table');
assert.deepEqual(
  Object.keys(profile.ownership).sort(),
  ['capability','feedback','focus','form','interaction','overlay','selection','value']
);
assert.equal(profile.ownership.value,'ValueController');
assert.equal(profile.ownership.focus,'FocusController');
assert.equal(profile.ownership.interaction,'InteractionController');
assert.equal(profile.ownership.capability,'CapabilityController');
assert.equal(profile.ownership.selection,'SelectionController');
assert.equal(profile.ownership.overlay,'OverlayController');
assert.equal(profile.ownership.feedback,'FeedbackController');
assert.equal(profile.ownership.form,'FormController');

assert.match(source,/ValueController\.createValueBinding\s*\(/,'Table committed explicit selection must enter ValueController.');
assert.match(source,/selectedKeys:\s*valueBinding\.value/,'TableModel must initialize explicit selection from the canonical ValueController.');
assert.match(source,/syncCommittedSelection\s*\(/,'Table selection projection must synchronize through the canonical ValueController.');
assert.match(modelSource,/if\s*\(result\s*&&\s*detail\.silent\s*===\s*true\)\s*\{[\s\S]{0,220}invalidateProjection\(['"]state['"]\)/,'TableModel silent selection reconcile must invalidate cached projection so controlled rollback cannot expose stale selected keys.');
assert.match(source,/valueBinding\.write\(normalized,[\s\S]{0,180},controlled\)/,'Controlled Table selection must use the ValueController proposal path instead of mutating committed value.');
assert.match(source,/model\.setSelectedKeys\(initialSelectedValue\.slice\(\),\{ source:'form', reason:'reset-request'/,'Controlled Table reset must propose the initial committed selection through the normal selection path.');
assert.doesNotMatch(source,/valueBinding\.write\(initialSelectedValue/,'Controlled Table reset must not write the committed ValueController directly.');
assert.match(source,/SelectionController/,'Table must retain SelectionController as selection execution/projection authority.');
assert.match(source,/getRemoteChannel\(['"]allMatching['"]\)/,'Table remote allMatching must remain a separate SelectionController channel.');
assert.doesNotMatch(source,/valueBinding[^\n]{0,120}allMatching|allMatching[^\n]{0,120}valueBinding/,'Remote allMatching must never become committed Table value.');

assert.match(source,/getOverlayController:function\(\)\{return filterTrigger&&filterTrigger\.getOverlayController/,'Table overlay owner must delegate to the existing filter Trigger.');
assert.doesNotMatch(source,/OverlayController\.create\s*\(/,'Table must not create a second overlay owner beside filter Trigger.');

assert.match(source,/FeedbackController\.createForProjector\s*\(/,'Table loading/error visual feedback must enter FeedbackController.');
assert.match(source,/remoteProcessing\s*=\s*state\.state\s*===\s*['"]pending['"]/,'Remote AsyncTask must remain the processing execution authority.');
assert.match(source,/remoteError\s*=\s*state\.state\s*===\s*['"]error['"]/,'Remote AsyncTask must remain the error execution authority.');

assert.match(source,/FormBridge\.create\s*\(/,'Table native form carrier must remain FormBridge.');
assert.match(source,/FormController\.bindField\s*\(/,'Table form transaction registration must enter FormController.');
assert.match(source,/getSerializedValue:function\(\)\{return formBridge\?formBridge\.getSerializedValue\(\):valueBinding\.value\.slice\(\);\}/,'Table form serialization must read the same committed ValueController value.');
assert.match(source,/OperationResult\.requested\s*\(/,'Controlled Table reset must remain a proposal until external owner acknowledgement.');
assert.match(source,/targetValue:initialSelectedValue\.slice\(\)/,'Controlled reset result must expose the initial committed reset target.');

assert.equal(typeof Table.prototype.getValueController,'function');
assert.equal(typeof Table.prototype.getSelectionController,'function');
assert.equal(typeof Table.prototype.getOverlayController,'function');
assert.equal(typeof Table.prototype.getFeedbackController,'function');
assert.equal(typeof Table.prototype.bindFormController,'function');
assert.equal(typeof Table.prototype.getFormBridge,'function');

console.log(JSON.stringify({
  ok:true,
  component:'Table',
  ownership:['ValueController','FocusController','InteractionController','CapabilityController','SelectionController','OverlayController','FeedbackController','FormController'],
  committedValue:'explicit-selected-keys',
  remoteAllMatching:'selection-only',
  formValue:'canonical-committed-selection'
}));
