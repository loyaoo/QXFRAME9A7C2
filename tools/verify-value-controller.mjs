import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ValueController } from '../src/core/valueController.js';
import { PickerSession } from '../src/core/pickerSession.js';

assert.equal(fs.existsSync(new URL('../src/core/valueDraft.js',import.meta.url)),false,'ValueDraft compatibility alias must be removed before production.');
assert.equal(fs.existsSync(new URL('../src/core/stateController.js',import.meta.url)),false,'StateController compatibility alias must be removed before production.');

const controller=ValueController.create({value:'A'});
assert.equal(controller.value,'A');
assert.equal(controller.revision,0);
assert.deepEqual(controller.projection({open:false}),{channel:'committed',value:'A',revision:0});
controller.begin({silent:true,source:'popup',reason:'open'});
assert.equal(controller.sessionActive,true);
controller.setDraft('B',{source:'keyboard',reason:'select'});
assert.equal(controller.value,'A');
assert.equal(controller.draftValue,'B');
assert.equal(controller.projection({open:true}).channel,'draft');
assert.equal(controller.projection({open:true}).value,'B');
controller.setPreview('C',{silent:true,source:'pointer',reason:'hover'});
assert.equal(controller.projection({open:true,previewControl:false}).value,'B');
assert.equal(controller.projection({open:true,previewControl:true}).value,'C');
controller.setRawInput('12:34',{silent:true,active:true,source:'input',reason:'typing'});
assert.equal(controller.projection({open:true,previewControl:true}).channel,'rawInput');
assert.equal(controller.projection({open:true,previewControl:true}).value,'12:34');
controller.setRawInput('12:34',{silent:true,active:false});
assert.equal(controller.projection({open:true,previewControl:true}).channel,'preview');
controller.setRawInput('typed',{silent:true,active:true,source:'input'});
const revisionBeforeLeaseRelease=controller.revision;
controller.setDraft(controller.draftValue,{silent:true,source:'keyboard',reason:'same-selection'});
assert.equal(controller.rawInputActive,false,'a non-input selection must release the raw-input display lease even when draft value is unchanged.');
assert.ok(controller.revision>revisionBeforeLeaseRelease,'channel ownership changes must advance revision.');
controller.clearPreview({silent:true});
assert.equal(controller.projection({open:true}).channel,'draft');
assert.equal(controller.commit({source:'keyboard',reason:'confirm'}),true);
assert.equal(controller.value,'B');
assert.equal(controller.dirty,false);

const immediateSession=PickerSession.create({controller,needConfirm:false});
immediateSession.open({source:'popup',reason:'open'});
controller.setDraft('C',{silent:true});
immediateSession.close({source:'keyboard',reason:'escape'});
assert.equal(controller.value,'B','close must not secretly commit an immediate-mode dirty draft.');
assert.equal(controller.draftValue,'B','uncommitted close must roll back the dirty draft.');
assert.equal(controller.sessionActive,false);

immediateSession.open({source:'popup',reason:'open'});
controller.setDraft('D',{silent:true});
assert.equal(immediateSession.commit({source:'keyboard',reason:'select-commit'}),true);
immediateSession.close({source:'pointer',reason:'select'});
assert.equal(controller.value,'D','explicit selection-complete commit must survive close.');

const confirmController=ValueController.create({value:'X'});
const confirmSession=PickerSession.create({controller:confirmController,needConfirm:true});
confirmSession.open({source:'popup',reason:'open'});
confirmController.setDraft('Y',{silent:true});
confirmSession.close({source:'keyboard',reason:'escape'});
assert.equal(confirmController.value,'X');
assert.equal(confirmController.draftValue,'X');

confirmController.destroy();
controller.destroy();

/* Core integrity regressions: exactly-once normalize, stable reset baseline, copied public values, reentrant callback stale guard. */
let normalizeCalls=0;
const binding=ValueController.createOptionValueBinding({defaultValue:1},{},function(value){normalizeCalls+=1;return Number(value)+1;});
assert.equal(binding.value,2,'option binding initialization must normalize exactly once.');
assert.equal(normalizeCalls,1);
assert.equal(binding.write(2,{source:'test',reason:'normalize-once'}),true);
assert.equal(binding.value,3);
assert.equal(normalizeCalls,2,'binding write must normalize exactly once.');
binding.destroy();

let shift=1;
const resetController=ValueController.create({
  value:1,
  normalizeValue(value){return Number(value)+shift;}
});
assert.equal(resetController.value,2);
resetController.setValue(5,{silent:true});
assert.equal(resetController.value,6);
shift=100;
resetController.updateOptions({normalizeValue(value){return Number(value)+shift;}});
resetController.reset({silent:true});
assert.equal(resetController.value,2,'reset must restore the captured normalized baseline without re-normalizing under current options.');
resetController.destroy();

const resetSource={nested:{value:1}};
const copiedReset=ValueController.create({
  value:resetSource,
  equals:(a,b)=>JSON.stringify(a)===JSON.stringify(b)
});
resetSource.nested.value=9;
copiedReset.setValue({nested:{value:2}},{silent:true});
copiedReset.reset({silent:true});
assert.equal(copiedReset.value.nested.value,1,'reset baseline must not retain the caller mutable object reference.');
const leakedValue=copiedReset.value;leakedValue.nested.value=7;
assert.equal(copiedReset.value.nested.value,1,'public value getter must not expose canonical mutable state.');
const leakedSnapshot=copiedReset.snapshot();leakedSnapshot.value.nested.value=8;
assert.equal(copiedReset.value.nested.value,1,'snapshot must not expose canonical mutable state.');
copiedReset.destroy();

let adapterCopies=0;
const adapterCopyController=ValueController.create({
  value:{value:1},
  copyValue(value){adapterCopies+=1;return value&&typeof value==='object'?{...value}:value;},
  equals:(a,b)=>a&&b&&a.value===b.value
});
const adapterCopiesBeforeRead=adapterCopies;
const adapterExposed=adapterCopyController.value;
assert.equal(adapterExposed.value,1);
assert.equal(adapterCopies,adapterCopiesBeforeRead+1,'public getter must use the supplied copy adapter exactly once per boundary read.');
adapterExposed.value=9;
assert.equal(adapterCopyController.value.value,1);
adapterCopyController.destroy();

const reentrantEvents=[];
let reentrantValue;
reentrantValue=ValueController.create({
  value:'A',
  onValueChange(value){
    reentrantEvents.push('callback:'+value);
    if(value==='B') reentrantValue.setValue('C',{source:'test',reason:'reentrant-inner'});
  }
});
reentrantValue.on('value-change',detail=>reentrantEvents.push('event:'+detail.value));
assert.equal(reentrantValue.setValue('B',{source:'test',reason:'reentrant-outer'}),false,'outer publication must report stale after callback reentrancy.');
assert.equal(reentrantValue.value,'C');
assert.deepEqual(reentrantEvents,['callback:B','callback:C','event:C'],'stale outer B event must not publish after inner C becomes canonical.');
reentrantValue.destroy();

console.log(JSON.stringify({ok:true,valueController:true,compatAliasesRemoved:true,channels:['committed','draft','preview','rawInput'],sessionAuthority:true,noCloseCommit:true,normalizeExactlyOnce:true,stableResetBaseline:true,publicCopyBoundary:true,singleCopyBoundary:true,reentrantGuard:true}));
