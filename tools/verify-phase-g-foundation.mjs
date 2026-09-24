import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ActionContext, OperationResult, ComponentProfile, FeedbackController, FormController } from '../src/core/index.js';

function context(reason){return ActionContext.create(reason,{source:'programmatic'});}

const formControllerSource=fs.readFileSync(new URL('../src/core/formController.js',import.meta.url),'utf8');
assert.doesNotMatch(formControllerSource,/\bbaseline\b/,'FormController must not copy the business value/reset baseline owned by ValueController.');

assert.equal(ComponentProfile.controllers.length,9);
assert.ok(ComponentProfile.controllers.includes('FeedbackController'));
assert.ok(ComponentProfile.controllers.includes('FormController'));
assert.equal(typeof FeedbackController.create,'function','FeedbackController must export through core/index.');
assert.equal(typeof FormController.create,'function','FormController must export through core/index.');

const localEvents=[],globalEvents=[];
function projector(log){
  return {
    show(record){log.push(['show',record.identity,record.status,record.message]);return {identity:record.identity};},
    update(handle,record){log.push(['update',record.identity,record.status,record.message]);return handle;},
    close(handle,record,reason){log.push(['close',record.identity,reason]);return true;}
  };
}
const feedback=FeedbackController.create({
  ownerId:'field:alpha',
  localProjector:projector(localEvents),
  globalProjector:projector(globalEvents)
});
const feedbackContext=context('feedback-test');
let result=feedback.publish({operation:'validate',status:'error',message:'Required',generation:1},feedbackContext);
assert.equal(result.status,'applied');
result=feedback.publish({operation:'validate',status:'error',message:'Required',generation:1},feedbackContext);
assert.equal(result.status,'unchanged','identical feedback must not project twice');
assert.equal(localEvents.filter(entry=>entry[0]==='show').length,1);
assert.equal(localEvents.filter(entry=>entry[0]==='update').length,0);
result=feedback.publish({operation:'validate',status:'success',message:'Ready',generation:2},feedbackContext);
assert.equal(result.status,'applied');
assert.equal(localEvents.filter(entry=>entry[0]==='update').length,1);
result=feedback.publish({operation:'validate',status:'error',message:'stale',generation:1},feedbackContext);
assert.equal(result.status,'stale','older feedback generation must be rejected');
result=feedback.publish({operation:'validate',status:'success',message:'Ready',generation:2,target:'global'},feedbackContext);
assert.equal(result.status,'applied','same identity may retarget without duplicating the record');
assert.equal(feedback.snapshot().records.length,1);
assert.equal(feedback.snapshot().records[0].target,'global');
assert.ok(localEvents.some(entry=>entry[0]==='close'&&entry[2]==='retarget'));
assert.equal(globalEvents.filter(entry=>entry[0]==='show').length,1);
const distinctAction=context('feedback-same-message-new-action');
result=feedback.publish({operation:'validate',status:'success',message:'Ready',target:'global'},distinctAction);
assert.equal(result.status,'applied','same message on a different action identity must not be text-deduplicated');
assert.equal(feedback.snapshot().records.length,2,'feedback de-dup identity must include actionId/requestId, not message text');
feedback.destroy();

const noticeEvents=[];
const noticeProjector=FeedbackController.createNoticeProjector({
  create(payload){noticeEvents.push(payload);return {updateOptions(next){noticeEvents.push(next);return this;},close(){return true;}};}
});
const noticeFeedback=FeedbackController.create({ownerId:'task:notice',globalProjector:noticeProjector});
noticeFeedback.publish({operation:'upload',status:'progress',message:'Uploading',target:'global'},context('notice-progress'));
noticeFeedback.publish({operation:'upload',status:'pending',message:'Waiting',target:'global'},context('notice-pending'));
assert.equal(noticeEvents[0].type,'loading','progress must map to NoticeService loading type');
assert.equal(noticeEvents[1].type,'loading','pending must map to NoticeService loading type');
noticeFeedback.destroy();



let left='A',right='B',submitted=null;
const form=FormController.create({
  onSubmit(entries){submitted=entries;return true;}
});
const leftField=form.registerField({
  fieldId:'left',
  name:'choice',
  adapter:{getValue:()=>left,getSerializedValue:()=>left}
});
const rightField=form.registerField({
  fieldId:'right',
  name:'choice',
  adapter:{getValue:()=>right,getSerializedValue:()=>right}
});
assert.deepEqual(form.getFieldsByName('choice'),['left','right'],'same-name fields must keep independent fieldId identity');
assert.deepEqual(form.serializeEntries().map(entry=>[entry.fieldId,entry.name,entry.value]),[
  ['left','choice','A'],['right','choice','B']
]);
left='A2';
assert.equal(leftField.notifyValue(context('left-change')).status,'applied');
assert.equal(form.getField('left').dirty,true);
assert.equal(form.getField('right').dirty,false);
let adapterDirty=false,adapterValue='seed';
const adapterDirtyField=form.registerField({
  fieldId:'adapter-dirty',
  name:'dirty-probe',
  adapter:{getValue:()=>adapterValue,getSerializedValue:()=>adapterValue,isDirty:()=>adapterDirty}
});
adapterValue='changed';adapterDirty=true;adapterDirtyField.notifyValue(context('adapter-dirty-change'));
assert.equal(form.getField('adapter-dirty').dirty,true,'FormController must consume owner dirty state without storing a value baseline');
adapterValue='seed';adapterDirty=false;adapterDirtyField.notifyValue(context('adapter-dirty-return'));
assert.equal(form.getField('adapter-dirty').dirty,false,'owner-reported clean state must clear dirty even without a copied baseline');
assert.equal(adapterDirtyField.unregister(context('adapter-dirty-unregister')).status,'applied');
assert.equal(leftField.markTouched(true,context('left-touch')).status,'applied');
assert.equal(form.getField('left').touched,true);

const submitResult=await form.submit(context('submit-same-name'));
assert.equal(submitResult.status,'applied');
assert.deepEqual(submitted.map(entry=>[entry.fieldId,entry.name,entry.value]),[
  ['left','choice','A2'],['right','choice','B']
]);

let asyncValue='old',resolveOld=null,validatorMode='deferred';
const asyncField=form.registerField({
  fieldId:'async',
  name:'remote',
  adapter:{
    getValue:()=>asyncValue,
    getSerializedValue:()=>asyncValue,
    validateAsync(){
      if(validatorMode==='fresh')return {valid:true};
      return new Promise(resolve=>{resolveOld=resolve;});
    }
  }
});
const stalePromise=form.validateField('async',context('validate-old'));
await Promise.resolve();
assert.equal(typeof resolveOld,'function');
asyncValue='new';
asyncField.notifyValue(context('async-new-value'));
resolveOld({valid:false,error:'old error'});
const staleResult=await stalePromise;
assert.equal(staleResult.status,'stale','older async validator result must not overwrite newer value revision');
assert.equal(form.getField('async').error,null);
validatorMode='fresh';
const freshResult=await form.validateField('async',context('validate-new'));
assert.equal(freshResult.status,'applied');
assert.equal(form.getField('async').valid,true);
assert.equal(form.getField('async').error,null);
form.destroy();

let controlledValue='initial';
const controlledForm=FormController.create();
const controlledField=controlledForm.registerField({
  fieldId:'controlled',
  name:'controlled',
  adapter:{
    getValue:()=>controlledValue,
    getSerializedValue:()=>controlledValue,
    reset(resetContext){return OperationResult.requested(resetContext,{requestId:'reset-1'});}
  }
});
controlledValue='changed';
controlledField.notifyValue(context('controlled-change'));
controlledField.markTouched(true,context('controlled-touch'));
assert.equal(controlledForm.getField('controlled').dirty,true);
const requestedReset=await controlledForm.reset(context('controlled-reset'));
assert.equal(requestedReset.status,'requested');
assert.equal(controlledForm.getField('controlled').pendingResetRequestId,'reset-1');
assert.equal(controlledForm.getField('controlled').dirty,true,'controlled reset must not pretend the owner value changed');
assert.equal(controlledForm.getField('controlled').touched,false,'reset clears touched immediately even while owner acknowledgement is pending');
assert.equal(controlledForm.serializeEntries()[0].value,'changed','serialized controlled value must stay owner-confirmed');
controlledValue='initial';
const ack=controlledField.acknowledgeReset('reset-1',context('controlled-reset-ack'));
assert.equal(ack.status,'applied');
assert.equal(controlledForm.getField('controlled').dirty,false);
assert.equal(controlledForm.getField('controlled').pendingResetRequestId,null);
assert.equal(controlledForm.serializeEntries()[0].value,'initial');
controlledForm.destroy();

let resetCalls=0;
const cancellationForm=FormController.create();
cancellationForm.registerField({
  fieldId:'cancel',
  name:'cancel',
  adapter:{
    getValue:()=>1,
    getSerializedValue:()=>1,
    reset(){resetCalls+=1;return true;}
  }
});
const blocked=await cancellationForm.reset({source:'native',originalEvent:{defaultPrevented:true}});
assert.equal(blocked.status,'blocked');
assert.equal(resetCalls,0,'cancelled native reset must not call field reset adapters');
cancellationForm.destroy();

console.log(JSON.stringify({
  ok:true,
  runtimeControllers:ComponentProfile.controllers.length,
  feedbackDedup:true,
  feedbackGeneration:true,
  sameNameFields:true,
  staleAsyncValidation:true,
  controlledReset:true,
  nativeResetCancellation:true
}));
