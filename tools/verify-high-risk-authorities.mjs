import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const expected={
  Image:'src/components/image.js', JSON:'src/components/json.js', Pagination:'src/components/pagination.js',
  Tags:'src/components/tags.js', Upload:'src/components/upload.js', Table:'src/components/table.js',
  Message:'src/components/message.js', Notification:'src/components/notification.js', NoticeService:'src/core/noticeService.js'
};
const components=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/esm-component-authority.json'),'utf8')).authorities;
const support=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/esm-support-authority.json'),'utf8')).authorities;
const blocks=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/esm-building-block-authority.json'),'utf8')).authorities;
const authorityByName=new Map([...components,...support,...blocks].map(entry=>[entry.name,entry]));
const forbidden=[/\bdefineModule\s*\(/,/(?:Core|Headless|DOMHeadless|Component|BuildingBlock)Registry\.(?:get|define|assert)\s*\(/,/(?:globalThis|window|self)\.QXFRAME9A7C2/,/\bbrand\.(?:CoreRegistry|HeadlessRegistry|DOMHeadlessRegistry|ComponentRegistry|BuildingBlockRegistry)/,/\(function\s*\(global\)/];
for(const [name,sourcePath] of Object.entries(expected)){
  const authority=authorityByName.get(name);assert.ok(authority,`Missing ESM authority manifest entry: ${name}`);assert.equal(authority.source,sourcePath,`${name} authority source drifted`);
  const source=fs.readFileSync(path.join(root,sourcePath),'utf8');
  for(const pattern of forbidden)assert.ok(!pattern.test(source),`${name} reintroduced legacy runtime dependency: ${pattern}`);
}
const image=fs.readFileSync(path.join(root,expected.Image),'utf8');
const upload=fs.readFileSync(path.join(root,expected.Upload),'utf8');
const pagination=fs.readFileSync(path.join(root,expected.Pagination),'utf8');
const table=fs.readFileSync(path.join(root,expected.Table),'utf8');
const message=fs.readFileSync(path.join(root,expected.Message),'utf8');
const notification=fs.readFileSync(path.join(root,expected.Notification),'utf8');
assert.match(upload,/import\s+\{\s*Image\s*\}\s+from\s+['"]\.\/image\.js['"]/, 'Upload must statically import Image authority.');
assert.match(table,/import\s+\{\s*Pagination\s*\}\s+from\s+['"]\.\/pagination\.js['"]/, 'Table must statically import Pagination authority.');
assert.match(pagination,/import\s+\{\s*Select\s*\}\s+from\s+['"]\.\/select\.js['"]/, 'Pagination must statically import Select authority.');
assert.match(message,/import\s+\{\s*NoticeService\s*\}\s+from\s+['"]\.\.\/core\/noticeService\.js['"]/, 'Message must statically import NoticeService.');
assert.match(notification,/import\s+\{\s*NoticeService\s*\}\s+from\s+['"]\.\.\/core\/noticeService\.js['"]/, 'Notification must statically import NoticeService.');
assert.ok(!fs.existsSync(path.join(root,'src/modules')),'src/modules must be physically removed from the modern source tree.');
assert.ok(!fs.existsSync(path.join(root,'src/compat')),'src/compat must be physically removed from the modern source tree.');
console.log(JSON.stringify({ok:true,authorityCount:Object.keys(expected).length,reachableLegacyModuleImplementations:0,names:Object.keys(expected).sort()}));
