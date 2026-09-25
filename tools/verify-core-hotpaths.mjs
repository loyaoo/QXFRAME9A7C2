import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Selection } from '../src/core/selection.js';
import { TreeModel } from '../src/core/treeModel.js';
import { Virtualizer } from '../src/core/virtualizer.js';
import { ResponsiveOverflow } from '../src/core/responsiveOverflow.js';
import { TableModel } from '../src/core/tableModel.js';
import { ControllableStateCore } from '../src/core/controllableStateCore.js';
import { ValueEquality } from '../src/utils/valueEquality.js';

let selectionDetail=null;
const selection=Selection.create({multiple:true,values:['a','b','c'],onChange(_values,detail){selectionDetail=detail;}});
assert.equal(selection.set(['c','b','d']),true);
assert.deepEqual(selection.values,['c','b','d'],'Selection order must remain authored order.');
assert.deepEqual(selectionDetail.addedValues,['d']);
assert.deepEqual(selectionDetail.removedValues,['a']);
selection.destroy();

const tree=TreeModel.create({items:[
  {key:'a',items:[{key:'a1'},{key:'a2'}]},
  {key:'b',items:[{key:'b1'}]}
]});
assert.deepEqual(tree.flattenVisible(new Set(['a','b'])).map(record=>record.key),['a','a1','a2','b','b1']);
const publicChildren=tree.getChildren('a');
publicChildren.pop();
assert.deepEqual(tree.getChildren('a').map(record=>record.key),['a1','a2'],'Public child arrays must not mutate internal topology.');
const treeRevision=tree.revision;
tree.setItems([{key:'x',items:[{key:'x1'}]}],{silent:true});
assert.ok(tree.revision>treeRevision,'TreeModel revision must advance on rebuild.');
tree.destroy();

const viewport={scrollTop:15,scrollLeft:0,clientHeight:20,clientWidth:20,addEventListener(){},removeEventListener(){}};
const virtualizer=Virtualizer.create({viewport,count:4,itemKeys:['a','b','c','d'],itemSize:10,observeResize:false});
virtualizer.refresh('anchor-seed');
virtualizer.updateOptions({itemKeys:['c','a','b','d']});
assert.equal(viewport.scrollTop,25,'Keyed Virtualizer anchor must preserve the same item and inner offset after reorder.');
virtualizer.destroy();

function referenceFit(lengths,available,gap,maxCount,tailWidths,tolerance=0){
  const start=maxCount===undefined?lengths.length:Math.max(0,Math.min(lengths.length,Math.floor(Number(maxCount)||0)));
  for(let candidate=start;candidate>=0;candidate-=1){
    const tails=typeof tailWidths==='function'?tailWidths(candidate):tailWidths;
    if(ResponsiveOverflow.requiredSize(lengths,candidate,gap,Array.isArray(tails)?tails:[])<=available+tolerance)return candidate;
  }
  return 0;
}
for(const available of [25,40,55,80,120]){
  const lengths=[18,22,31,27,40];
  const tail=candidate=>[9+String(lengths.length-candidate).length*4,12];
  assert.equal(
    ResponsiveOverflow.fitPrefix({lengths,available,gap:3,maxCount:4,tailWidths:tail}),
    referenceFit(lengths,available,3,4,tail),
    'ResponsiveOverflow optimized prefix sums must preserve candidate selection.'
  );
}

let sortCalls=0;
const table=TableModel.create({
  items:[{key:'a',n:3,text:'Gamma'},{key:'b',n:1,text:'Alpha'},{key:'c',n:2,text:'Beta'}],
  columns:[
    {key:'n',sortable:true,sortValue(value){sortCalls+=1;return value;}},
    {key:'text',searchable:true}
  ],
  selectionMode:'multiple',
  selectedKeys:['b'],
  sortKey:'n',
  sortOrder:'ascend',
  searchValue:''
});
assert.deepEqual(table.getOrderedEntries().map(entry=>entry.key),['b','c','a']);
assert.equal(sortCalls,3,'Default Table sort resolver must run once per projected row.');
table.selectVisible(true,{silent:true});
assert.deepEqual(table.selection.values,['b','c','a'],'selectVisible must preserve existing order and append visible keys in projection order.');
table.selectVisible(false,{silent:true});
assert.deepEqual(table.selection.values,[]);
table.setSearchValue('be',{silent:true});
assert.deepEqual(table.getProjectedEntries().map(entry=>entry.key),['c']);
table.destroy();

const ownership=ControllableStateCore.create({controlled:true,allowOwnershipTransition:true});
assert.equal(ownership.isControlled(),true);
assert.equal(ownership.getOwnership(),'external');
assert.equal(ownership.getState().controlled,true);
ownership.transitionOwnership('internal',{source:'test'});
assert.equal(ownership.isControlled(),false);
ownership.destroy({source:'test'});

assert.equal(ValueEquality.deep({a:1,b:{c:2}},{b:{c:2},a:1}),true);
assert.equal(ValueEquality.deep(new Map([['a',1]]),new Map([['b',1]])),false,'Different Map keys must not compare equal.');
assert.equal(ValueEquality.deep(new Set(['a']),new Set(['b'])),false,'Different Set members must not compare equal.');
assert.equal(ValueEquality.deep(/a/gi,/a/gi),true);
assert.equal(ValueEquality.deep(/a/g,/a/i),false);
assert.equal(fs.existsSync(new URL('../src/core/stateController.js',import.meta.url)),false);
assert.equal(fs.existsSync(new URL('../src/core/valueDraft.js',import.meta.url)),false);

console.log(JSON.stringify({ok:true,selection:'order-preserved-linear-diff',tree:'internal-no-copy',virtualizer:'key-index-anchor',responsiveOverflow:'candidate-equivalent',table:'resolver-once-and-selection-order',ownership:'lightweight-read',valueEquality:'map-set-regexp-correct',compatAliasesRemoved:true}));
