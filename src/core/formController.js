import { ActionContext } from './actionContext.js';
import { OperationResult } from './operationResult.js';
import { AsyncTask } from './asyncTask.js';
import { AsyncTaskGroup } from './asyncTaskGroup.js';
import { Scheduler } from './scheduler.js';
import { DOM } from './dom.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { Utils } from '../utils/utils.js';

function own(object,key){return Object.prototype.hasOwnProperty.call(Object(object),key);}
function text(value){return value===undefined||value===null?'':String(value);}
function copyValue(value){
  if(Array.isArray(value))return value.map(copyValue);
  if(value&&typeof value==='object'){
    var proto=Object.getPrototypeOf(value);
    if(proto===Object.prototype||proto===null){
      var out={};Object.keys(value).forEach(function(key){if(Utils.safeOwnKey(key))out[key]=copyValue(value[key]);});return out;
    }
  }
  return value;
}
function contextFor(reason,meta){
  if(ActionContext.isContext(meta))return meta;
  return ActionContext.create(reason,meta&&typeof meta==='object'?meta:{source:'programmatic'});
}
function normalizeValidation(value){
  if(value===undefined||value===null||value===true)return Object.freeze({valid:true,error:null});
  if(value===false)return Object.freeze({valid:false,error:''});
  if(typeof value==='string')return Object.freeze({valid:false,error:value});
  if(value&&typeof value==='object'){
    var valid=own(value,'valid')?value.valid!==false:!(value.error||value.message);
    return Object.freeze({valid:valid,error:valid?null:text(value.error||value.message||'')});
  }
  return Object.freeze({valid:!!value,error:value?'':'Invalid'});
}
function normalizeAdapter(spec){
  var source=spec&&spec.adapter&&typeof spec.adapter==='object'?spec.adapter:(spec||{});
  var bridge=source.bridge||spec.bridge||null;
  var getValue=Utils.isFunction(source.getValue)?source.getValue:(bridge&&Utils.isFunction(bridge.getValue)?bridge.getValue.bind(bridge):null);
  if(!getValue)throw new TypeError('[QXFRAME9A7C2] FormController field requires adapter.getValue() or bridge.getValue().');
  var getSerializedValue=Utils.isFunction(source.getSerializedValue)?source.getSerializedValue:(bridge&&Utils.isFunction(bridge.getSerializedValue)?bridge.getSerializedValue.bind(bridge):getValue);
  return Object.freeze({
    getValue:getValue,
    getSerializedValue:getSerializedValue,
    reset:Utils.isFunction(source.reset)?source.reset:null,
    validateSync:Utils.isFunction(source.validateSync)?source.validateSync:null,
    validateAsync:Utils.isFunction(source.validateAsync)?source.validateAsync:(Utils.isFunction(source.validate)?source.validate:null),
    getOwnershipState:Utils.isFunction(source.getOwnershipState)?source.getOwnershipState:null,
    focus:Utils.isFunction(source.focus)?source.focus:null,
    reveal:Utils.isFunction(source.reveal)?source.reveal:null,
    bridge:bridge
  });
}
function create(options){
  var opts=options||{},fields=new Map(),names=new Map(),destroyed=false,revision=0,submitGeneration=0,submitPending=false;
  var form=null,formCleanup=[],resetScheduler=null;
  var validationTasks=AsyncTaskGroup.create({
    task:function(input,taskContext){return input.run(taskContext);}
  });
  var submitTask=AsyncTask.create({
    task:function(payload,taskContext){
      if(!Utils.isFunction(opts.onSubmit))return payload.entries;
      return opts.onSubmit(payload.entries,Object.freeze({
        context:payload.context,submitter:payload.submitter||null,
        revision:payload.revision,requestId:taskContext.requestId,controller:api
      }));
    }
  });
  var api=null;

  function emitState(reason,fieldId){
    if(Utils.isFunction(opts.onStateChange)){
      try{opts.onStateChange(snapshot(),{reason:reason||'state',fieldId:fieldId||null,controller:api});}catch(_){}
    }
  }
  function ensureActive(){
    if(destroyed)throw new Error('[QXFRAME9A7C2] FormController is destroyed.');
  }
  function fieldState(field){
    return Object.freeze({
      fieldId:field.fieldId,name:field.name,dirty:field.dirty,touched:field.touched,
      pending:field.pending,valid:field.valid,error:field.error,valueRevision:field.valueRevision,
      validationGeneration:field.validationGeneration,pendingResetRequestId:field.pendingResetRequestId
    });
  }
  function nameAdd(name,fieldId){
    if(!names.has(name))names.set(name,new Set());
    names.get(name).add(fieldId);
  }
  function nameDelete(name,fieldId){
    var set=names.get(name);if(!set)return;
    set.delete(fieldId);if(!set.size)names.delete(name);
  }
  function readValue(field){return copyValue(field.adapter.getValue());}
  function readSerialized(field){return copyValue(field.adapter.getSerializedValue());}
  function refreshDirty(field){
    field.dirty=!ValueEquality.deep(field.baseline,readValue(field));
    return field.dirty;
  }
  function resetVisualState(field){
    field.touched=false;field.pending=false;field.valid=true;field.error=null;
  }
  function invalidateValidations(reason){
    validationTasks.invalidate(reason||'form-revision');
    fields.forEach(function(field){field.validationGeneration+=1;field.pending=false;});
  }
  function advanceRevision(reason,fieldId){
    revision+=1;invalidateValidations(reason||'revision');emitState(reason||'revision',fieldId);return revision;
  }
  function registerField(spec){
    ensureActive();
    var source=spec||{},fieldId=text(source.fieldId).trim();
    if(!fieldId)throw new TypeError('[QXFRAME9A7C2] FormController fieldId must not be empty.');
    if(fields.has(fieldId))throw new Error('[QXFRAME9A7C2] FormController duplicate fieldId: '+fieldId);
    var adapter=normalizeAdapter(source),name=text(source.name),field={
      fieldId:fieldId,name:name,adapter:adapter,baseline:readAdapterValue(adapter),
      dirty:false,touched:false,pending:false,valid:true,error:null,valueRevision:0,
      validationGeneration:0,pendingResetRequestId:null,metadata:source.metadata||null
    };
    fields.set(fieldId,field);nameAdd(name,fieldId);advanceRevision('register-field',fieldId);
    return Object.freeze({
      fieldId:fieldId,
      notifyValue:function(meta){return notifyValue(fieldId,meta);},
      markTouched:function(value,meta){return markTouched(fieldId,value,meta);},
      validate:function(meta){return validateField(fieldId,meta);},
      acknowledgeReset:function(requestId,meta){return acknowledgeReset(fieldId,requestId,meta);},
      getState:function(){var current=fields.get(fieldId);return current?fieldState(current):null;},
      unregister:function(meta){return unregisterField(fieldId,meta);}
    });
  }
  function readAdapterValue(adapter){return copyValue(adapter.getValue());}
  function unregisterField(fieldId,meta){
    if(destroyed)return OperationResult.disposed(contextFor('form-unregister-disposed',meta),{reason:'form-controller-destroyed'});
    var context=contextFor('form-unregister-field',meta),key=text(fieldId),field=fields.get(key);
    if(!field)return OperationResult.unchanged(context,{reason:'field-not-registered'});
    validationTasks.cancel(key,'unregister');nameDelete(field.name,key);fields.delete(key);advanceRevision('unregister-field',key);
    return OperationResult.applied(context,{reason:'field-unregistered',revision:revision});
  }
  function notifyValue(fieldId,meta){
    if(destroyed)return OperationResult.disposed(contextFor('form-value-disposed',meta),{reason:'form-controller-destroyed'});
    var context=contextFor('form-value-change',meta),field=fields.get(text(fieldId));
    if(!field)return OperationResult.invalid(context,{reason:'field-not-registered'});
    field.valueRevision+=1;refreshDirty(field);advanceRevision('field-value',field.fieldId);
    return OperationResult.applied(context,{reason:'field-value-observed',revision:revision,generation:field.valueRevision});
  }
  function markTouched(fieldId,value,meta){
    if(destroyed)return OperationResult.disposed(contextFor('form-touch-disposed',meta),{reason:'form-controller-destroyed'});
    var context=contextFor('form-touch',meta),field=fields.get(text(fieldId));
    if(!field)return OperationResult.invalid(context,{reason:'field-not-registered'});
    var next=value!==false;if(field.touched===next)return OperationResult.unchanged(context,{reason:'touch-unchanged'});
    field.touched=next;emitState('field-touch',field.fieldId);
    return OperationResult.applied(context,{reason:'touch-updated'});
  }
  function applyValidation(field,result,generation){
    var normalized=normalizeValidation(result);
    field.pending=false;field.valid=normalized.valid;field.error=normalized.error;
    emitState('validation-result',field.fieldId);
    if(Utils.isFunction(opts.onValidation)){
      try{opts.onValidation(fieldState(field),{generation:generation,controller:api});}catch(_){}
    }
    return normalized;
  }
  async function validateField(fieldId,meta){
    if(destroyed)return OperationResult.disposed(contextFor('form-validate-disposed',meta),{reason:'form-controller-destroyed'});
    var context=contextFor('form-validate-field',meta),field=fields.get(text(fieldId));
    if(!field)return OperationResult.invalid(context,{reason:'field-not-registered'});
    var generation=++field.validationGeneration,capturedRevision=revision,capturedValueRevision=field.valueRevision,value=readValue(field);
    if(field.adapter.validateSync){
      var syncResult;
      try{syncResult=field.adapter.validateSync(value,Object.freeze({context:context,fieldId:field.fieldId,form:api}));}
      catch(error){syncResult={valid:false,error:error&&error.message||String(error)};}
      var normalizedSync=applyValidation(field,syncResult,generation);
      if(!normalizedSync.valid)return OperationResult.invalid(context,{reason:'sync-validation-failed',revision:capturedRevision,generation:generation});
    }
    if(!field.adapter.validateAsync){
      if(!field.adapter.validateSync)applyValidation(field,true,generation);
      return field.valid
        ? OperationResult.applied(context,{reason:'validation-complete',revision:capturedRevision,generation:generation})
        : OperationResult.invalid(context,{reason:'validation-failed',revision:capturedRevision,generation:generation});
    }
    field.pending=true;emitState('validation-pending',field.fieldId);
    var result;
    try{
      result=await validationTasks.run(field.fieldId,{
        run:function(taskContext){
          return field.adapter.validateAsync(value,Object.freeze({
            context:context,fieldId:field.fieldId,form:api,requestId:taskContext.requestId,
            signal:taskContext.signal,isCurrent:taskContext.isCurrent
          }));
        }
      },{source:context.source});
    }catch(error){
      if(destroyed)return OperationResult.disposed(context,{reason:'form-controller-destroyed'});
      if(!fields.has(field.fieldId)||field.validationGeneration!==generation||revision!==capturedRevision||field.valueRevision!==capturedValueRevision){
        return OperationResult.stale(context,{reason:'async-validation-stale',revision:capturedRevision,generation:generation});
      }
      applyValidation(field,{valid:false,error:error&&error.message||String(error)},generation);
      return OperationResult.invalid(context,{reason:'async-validation-error',revision:capturedRevision,generation:generation});
    }
    if(destroyed)return OperationResult.disposed(context,{reason:'form-controller-destroyed'});
    if(!fields.has(field.fieldId)||field.validationGeneration!==generation||revision!==capturedRevision||field.valueRevision!==capturedValueRevision){
      return OperationResult.stale(context,{reason:'async-validation-stale',revision:capturedRevision,generation:generation});
    }
    var normalized=applyValidation(field,result,generation);
    return normalized.valid
      ? OperationResult.applied(context,{reason:'validation-complete',revision:capturedRevision,generation:generation})
      : OperationResult.invalid(context,{reason:'async-validation-failed',revision:capturedRevision,generation:generation});
  }
  async function validateAll(meta){
    if(destroyed)return Object.freeze({result:OperationResult.disposed(contextFor('form-validate-all-disposed',meta),{reason:'form-controller-destroyed'}),valid:false});
    var context=contextFor('form-validate-all',meta),capturedRevision=revision,ids=Array.from(fields.keys());
    var results=await Promise.all(ids.map(function(id){return validateField(id,ActionContext.derive(context,'form-validate-field',{ownerId:id}));}));
    if(destroyed)return Object.freeze({result:OperationResult.disposed(context,{reason:'form-controller-destroyed'}),valid:false});
    if(revision!==capturedRevision||results.some(function(result){return result.status==='stale';})){
      return Object.freeze({result:OperationResult.stale(context,{reason:'form-validation-stale',revision:capturedRevision}),valid:false});
    }
    var invalid=ids.filter(function(id){var field=fields.get(id);return field&&!field.valid;});
    return Object.freeze({
      result:invalid.length?OperationResult.invalid(context,{reason:'form-validation-failed',revision:capturedRevision}):OperationResult.applied(context,{reason:'form-validation-complete',revision:capturedRevision}),
      valid:invalid.length===0,invalidFieldIds:Object.freeze(invalid)
    });
  }
  function serializeEntries(){
    ensureActive();
    var entries=[];
    fields.forEach(function(field){
      if(!field.name)return;
      var raw=readSerialized(field),values=Array.isArray(raw)?raw:[raw];
      if(!values.length)values=[''];
      values.forEach(function(value,index){entries.push(Object.freeze({fieldId:field.fieldId,name:field.name,value:value,index:index}));});
    });
    return Object.freeze(entries);
  }
  async function submit(meta){
    if(destroyed)return OperationResult.disposed(contextFor('form-submit-disposed',meta),{reason:'form-controller-destroyed'});
    var source=meta&&typeof meta==='object'?meta:{},context=contextFor('form-submit',source),capturedRevision=revision,generation=++submitGeneration;
    var validation=await validateAll(ActionContext.derive(context,'form-submit-validate'));
    if(validation.result.status==='disposed'||validation.result.status==='stale')return validation.result;
    if(!validation.valid)return OperationResult.invalid(context,{reason:'form-invalid',revision:capturedRevision,generation:generation});
    if(revision!==capturedRevision||generation!==submitGeneration)return OperationResult.stale(context,{reason:'submit-revision-stale',revision:capturedRevision,generation:generation});
    var entries=serializeEntries();
    if(!Utils.isFunction(opts.onSubmit))return OperationResult.applied(context,{reason:'submit-ready',revision:capturedRevision,generation:generation});
    submitPending=true;emitState('submit-pending');
    try{
      await submitTask.run({entries:entries,context:context,submitter:source.submitter||null,revision:capturedRevision},{source:context.source});
    }catch(error){
      submitPending=false;emitState('submit-error');
      if(destroyed)return OperationResult.disposed(context,{reason:'form-controller-destroyed'});
      if(generation!==submitGeneration||revision!==capturedRevision)return OperationResult.stale(context,{reason:'submit-stale',revision:capturedRevision,generation:generation});
      return OperationResult.invalid(context,{reason:'submit-error',revision:capturedRevision,generation:generation});
    }
    submitPending=false;emitState('submit-complete');
    if(generation!==submitGeneration||revision!==capturedRevision)return OperationResult.stale(context,{reason:'submit-stale',revision:capturedRevision,generation:generation});
    return OperationResult.applied(context,{reason:'submit-complete',revision:capturedRevision,generation:generation});
  }
  function settleResetField(field){
    field.baseline=readValue(field);field.dirty=false;field.pendingResetRequestId=null;resetVisualState(field);
  }
  async function reset(meta){
    if(destroyed)return OperationResult.disposed(contextFor('form-reset-disposed',meta),{reason:'form-controller-destroyed'});
    var source=meta&&typeof meta==='object'?meta:{},context=contextFor('form-reset',source),event=source.originalEvent||null;
    if(event&&event.defaultPrevented)return OperationResult.blocked(context,{reason:'native-reset-cancelled'});
    submitGeneration+=1;if(submitTask.pending)submitTask.cancel('form-reset');
    revision+=1;invalidateValidations('form-reset');
    var requested=false,changed=false;
    for(const field of fields.values()){
      field.validationGeneration+=1;field.pending=false;
      var outcome=true;
      if(field.adapter.reset){
        try{outcome=await field.adapter.reset(context);}catch(_){outcome=false;}
      }else if(source.nativeApplied!==true){
        outcome=false;
      }
      if(OperationResult.isOperationResult(outcome)){
        if(outcome.status==='requested'){
          field.pendingResetRequestId=outcome.requestId||null;
          resetVisualState(field);
          refreshDirty(field);
          requested=true;continue;
        }
        if(outcome.status!=='applied'&&outcome.status!=='unchanged')continue;
      }else if(outcome===false){
        continue;
      }
      settleResetField(field);changed=true;
    }
    emitState('form-reset');
    if(Utils.isFunction(opts.onReset)){try{opts.onReset(snapshot(),{context:context,requested:requested,controller:api});}catch(_){}}
    if(requested)return OperationResult.requested(context,{reason:'external-reset-pending',revision:revision});
    return changed?OperationResult.applied(context,{reason:'form-reset-complete',revision:revision}):OperationResult.unchanged(context,{reason:'form-reset-noop',revision:revision});
  }
  function acknowledgeReset(fieldId,requestId,meta){
    if(destroyed)return OperationResult.disposed(contextFor('form-reset-ack-disposed',meta),{reason:'form-controller-destroyed'});
    var context=contextFor('form-reset-ack',meta),field=fields.get(text(fieldId));
    if(!field)return OperationResult.invalid(context,{reason:'field-not-registered'});
    var expected=field.pendingResetRequestId;
    if(!expected||String(expected)!==String(requestId||''))return OperationResult.stale(context,{reason:'reset-request-stale'});
    settleResetField(field);revision+=1;emitState('reset-ack',field.fieldId);
    return OperationResult.applied(context,{reason:'reset-acknowledged',revision:revision});
  }
  function getField(fieldId){var field=fields.get(text(fieldId));return field?fieldState(field):null;}
  function getFieldsByName(name){var set=names.get(text(name));return Object.freeze(set?Array.from(set):[]);}
  function snapshot(){
    var fieldViews={};fields.forEach(function(field,id){fieldViews[id]=fieldState(field);});
    var nameViews={};names.forEach(function(set,name){nameViews[name]=Object.freeze(Array.from(set));});
    return Object.freeze({
      revision:revision,destroyed:destroyed,submitPending:submitPending,
      fields:Object.freeze(fieldViews),names:Object.freeze(nameViews),fieldCount:fields.size
    });
  }
  function unbindForm(){
    formCleanup.splice(0).forEach(function(stop){try{stop();}catch(_){}});
    if(resetScheduler){resetScheduler.dispose();resetScheduler=null;}form=null;
  }
  function bindForm(nextForm){
    ensureActive();unbindForm();
    if(!nextForm)return false;
    form=nextForm;
    resetScheduler=Scheduler.createDelayScheduler(function(_timestamp,payload){
      var event=payload&&payload.event||null;
      if(!event||event.defaultPrevented)return;
      reset({source:'native',originalEvent:event,nativeApplied:true});
    });
    formCleanup.push(DOM.listen(form,'reset',function(event){resetScheduler.request(0,{event:event});}));
    if(opts.interceptNativeSubmit===true){
      formCleanup.push(DOM.listen(form,'submit',function(event){
        if(event.defaultPrevented)return;
        event.preventDefault();
        submit({source:'native',originalEvent:event,submitter:event.submitter||null});
      }));
    }
    return true;
  }
  function updateOptions(next){
    if(destroyed)return false;
    var value=next||{},currentForm=form,requestedForm=own(value,'form')?value.form:currentForm;
    var submitBindingChanged=own(value,'interceptNativeSubmit')&&value.interceptNativeSubmit!==opts.interceptNativeSubmit;
    ['onSubmit','onReset','onValidation','onStateChange','interceptNativeSubmit'].forEach(function(key){if(own(value,key))opts[key]=value[key];});
    if(requestedForm!==currentForm||(submitBindingChanged&&currentForm))bindForm(requestedForm);
    return true;
  }
  function destroy(){
    if(destroyed)return false;
    unbindForm();validationTasks.destroy();submitTask.destroy();fields.clear();names.clear();destroyed=true;return true;
  }
  api=Object.freeze({
    registerField:registerField,unregisterField:unregisterField,notifyValue:notifyValue,markTouched:markTouched,
    validateField:validateField,validateAll:validateAll,serializeEntries:serializeEntries,submit:submit,reset:reset,
    acknowledgeReset:acknowledgeReset,getField:getField,getFieldsByName:getFieldsByName,snapshot:snapshot,
    bindForm:bindForm,updateOptions:updateOptions,destroy:destroy,
    get revision(){return revision;},get destroyed(){return destroyed;}
  });
  if(opts.form)bindForm(opts.form);
  return api;
}

export const FormController=Object.freeze({create});
export {create};
