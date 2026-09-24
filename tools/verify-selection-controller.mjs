import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Selection } from '../src/core/selection.js';
import { SelectionController } from '../src/core/selectionController.js';
import { Collection } from '../src/core/collection.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

const source=fs.readFileSync(path.join(root,'src/core/selectionController.js'),'utf8');
assert.ok(/Selection\.create\s*\(/.test(source),'SelectionController must compose the canonical Selection store.');
assert.ok(/HierarchicalSelection\.create\s*\(/.test(source),'SelectionController hierarchy support must delegate to HierarchicalSelection.');
assert.ok(!/new\s+Set\s*\(/.test(source),'SelectionController must not create a second selected-key Set store.');

const selectionSource=fs.readFileSync(path.join(root,'src/core/selection.js'),'utf8');
assert.ok(/DataRevision\.create\s*\(/.test(selectionSource),'Selection must use shared DataRevision instead of a private mutation counter.');
assert.ok(!/mutationVersion/.test(selectionSource),'Selection must not retain the old private mutationVersion authority.');

let reentrant=null;
const selection=Selection.create({
  multiple:true,
  value:['a'],
  beforeChange:function(){
    if(!reentrant){
      reentrant=true;
      selection.set(['z'],{silent:true,source:'test',reason:'reentrant'});
    }
  }
});
const revisionBefore=selection.dataRevision;
const accepted=selection.set(['b'],{silent:true,source:'test',reason:'outer'});
assert.equal(accepted,false,'outer Selection transaction must reject after a reentrant revision change.');
assert.deepEqual(selection.values,['z']);
assert.ok(selection.dataRevision>revisionBefore,'reentrant Selection mutation must advance DataRevision.');
const selectionRef=selection.createRef('z');
assert.equal(selection.isCurrentRef(selectionRef),true);
selection.set(['c'],{silent:true});
assert.equal(selection.isCurrentRef(selectionRef),false,'Selection refs must become stale after mutation.');
selection.destroy();

const collection=Collection.create({items:[{key:'a'},{key:'b'}],getKey:function(item){return item.key;}});
const controller=SelectionController.create({
  revisionSource:collection,
  channels:{
    selected:{multiple:true,value:['a']},
    checked:{multiple:true,value:['b']}
  }
});
assert.deepEqual(controller.selected.values,['a']);
assert.deepEqual(controller.checked.values,['b']);
controller.selected.select('b',{silent:true});
assert.deepEqual(controller.selected.values,['a','b']);
assert.deepEqual(controller.checked.values,['b'],'selected and checked channels must not alias one store.');

controller.setAnchor('selected','b');
assert.equal(controller.getAnchor('selected'),'b');
const anchorRevision=controller.dataRevision;
collection.setItems([{key:'a'},{key:'b'},{key:'c'}],{silent:true});
assert.ok(controller.dataRevision>anchorRevision);
assert.equal(controller.getAnchor('selected'),null,'dataset revision changes must invalidate the old range/selection anchor.');

const hierarchy=controller.createHierarchy({
  childrenOf:function(item){return item.items||[];},
  keyOf:function(item){return item.key;}
});
const tree={key:'p',items:[{key:'c1'},{key:'c2'}]};
assert.deepEqual(hierarchy.toggle(tree,[],true).sort(),['c1','c2'],'hierarchical projection must remain delegated to HierarchicalSelection.');

const state=controller.snapshot();
assert.deepEqual(state.channels.selected.values,['a','b']);
assert.deepEqual(state.channels.checked.values,['b']);
controller.destroy();
collection.destroy();

console.log(JSON.stringify({
  ok:true,
  owner:'SelectionController',
  delegates:['Selection','HierarchicalSelection','DataRevision'],
  channels:['selected','checked'],
  activeKeyOwner:'ActiveItem',
  duplicateStore:false,
  revisionBoundAnchor:true
}));
