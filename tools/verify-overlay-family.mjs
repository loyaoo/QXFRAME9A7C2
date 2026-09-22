import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const overlay=fs.readFileSync(path.join(root,'src/components/overlay.js'),'utf8');
assert.match(overlay,/export class OverlayComponent extends Component/,'OverlayComponent must extend Component.');
for(const method of ['open','close','setOpen','setTitle','setContent','setButtons','setHeaderVisible','setFooterVisible','setClosable','getState']) assert.match(overlay,new RegExp('\\n\\s*'+method+'\\s*\\('),'OverlayComponent must own '+method+'().');
for(const name of ['modal','drawer']){
  const source=fs.readFileSync(path.join(root,'src/components/'+name+'.js'),'utf8');
  assert.match(source,new RegExp('export class \\w+ extends OverlayComponent'),name+' must extend OverlayComponent.');
  for(const method of ['open','close','setOpen','destroy','updateOptions']) assert.ok(!new RegExp('\\n\\s{4}'+method+'\\s*\\(').test(source),name+' must not redefine public '+method+'().');
  for(const pattern of [/Registry\.(?:get|define|assert)/,/defineModule\s*\(/,/(?:globalThis|window)\.QXFRAME9A7C2/]) assert.ok(!pattern.test(source),name+' contains legacy dependency '+pattern);
}
console.log(JSON.stringify({ok:true,family:'OverlayComponent',members:['Modal','Drawer'],publicLifecycleOwner:'OverlayComponent'}));
