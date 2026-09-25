import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ValueController } from '../src/core/valueController.js';
import { Select } from '../src/components/select.js';
import { TreeSelect } from '../src/components/tree-select.js';
import { Cascader } from '../src/components/cascader.js';
import { Autocomplete } from '../src/components/autocomplete.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

const authored=ValueController.createOptionValueBinding({value:'a',defaultValue:'x'},{value:'a'},value=>String(value||''));
assert.equal(authored.controlled,false,'authored value must remain internally owned unless controlled is explicit.');
assert.equal(authored.write('b',{source:'keyboard',reason:'interaction'},true),true);
assert.equal(authored.value,'b','authored value must remain user-mutable.');

const controlled=ValueController.createOptionValueBinding({value:'a'},{value:'a'},value=>String(value||''),{controlled:true});
assert.equal(controlled.controlled,true,'explicit controlled mode must retain external ownership.');
assert.equal(controlled.write('b',{source:'keyboard',reason:'proposal'},true),true);
assert.equal(controlled.value,'a','explicit controlled proposal must not replace canonical value.');
const pending=controlled.getOwnershipState().pendingRequestIds[0];
assert.ok(pending,'explicit controlled proposal must create a pending request.');
assert.equal(controlled.syncExternal('b',{requestId:pending}),true);
assert.equal(controlled.value,'b','external sync must update explicit controlled canonical value.');

const uncontrolled=ValueController.createOptionValueBinding({defaultValue:'a'},{defaultValue:'a'},value=>String(value||''));
assert.equal(uncontrolled.controlled,false,'defaultValue must remain internally owned.');
assert.equal(uncontrolled.write('b',{source:'keyboard',reason:'interaction'},true),true);
assert.equal(uncontrolled.value,'b','uncontrolled interaction must update canonical value.');

for(const Type of [Select,TreeSelect,Cascader,Autocomplete]){
  assert.equal(Type.profile?.ownership?.value,'ValueController',Type.name+' must declare ValueController ownership.');
  assert.equal(Type.profile?.overlay?.mode,'popup',Type.name+' must declare popup overlay capability.');
}
for(const file of ['select.js','tree-select.js','cascader.js','autocomplete.js']){
  const source=fs.readFileSync(path.join(root,'src/components',file),'utf8');
  assert.ok(!/stateController\.js|StateController\./.test(source),file+' must not depend on a retired value-state alias.');
  assert.ok(/ValueController\./.test(source),file+' must use the canonical ValueController entry point.');
}

authored.destroy();
controlled.destroy();
uncontrolled.destroy();
console.log(JSON.stringify({ok:true,family:'picker-like-value',members:['Select','TreeSelect','Cascader','Autocomplete'],owner:'ValueController',compatAliasesRemoved:true}));
