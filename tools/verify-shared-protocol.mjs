import assert from 'node:assert/strict';
import { ActionContext, OperationResult, ControllableStateCore, DataRevision, EnvironmentPort, ProjectionScheduler, Diagnostics, ComponentProfile, LogicalOwnerTree, InputModality, SharedProtocol } from '../src/core/index.js';

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
observer.disconnect();
assert.equal(observerDisconnected,true);

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

const profile=ComponentProfile.define({
  name:'ProtocolProbe',
  value:{mode:'controlled-or-default'},
  focus:{mode:'virtual-navigation'},
  ownership:{value:'ValueController',focus:'FocusController'},
  dependencies:{interaction:['focus']}
});
assert.equal(profile.name,'ProtocolProbe');
assert.throws(()=>ComponentProfile.define({name:'Bad',unknown:true}),/Unknown ComponentProfile field/);

assert.ok(InputModality);
assert.equal(SharedProtocol.ActionContext,ActionContext);
assert.equal(SharedProtocol.LogicalOwnerTree,LogicalOwnerTree);

projection.destroy();
tree.destroy();
diagnostics.destroy();
internal.destroy();
external.destroy();

console.log(JSON.stringify({ok:true,actionContext:true,operationResult:true,controllableState:true,dataRevision:true,environmentPort:true,projectionScheduler:true,logicalOwnerTree:true,diagnostics:true,componentProfile:true,inputModality:true}));
