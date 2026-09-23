import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const expected=Object.freeze({
  Menu:'src/components/menu.js',
  Tree:'src/components/tree.js',
  Transfer:'src/components/transfer.js',
  List:'src/components/list.js',
  ItemCollection:'src/components/item-collection.js',
  OptionList:'src/components/option-list.js',
  VirtualList:'src/components/virtual-list.js',
  Tabs:'src/components/tabs.js',
  Calendar:'src/components/calendar.js',
  PeriodPanel:'src/components/period-panel.js'
});
const components=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/esm-component-authority.json'),'utf8')).authorities||[];
const building=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/esm-building-block-authority.json'),'utf8')).authorities||[];
const support=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/esm-support-authority.json'),'utf8')).authorities||[];
const byName=new Map([...components,...building,...support].map(entry=>[entry.name,entry]));
const forbidden=[
  /(?:Core|Headless|DOMHeadless|Component|BuildingBlock)Registry\.(?:get|define|assert)\s*\(/,
  /\bdefineModule\s*\(/,
  /(?:globalThis|window|self)\.QXFRAME9A7C2/,
  /\bbrand\.(?:CoreRegistry|HeadlessRegistry|DOMHeadlessRegistry|ComponentRegistry|BuildingBlockRegistry)/,
  /\(function\s*\(global\)/
];
for(const [name,sourcePath] of Object.entries(expected)){
  const entry=byName.get(name);
  assert.ok(entry,`${name} must have an ESM authority manifest entry.`);
  assert.equal(entry.source,sourcePath,`${name} authority must point at ${sourcePath}.`);
  const source=fs.readFileSync(path.join(root,sourcePath),'utf8');
  for(const pattern of forbidden) assert.ok(!pattern.test(source),`${name} must not depend on the legacy runtime: ${pattern}`);
}
assert.ok(!fs.existsSync(path.join(root,'src/modules')),'src/modules must be physically removed from the modern source tree.');
assert.ok(!fs.existsSync(path.join(root,'src/compat')),'src/compat must be physically removed from the modern source tree.');
console.log(JSON.stringify({ok:true,stage:'84→88',authorities:Object.keys(expected),count:Object.keys(expected).length}));
