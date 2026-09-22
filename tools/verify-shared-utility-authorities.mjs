import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TimeUnit } from '../src/utils/timeUnit.js';
import { WheelMetrics } from '../src/utils/wheelMetrics.js';
import { TreeQuery } from '../src/utils/treeQuery.js';
import { ItemAccessors } from '../src/core/itemAccessors.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

// 76→80: pure time/wheel algorithms have one owner.
assert.deepEqual(TimeUnit.parse('11:22:33 PM',{showSecond:true,use12Hours:true}),{hour:23,minute:22,second:33});
assert.equal(TimeUnit.format({hour:23,minute:22,second:33},{showSecond:true,use12Hours:true}),'11:22:33 PM');
assert.equal(WheelMetrics.itemHeight('xs'),28);
assert.equal(WheelMetrics.itemHeight('md'),36);
assert.equal(WheelMetrics.itemHeight('xl'),44);

for(const file of ['src/components/time-picker.js','src/components/time-panel.js']){
  const source=read(file);
  assert.match(source,/from ['"]\.\.\/utils\/timeUnit\.js['"]/,`${file} must import TimeUnit.`);
  assert.ok(!/function\s+(?:pad|normalizeTime|formatTime|parseTime|currentTime|cloneTime|sameTime|timeNumber)\s*\(/.test(source),`${file} must not re-own canonical time helpers.`);
}
for(const file of ['src/components/time-panel.js','src/components/wheel-panel.js','src/components/wheel-picker.js']){
  const source=read(file);
  assert.match(source,/from ['"]\.\.\/utils\/wheelMetrics\.js['"]/,`${file} must import WheelMetrics.`);
  assert.ok(!/function\s+(?:defaultItemHeight|normalizeWheelSize)\s*\(/.test(source),`${file} must not re-own wheel metrics.`);
  assert.ok(!/\b(?:xs|sm|md|lg|xl)\s*:\s*(?:28|32|36|40|44)\b/.test(source),`${file} must not duplicate the canonical wheel size map.`);
}

// 80→84: hierarchy lookup/traversal lives in TreeQuery and item semantics in ItemAccessors.
const accessors=ItemAccessors.create({getChildren:item=>item&&item.items});
const sample=[{key:'a',value:'A',items:[{key:'a1',value:'A1'}]},{key:'b',value:'B'}];
assert.equal(TreeQuery.findByKey(sample,'a1',{accessors}).depth,1);
assert.deepEqual(TreeQuery.findPath(sample,'A1',{accessors,by:'value'}).map(item=>item.key),['a','a1']);
assert.equal(TreeQuery.index(sample,{accessors}).records.length,3);

const queryConsumers=[
  'src/components/select.js',
  'src/components/cascader.js',
  'src/components/dropdown.js',
  'src/components/option-list.js',
  'src/components/tree-select.js',
  'src/components/menu.js',
  'src/components/transfer.js'
];
for(const file of queryConsumers){
  const source=read(file);
  assert.match(source,/from ['"]\.\.\/utils\/treeQuery\.js['"]/,`${file} must import TreeQuery.`);
  assert.ok(!/function\s+(?:visit|walk)\s*\([^)]*\)\s*\{[^]{]{0,240}(?:childrenOf|\.items)/s.test(source),`${file} must not own recursive hierarchy traversal.`);
}

console.log(JSON.stringify({ok:true,timeUnit:true,wheelMetrics:true,treeQuery:true,queryConsumers:queryConsumers.length}));
