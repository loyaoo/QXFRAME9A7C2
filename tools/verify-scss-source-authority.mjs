import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { CANONICAL_STYLE_ENTRY, getCanonicalStyleModulePaths, readCanonicalStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const forbidden=['src','qxframe9a7c2.css'].join('/');
const extensions=new Set(['.mjs','.js','.json','.yml','.yaml']);

function walk(dir){
  const out=[];
  if(!fs.existsSync(dir)) return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(full.includes(path.join('tools','fixtures'))) continue;
      out.push(...walk(full));
    }else if(entry.isFile()&&extensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const scanned=[
  ...walk(path.join(root,'tools')),
  ...walk(path.join(root,'docs','generated')),
  path.join(root,'package.json')
];
const offenders=[];
for(const file of scanned){
  const relative=path.relative(root,file).replaceAll('\\','/');
  // Immutable migration evidence may quote the retired path as historical context.
  if(/^tools\/manifests\/css-token-phase-[a-z0-9-]+\.json$/i.test(relative)) continue;
  const source=fs.readFileSync(file,'utf8');
  if(source.includes(forbidden)) offenders.push(relative);
}

assert.equal(fs.existsSync(path.join(root,'src','qxframe9a7c2.css')),false,'Legacy CSS source must not exist in src/.');
assert.deepEqual(offenders,[],'Tools/generated manifests must not depend on the retired CSS source: '+offenders.join(', '));
assert.ok(fs.existsSync(path.join(root,CANONICAL_STYLE_ENTRY)),'Canonical SCSS entry is missing.');
const modules=getCanonicalStyleModulePaths({root});
assert.ok(modules.length>=4,'Canonical SCSS source must remain decomposed into ordered modules.');
for(const rel of modules) assert.ok(fs.existsSync(path.join(root,rel)),'Missing canonical SCSS module: '+rel);
const componentModules=modules.filter(rel=>rel.startsWith('src/styles/components/'));
const retiredHoldingModules=new Set([
  'src/styles/components/_core.scss',
  'src/styles/components/_tail.scss',
  'src/styles/components/_tail-closeout.scss'
]);
assert.deepEqual(componentModules.filter(rel=>retiredHoldingModules.has(rel)),[],'Temporary component holding partials must not return after physical modularization closeout.');
const componentAggregator=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');
const expectedComponentAggregator=componentModules
  .map(rel=>'@use "'+path.basename(rel,'.scss').replace(/^_/,'')+'";')
  .join('\n')+'\n';
assert.equal(componentAggregator,expectedComponentAggregator,'Component aggregator @use order must exactly match css-order.json sourceModules.');
assert.ok(readCanonicalStyleSource({root}).length>0,'Canonical SCSS source must be readable.');

console.log(JSON.stringify({ok:true,entry:CANONICAL_STYLE_ENTRY,moduleCount:modules.length,componentModuleCount:componentModules.length,legacySourceAbsent:true,temporaryHoldingModules:0,aggregatorOrderLocked:true,offenders:0}));
