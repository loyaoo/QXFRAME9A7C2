import assert from 'node:assert/strict';
import { ActionContext, OperationResult, ControllableStateCore, DataRevision, EnvironmentPort, ProjectionScheduler, Diagnostics, ComponentProfile, LogicalOwnerTree, InputModality, SharedProtocol, Collection, ValueDraft, ValueController, StateController, ObserverHub } from '../src/core/index.js';
import { ComponentRuntime, configureComponents, publishComponentApi } from '../src/runtime/componentRuntime.js';

const keyEvent={type:'keydown',isTrusted:true};
const parent=ActionContext.create('activate',{originalEvent:keyEvent,scopeId:'scope-a',ownerId:'owner-a'});
assert.equal(parent.source,'keyboard');
assert.equal(parent.inputModality,'keyboard');
const child=ActionContext.derive(parent,'confirm');
assert.equal(child.parentActionId,parent.actionId);
assert.equal(child.scopeId,'scope-a');
assert.ok(!Object.prototype.hasOwnProperty.call(ActionContext.snapshot(parent),'originalEvent'));

const applied=OperationResult.applied(parent,{revision:1});
assert.equal(applied.status,'applied');
assert.equal(applied.revision,1);
assert.ok(OperationResult.isOperationResult(applied));

const internal=ControllableStateCore.create({controlled:false});
assert.equal(internal.getState().ownership,'internal');
assert.equal(internal.commitInternal(parent).status,'applied');
assert.equal(internal.getState().revision,1);
assert.equal(internal.requestChange(parent).status,'blocked');

const external=ControllableStateCore.create({controlled:true});
const requested=external.requestChange(parent);
assert.equal(requested.status,'requested');
assert.ok(requested.requestId);
assert.equal(external.syncExternal(ActionContext.create('external-accept',{source:'external'}),{requestId:requested.requestId}).status,'applied');
assert.equal(external.getState().pendingRequestIds.length,0);
assert.equal(external.transitionOwnership('internal',parent).status,'blocked');

const revisions=DataRevision.create();
const ref0=revisions.capture('row-a');
assert.equal(ref0.dataRevision,0);
revisions.advance();
assert.equal(revisions.isCurrent(ref0),false);
assert.equal(revisions.capture('row-a').dataRevision,1);

let observerDisconnected=false;
const env=EnvironmentPort.create({
  raf:callback=>{callback(1);return 1;},
  cancelRaf:()=>{},
  getComputedStyle:()=>({}),
  createResizeObserver:()=>({observe(){},disconnect(){observerDisconnected=true;}})
});
const observer=env.createResizeObserver(()=>{});
assert.equal(typeof observer.observe,'function');
assert.equal(EnvironmentPort.create({window:{}}).createResizeObserver(()=>{}),null);
observer.disconnect();
assert.equal(observerDisconnected,true);

let resizeObserved=false, mutationObserved=false, intersectionObserved=false, mediaListened=false;
const observerEnvironment=EnvironmentPort.create({
  createResizeObserver:()=>({observe(){resizeObserved=true;},disconnect(){}}),
  createMutationObserver:()=>({observe(){mutationObserved=true;},disconnect(){}}),
  createIntersectionObserver:()=>({observe(){intersectionObserved=true;},disconnect(){}}),
  matchMedia:()=>({
    matches:true,
    addEventListener(type){if(type==='change')mediaListened=true;},
    removeEventListener(){}
  })
});
const probeTarget={};
const stopResize=ObserverHub.resize(probeTarget,()=>{}, {environment:observerEnvironment,schedule:'sync'});
const stopMutation=ObserverHub.mutation(probeTarget,()=>{}, {environment:observerEnvironment,schedule:'sync'});
const stopIntersection=ObserverHub.intersection(probeTarget,()=>{}, {environment:observerEnvironment,schedule:'sync'});
const stopMedia=ObserverHub.media('(prefers-reduced-motion: reduce)',()=>{}, {environment:observerEnvironment,schedule:'sync'});
assert.equal(resizeObserved,true);
assert.equal(mutationObserved,true);
assert.equal(intersectionObserved,true);
assert.equal(mediaListened,true);
stopResize();stopMutation();stopIntersection();stopMedia();
assert.equal(ObserverHub.getStats().activeObservers,0);

const projected=[];
const projection=ProjectionScheduler.create({schedule:'sync',project:snapshot=>projected.push(snapshot.revision)});
assert.equal(projection.submit({revision:1,committed:'a'},parent).status,'applied');
assert.equal(projection.submit({revision:0,committed:'old'},parent).status,'stale');
assert.deepEqual(projected,[1]);

const roots={parent:{},child:{}};
const tree=LogicalOwnerTree.create();
tree.registerOwner({id:'parent',root:roots.parent});
tree.registerOwner({id:'child',parentId:'parent',root:roots.child});
assert.equal(tree.isLogicalDescendant('child','parent'),true);
assert.equal(tree.resolveOwnerFromEvent({composedPath:()=>[{},roots.child,roots.parent]}).id,'child');
tree.releaseOwner('parent');
assert.equal(tree.getState().size,0);

const diagnostics=Diagnostics.create({now:()=>1});
const record=diagnostics.report(Diagnostics.codes.DUPLICATE_STABLE_KEY,{key:'x'});
assert.equal(record.code,'duplicate-stable-key');
assert.equal(diagnostics.getReports().length,1);
assert.equal(Diagnostics.isDiagnostics(diagnostics),true);

const collectionDiagnostics=Diagnostics.create({now:()=>2});
const duplicateCollection=Collection.create({
  items:[{key:'dup',value:1},{key:'dup',value:2}],
  diagnostics:collectionDiagnostics
});
assert.equal(collectionDiagnostics.getReports(Diagnostics.codes.DUPLICATE_STABLE_KEY).length,1);
assert.equal(duplicateCollection.getDiagnostics(),collectionDiagnostics);

const profile=ComponentProfile.define({
  name:'ProtocolProbe',
  value:{mode:'controlled-or-default'},
  focus:{mode:'virtual-navigation'},
  ownership:{value:'ValueController',focus:'FocusController'},
  dependencies:{interaction:['focus']}
});
assert.equal(profile.name,'ProtocolProbe');
assert.throws(()=>ComponentProfile.define({name:'Bad',unknown:true}),/Unknown ComponentProfile field/);
const publishedProbe=publishComponentApi('ProtocolProbe',{profile:profile,create(){return {};}});
assert.equal(publishedProbe.profile.name,'ProtocolProbe');
assert.deepEqual(publishedProbe.profile.ownership,profile.ownership);
configureComponents({ProtocolProbe:publishedProbe});
assert.equal(ComponentRuntime.profileFor('ProtocolProbe').name,'ProtocolProbe');
assert.equal(ComponentRuntime.describe('ProtocolProbe').profile.name,'ProtocolProbe');

assert.ok(InputModality);
assert.equal(SharedProtocol.ActionContext,ActionContext);
assert.equal(SharedProtocol.LogicalOwnerTree,LogicalOwnerTree);

const collection=Collection.create({items:[{key:'a',value:'A'}]});
assert.equal(collection.dataRevision,0);
const collectionRef=collection.createRef('a');
assert.equal(collection.isCurrentRef(collectionRef),true);
assert.equal(collection.setItems([{key:'a',value:'A2'}]).changed,true);
assert.equal(collection.dataRevision,1);
assert.equal(collection.isCurrentRef(collectionRef),false);
let reentrantCollection;
reentrantCollection=Collection.create({
  items:[{key:'x'}],
  beforeItemsChange(){
    reentrantCollection.updateOptions({getLabel:item=>item.key});
    return true;
  }
});
assert.equal(reentrantCollection.setItems([{key:'y'}]).reason,'stale-transaction');

const controlledDraft=ValueDraft.create({value:'A',controlled:true});
assert.equal(controlledDraft.controlled,true);
assert.equal(controlledDraft.getOwnershipState().ownership,'external');
assert.equal(controlledDraft.requestChange('B',{source:'keyboard',reason:'probe-change'}),true);
assert.equal(controlledDraft.value,'A');
assert.equal(controlledDraft.getOwnershipState().pendingRequestIds.length,1);
const pendingId=controlledDraft.getOwnershipState().pendingRequestIds[0];
assert.equal(controlledDraft.syncExternal('B',{requestId:pendingId}),true);
assert.equal(controlledDraft.value,'B');
assert.equal(controlledDraft.getOwnershipState().pendingRequestIds.length,0);
controlledDraft.setControlled(false);
assert.equal(controlledDraft.getOwnershipState().ownership,'internal');
assert.equal(controlledDraft.requestChange('C',{source:'programmatic',reason:'probe-uncontrolled'}),true);
assert.equal(controlledDraft.value,'C');

const canonicalBinding=ValueController.createValueBinding({value:'X',controlled:true});
assert.equal(canonicalBinding.controlled,true);
assert.equal(canonicalBinding.ownership,'external');
assert.equal(canonicalBinding.write('Y',{reason:'canonical-binding-proposal'},true),true);
assert.equal(canonicalBinding.value,'X');
canonicalBinding.syncExternal('Y',{requestId:canonicalBinding.getOwnershipState().pendingRequestIds[0]});
assert.equal(canonicalBinding.value,'Y');

const binding=StateController.createValueBinding({value:'X',controlled:true});
assert.equal(binding.controlled,true);
assert.equal(binding.ownership,'external');
assert.equal(binding.write('Y',{reason:'binding-proposal'},true),true);
assert.equal(binding.value,'X');
binding.syncExternal('Y',{requestId:binding.getOwnershipState().pendingRequestIds[0]});
assert.equal(binding.value,'Y');

projection.destroy();
tree.destroy();
diagnostics.destroy();
collectionDiagnostics.destroy();
duplicateCollection.destroy();
internal.destroy();
external.destroy();
collection.destroy();
reentrantCollection.destroy();
controlledDraft.destroy();
canonicalBinding.destroy();
binding.destroy();

console.log(JSON.stringify({ok:true,actionContext:true,operationResult:true,controllableState:true,dataRevision:true,collectionDataRevision:true,valueDraftOwnership:true,valueControllerBinding:true,stateControllerOwnership:true,environmentPort:true,observerHubEnvironment:true,projectionScheduler:true,logicalOwnerTree:true,diagnostics:true,collectionDiagnostics:true,componentProfile:true,componentRuntimeProfile:true,inputModality:true}));
