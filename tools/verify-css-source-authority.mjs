import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { CANONICAL_STYLE_ENTRY, getCanonicalStyleModulePaths, readCanonicalStyleSource } from './style-source.mjs';

// Plain CSS source authority: src/styles holds only main/*.css and components/*.css, every
// file is listed exactly once in css-order.json, and no SCSS or @import survives.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stylesDir=path.join(root,'src','styles');

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(full));
    else out.push(path.relative(root,full).replaceAll('\\','/'));
  }
  return out;
}

const onDisk=walk(stylesDir).sort();
const modules=getCanonicalStyleModulePaths({root});
assert.ok(fs.existsSync(path.join(root,CANONICAL_STYLE_ENTRY)),'CSS source-order manifest is missing.');
assert.equal(fs.existsSync(path.join(root,'src','qxframe9a7c2.css')),false,'Legacy monolithic CSS source must not exist in src/.');
assert.deepEqual(onDisk.filter(rel=>!/^src\/styles\/(main|components)\/[a-z0-9-]+\.css$/.test(rel)),[],'src/styles may only contain main/*.css and components/*.css.');
assert.equal(new Set(modules).size,modules.length,'css-order.json lists a module twice.');
assert.deepEqual([...modules].sort(),onDisk,'css-order.json sourceModules must list every CSS source file exactly once.');
assert.ok(modules.some(rel=>rel.startsWith('src/styles/main/')),'Main CSS modules are missing.');
assert.ok(modules.some(rel=>rel.startsWith('src/styles/components/')),'Component CSS modules are missing.');

const offenders=[];
for(const rel of modules){
  const source=fs.readFileSync(path.join(root,rel),'utf8');
  if(/@(?:import|use|forward|mixin|include|function)\b/.test(source)) offenders.push(rel);
}
assert.deepEqual(offenders,[],'CSS source modules must not use @import or SCSS directives: '+offenders.join(', '));

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal((pkg.devDependencies||{}).sass,undefined,'sass must not be a build dependency.');
assert.equal((pkg.dependencies||{}).sass,undefined,'sass must not be a runtime dependency.');
assert.ok(readCanonicalStyleSource({root}).length>0,'Canonical CSS source must be readable.');

console.log(JSON.stringify({ok:true,entry:CANONICAL_STYLE_ENTRY,moduleCount:modules.length,mainModuleCount:modules.filter(rel=>rel.startsWith('src/styles/main/')).length,componentModuleCount:modules.filter(rel=>rel.startsWith('src/styles/components/')).length,scssAbsent:true,importAbsent:true}));
