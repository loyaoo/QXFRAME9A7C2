import { ActionContext } from './actionContext.js';
import { OperationResult } from './operationResult.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { Utils } from '../utils/utils.js';

const STATUSES=Object.freeze(['idle','pending','success','warning','error','progress']);
const TARGETS=Object.freeze(['local','form','global']);

function own(object,key){return Object.prototype.hasOwnProperty.call(Object(object),key);}
function normalizeText(value){return value===undefined||value===null?'':String(value);}
function contextFor(reason,meta){
  if(ActionContext.isContext(meta))return meta;
  var source=meta&&typeof meta==='object'?meta:{};
  return ActionContext.create(reason,source);
}
function projectorOf(value){
  if(!value)return null;
  if(Utils.isFunction(value))return Object.freeze({show:value});
  if(typeof value!=='object')throw new TypeError('[QXFRAME9A7C2] FeedbackController projector must be a function or object.');
  if(!Utils.isFunction(value.show)&&!Utils.isFunction(value.update)&&!Utils.isFunction(value.close))throw new TypeError('[QXFRAME9A7C2] FeedbackController projector must expose show/update/close.');
  return value;
}
function identityOf(input,context,ownerId,operation){
  if(input&&input.identity!==undefined&&input.identity!==null&&String(input.identity))return String(input.identity);
  var requestId=input&&input.requestId!==undefined&&input.requestId!==null&&String(input.requestId);
  return ownerId+'|'+operation+'|'+(requestId?'request:'+requestId:'action:'+context.actionId);
}
function operationKey(ownerId,operation){return ownerId+'|'+operation;}
function closeProjection(record,reason){
  if(!record||!record.projector)return false;
  var projector=record.projector;
  try{
    if(Utils.isFunction(projector.close)){projector.close(record.handle,record.snapshot,reason||'clear');return true;}
    if(record.handle&&Utils.isFunction(record.handle.close)){record.handle.close(reason||'clear');return true;}
  }catch(_){}
  return false;
}
function create(options){
  var opts=options||{};
  var ownerId=normalizeText(opts.ownerId||'feedback');
  var projectors={
    local:projectorOf(opts.localProjector||null),
    form:projectorOf(opts.formProjector||null),
    global:projectorOf(opts.globalProjector||null)
  };
  var records=new Map(),latestGeneration=new Map(),destroyed=false,revision=0;

  function resolveTarget(input){
    var explicit=input&&input.target!==undefined?String(input.target):'';
    if(explicit&&TARGETS.indexOf(explicit)<0)throw new TypeError('[QXFRAME9A7C2] FeedbackController target must be local, form, or global.');
    if(explicit)return explicit;
    if(input&&input.global===true)return 'global';
    if(projectors.local)return 'local';
    if(projectors.form)return 'form';
    return 'global';
  }
  function snapshotRecord(record){
    return Object.freeze({
      identity:record.identity,ownerId:record.ownerId,operation:record.operation,
      actionId:record.actionId,requestId:record.requestId,generation:record.generation,
      status:record.status,target:record.target,message:record.message,progress:record.progress,
      revision:record.revision
    });
  }
  function removeRecord(identity,reason){
    var record=records.get(String(identity));
    if(!record)return false;
    records.delete(String(identity));
    closeProjection(record,reason||'clear');
    revision+=1;
    return true;
  }
  function clearOlder(owner,operation,generation){
    if(!Number.isFinite(generation))return 0;
    var count=0;
    records.forEach(function(record,key){
      if(record.ownerId!==owner||record.operation!==operation)return;
      if(!Number.isFinite(record.generation)||record.generation>=generation)return;
      if(removeRecord(key,'superseded'))count+=1;
    });
    return count;
  }
  function publish(input,meta){
    if(destroyed)return OperationResult.disposed(contextFor('feedback-disposed',meta),{reason:'feedback-controller-destroyed'});
    var value=input||{};
    var context=contextFor(value.reason||'feedback-publish',meta||value.context);
    var status=String(value.status||'idle');
    if(STATUSES.indexOf(status)<0)return OperationResult.invalid(context,{reason:'invalid-feedback-status'});
    var recordOwner=normalizeText(value.ownerId||ownerId);
    var operation=normalizeText(value.operation||'operation');
    if(!recordOwner||!operation)return OperationResult.invalid(context,{reason:'feedback-owner-operation-required'});
    var generation=Number.isFinite(Number(value.generation))?Number(value.generation):null;
    var opKey=operationKey(recordOwner,operation);
    var latest=latestGeneration.get(opKey);
    if(generation!==null&&latest!==undefined&&generation<latest)return OperationResult.stale(context,{reason:'feedback-generation-stale',generation:generation});
    if(generation!==null&&(latest===undefined||generation>latest)){
      latestGeneration.set(opKey,generation);
      clearOlder(recordOwner,operation,generation);
    }
    var identity=identityOf(value,context,recordOwner,operation);
    if(status==='idle'){
      return removeRecord(identity,value.clearReason||'idle')
        ? OperationResult.applied(context,{reason:'feedback-cleared',generation:generation===null?undefined:generation})
        : OperationResult.unchanged(context,{reason:'feedback-already-clear',generation:generation===null?undefined:generation});
    }
    var target=resolveTarget(value),projector=projectors[target]||null;
    var nextSnapshot=Object.freeze({
      identity:identity,ownerId:recordOwner,operation:operation,actionId:context.actionId,
      requestId:value.requestId===undefined||value.requestId===null?null:String(value.requestId),
      generation:generation,status:status,target:target,message:normalizeText(value.message),
      progress:Number.isFinite(Number(value.progress))?Number(value.progress):null,
      data:own(value,'data')?value.data:undefined,revision:revision+1
    });
    var previous=records.get(identity)||null;
    if(previous&&ValueEquality.deep(previous.snapshot,nextSnapshot))return OperationResult.unchanged(context,{reason:'feedback-unchanged',generation:generation===null?undefined:generation});
    if(previous&&previous.target!==target)closeProjection(previous,'retarget');
    var handle=previous&&previous.target===target?previous.handle:null;
    try{
      if(projector){
        if(previous&&previous.target===target&&Utils.isFunction(projector.update))handle=projector.update(handle,nextSnapshot,previous.snapshot);
        else if(Utils.isFunction(projector.show))handle=projector.show(nextSnapshot,previous?previous.snapshot:null);
      }
    }catch(error){
      return OperationResult.invalid(context,{reason:'feedback-projection-failed',generation:generation===null?undefined:generation});
    }
    revision+=1;
    records.set(identity,{
      identity:identity,ownerId:recordOwner,operation:operation,actionId:context.actionId,
      requestId:nextSnapshot.requestId,generation:generation,status:status,target:target,
      message:nextSnapshot.message,progress:nextSnapshot.progress,revision:revision,
      snapshot:Object.freeze({...nextSnapshot,revision:revision}),projector:projector,handle:handle
    });
    return OperationResult.applied(context,{reason:'feedback-published',generation:generation===null?undefined:generation});
  }
  function clear(input,meta){
    if(destroyed)return OperationResult.disposed(contextFor('feedback-clear-disposed',meta),{reason:'feedback-controller-destroyed'});
    var value=input||{},context=contextFor(value.reason||'feedback-clear',meta||value.context);
    var recordOwner=normalizeText(value.ownerId||ownerId),operation=normalizeText(value.operation||'operation');
    var identity=identityOf(value,context,recordOwner,operation);
    return removeRecord(identity,value.clearReason||'clear')
      ? OperationResult.applied(context,{reason:'feedback-cleared'})
      : OperationResult.unchanged(context,{reason:'feedback-already-clear'});
  }
  function clearOperation(owner,operation,meta){
    if(destroyed)return OperationResult.disposed(contextFor('feedback-clear-operation-disposed',meta),{reason:'feedback-controller-destroyed'});
    var context=contextFor('feedback-clear-operation',meta),normalizedOwner=normalizeText(owner||ownerId),normalizedOperation=normalizeText(operation||'operation'),count=0;
    records.forEach(function(record,key){if(record.ownerId===normalizedOwner&&record.operation===normalizedOperation&&removeRecord(key,'operation-clear'))count+=1;});
    latestGeneration.delete(operationKey(normalizedOwner,normalizedOperation));
    return count?OperationResult.applied(context,{reason:'feedback-operation-cleared'}):OperationResult.unchanged(context,{reason:'feedback-operation-empty'});
  }
  function snapshot(){
    var list=Array.from(records.values()).map(snapshotRecord);
    return Object.freeze({ownerId:ownerId,revision:revision,destroyed:destroyed,records:Object.freeze(list)});
  }
  function updateOptions(next){
    if(destroyed)return false;
    var value=next||{};
    if(own(value,'ownerId')&&normalizeText(value.ownerId)!==ownerId)throw new Error('[QXFRAME9A7C2] FeedbackController ownerId is immutable.');
    if(own(value,'localProjector'))projectors.local=projectorOf(value.localProjector);
    if(own(value,'formProjector'))projectors.form=projectorOf(value.formProjector);
    if(own(value,'globalProjector'))projectors.global=projectorOf(value.globalProjector);
    return true;
  }
  function destroy(){
    if(destroyed)return false;
    Array.from(records.keys()).forEach(function(key){removeRecord(key,'destroy');});
    latestGeneration.clear();destroyed=true;return true;
  }
  return Object.freeze({
    publish:publish,clear:clear,clearOperation:clearOperation,snapshot:snapshot,
    updateOptions:updateOptions,destroy:destroy,
    get destroyed(){return destroyed;},
    get revision(){return revision;}
  });
}
function createNoticeProjector(channel,options){
  if(!channel||!Utils.isFunction(channel.create))throw new TypeError('[QXFRAME9A7C2] FeedbackController notice projector requires a NoticeService-compatible channel.');
  var opts=options||{},map=Utils.isFunction(opts.map)?opts.map:function(record){return {content:record.message,type:record.status};};
  return Object.freeze({
    show:function(record){
      var payload=map(record)||{};
      return channel.create(Utils.mergeOwn(payload,{key:record.identity}));
    },
    update:function(handle,record){
      var payload=map(record)||{};
      if(handle&&Utils.isFunction(handle.updateOptions)){handle.updateOptions(Utils.mergeOwn(payload,{key:record.identity}));return handle;}
      return channel.create(Utils.mergeOwn(payload,{key:record.identity}));
    },
    close:function(handle,record,reason){
      if(handle&&Utils.isFunction(handle.close))return handle.close(reason||'feedback-clear');
      if(Utils.isFunction(channel.close))return channel.close(record.identity,reason||'feedback-clear');
      return false;
    }
  });
}

export const FeedbackController=Object.freeze({create,createNoticeProjector,STATUSES,TARGETS});
export {create,createNoticeProjector,STATUSES,TARGETS};
