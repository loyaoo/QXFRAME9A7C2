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

const itemCollectionSource=fs.readFileSync(path.join(root,'src/components/item-collection.js'),'utf8');
assert.ok(/selectionController\.js/.test(itemCollectionSource),'ItemCollection must enter selection authority through SelectionController.');
assert.ok(!/from ['"]\.\.\/core\/selection\.js['"]/.test(itemCollectionSource),'ItemCollection must not import Selection directly after migration.');
assert.ok(!/Selection\.create\s*\(/.test(itemCollectionSource),'ItemCollection must not create a parallel Selection store.');
assert.ok(/selectionController\.getAnchor\(selectionChannel\)/.test(itemCollectionSource),'ItemCollection selected anchor must be read from SelectionController.');
assert.ok(!/var selectionAnchorValue\s*=\s*initialSelectionValues/.test(itemCollectionSource),'ItemCollection must not retain its old component-local anchor owner.');
assert.ok(/getSelectionController/.test(itemCollectionSource),'ItemCollection must expose its canonical SelectionController.');
assert.ok(/setRevisionSource\(selectionChannel,\s*collection\)/.test(itemCollectionSource),'ItemCollection must bind dataset revision to its own selection channel.');
assert.ok(/getDataRevision\)\s*\?\s*selectionController\.getDataRevision\(selectionChannel\)/.test(itemCollectionSource),'ItemCollection state must read the channel-scoped data revision.');

const treeSource=fs.readFileSync(path.join(root,'src/components/tree.js'),'utf8');
assert.ok(/selectionController\.js/.test(treeSource),'Tree must enter selection authority through SelectionController.');
assert.ok(!/from ['"]\.\.\/core\/(?:selection|hierarchicalSelection)\.js['"]/.test(treeSource),'Tree must not import direct Selection/HierarchicalSelection owners after migration.');
assert.ok(/selected:\s*\{[^}]*multiple:/.test(treeSource),'Tree must declare a selected channel.');
assert.ok(/checked:\s*\{[^}]*multiple:\s*true/.test(treeSource),'Tree must declare a separate checked channel.');
assert.ok(/selectionController\.createHierarchy\s*\(/.test(treeSource),'Tree checked/indeterminate projection must delegate hierarchy through SelectionController.');
assert.ok(/selection:\s*'SelectionController'/.test(treeSource),'Tree ComponentProfile must declare SelectionController ownership.');
assert.ok(/selectionController:\s*selectionController/.test(treeSource),'Tree ItemCollection must share the same SelectionController instead of creating another selected store.');

const optionListSource=fs.readFileSync(path.join(root,'src/components/option-list.js'),'utf8');
assert.ok(/getSelectionController/.test(optionListSource),'OptionList must expose the ItemCollection SelectionController authority.');
const transferSource=fs.readFileSync(path.join(root,'src/components/transfer.js'),'utf8');
assert.ok(/selectionController\.js/.test(transferSource),'Transfer must enter selection authority through SelectionController.');
assert.ok(/sourceChecked:\s*\{[^}]*multiple:\s*true/.test(transferSource),'Transfer must declare a sourceChecked channel.');
assert.ok(/targetChecked:\s*\{[^}]*multiple:\s*true/.test(transferSource),'Transfer must declare a targetChecked channel.');
assert.ok(/selectionChannel:\s*side\s*===\s*['"]source['"]\s*\?\s*['"]sourceChecked['"]\s*:\s*['"]targetChecked['"]/.test(transferSource),'Transfer lists must bind to explicit checked channels.');
assert.ok(/selectionController:\s*selectionController/.test(transferSource),'Transfer source/target ItemCollections must share one SelectionController facade.');
assert.ok(/getSelectionController/.test(transferSource),'Transfer must expose its canonical SelectionController.');
assert.ok(/selection:\s*['"]SelectionController['"]/.test(transferSource),'Transfer ComponentProfile must declare SelectionController ownership.');
assert.ok(!/from ['"]\.\.\/core\/selection\.js['"]/.test(transferSource),'Transfer must not add a direct Selection owner.');
const selectionSource=fs.readFileSync(path.join(root,'src/core/selection.js'),'utf8');
assert.ok(/DataRevision\.create\s*\(/.test(selectionSource),'Selection must use shared DataRevision instead of a private mutation counter.');
assert.ok(!/mutationVersion/.test(selectionSource),'Selection must not retain the old private mutationVersion authority.');

let reentrant=false;
const selection=Selection.create({multiple:true,value:['a']});
selection.updateOptions({
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

const sourceCollection=Collection.create({items:[{key:'s1'},{key:'s2'}],getKey:function(item){return item.key;}});
const targetCollection=Collection.create({items:[{key:'t1'}],getKey:function(item){return item.key;}});
const transferController=SelectionController.create({
  channels:{
    sourceChecked:{multiple:true,value:['s1']},
    targetChecked:{multiple:true,value:['t1']}
  },
  revisionSources:{sourceChecked:sourceCollection,targetChecked:targetCollection}
});
assert.notEqual(transferController.getChannel('sourceChecked'),transferController.getChannel('targetChecked'),'Transfer checked channels must remain separate Selection stores.');
assert.equal(transferController.getRevisionSource('sourceChecked'),sourceCollection);
assert.equal(transferController.getRevisionSource('targetChecked'),targetCollection);
transferController.setAnchor('sourceChecked','s1');
transferController.setAnchor('targetChecked','t1');
const targetRevisionBefore=transferController.getDataRevision('targetChecked');
sourceCollection.setItems([{key:'s2'}],{silent:true});
assert.equal(transferController.getAnchor('sourceChecked'),null,'source dataset replacement must invalidate only the sourceChecked anchor.');
assert.equal(transferController.getAnchor('targetChecked'),'t1','source dataset replacement must not invalidate targetChecked anchor.');
assert.equal(transferController.getDataRevision('targetChecked'),targetRevisionBefore,'source dataset replacement must not advance targetChecked data revision.');
targetCollection.setItems([{key:'t2'}],{silent:true});
assert.equal(transferController.getAnchor('targetChecked'),null,'target dataset replacement must invalidate targetChecked anchor independently.');
assert.deepEqual(Object.keys(transferController.dataRevisions).sort(),['sourceChecked','targetChecked']);
transferController.destroy();
sourceCollection.destroy();
targetCollection.destroy();

console.log(JSON.stringify({
  ok:true,
  owner:'SelectionController',
  delegates:['Selection','HierarchicalSelection','DataRevision'],
  channels:['selected','checked','sourceChecked','targetChecked'],
  activeKeyOwner:'ActiveItem',
  duplicateStore:false,
  revisionBoundAnchor:true,
  firstPack:['ItemCollection','List','OptionList','Tree'],
  secondPack:['Transfer'],
  perChannelRevision:true
}));
