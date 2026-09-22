import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const srcRoot=path.join(root,'src');
function walk(dir){const out=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);if(entry.isDirectory())out.push(...walk(absolute));else if(entry.isFile()&&/\.(?:js|mjs)$/.test(entry.name))out.push(absolute);}return out;}
const sourceFiles=walk(srcRoot);
const graph=new Map();let edgeCount=0;let externalImports=0;
const forbidden=[/\b(?:CoreRegistry|HeadlessRegistry|DOMHeadlessRegistry|ComponentRegistry|BuildingBlockRegistry)\b/,/\bdefineModule\s*\(/,/(?:globalThis|window|self)\.QXFRAME9A7C2/,/TEMP-ESM-BRIDGE/];
for(const absolute of sourceFiles){
  const relative=path.relative(root,absolute).replaceAll(path.sep,'/');
  const source=fs.readFileSync(absolute,'utf8');
  for(const pattern of forbidden) assert.ok(!pattern.test(source),`${relative} contains legacy runtime dependency pattern: ${pattern}`);
  const imports=[];
  const importPattern=/\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  for(const match of source.matchAll(importPattern)){
    const specifier=match[1];
    if(!specifier.startsWith('.')){externalImports+=1;continue;}
    let resolved=path.resolve(path.dirname(absolute),specifier);
    if(!path.extname(resolved))resolved+='.js';
    assert.ok(fs.existsSync(resolved),`${relative} imports missing module ${specifier}`);
    const rel=path.relative(root,resolved).replaceAll(path.sep,'/');
    assert.ok(rel.startsWith('src/'),`${relative} internal import escaped src: ${rel}`);
    imports.push(rel);edgeCount+=1;
  }
  graph.set(relative,imports);
}
const visiting=new Set(),visited=new Set(),stack=[],cycles=[];
function visit(node){if(visited.has(node))return;if(visiting.has(node)){const i=stack.indexOf(node);cycles.push(stack.slice(i).concat(node));return;}visiting.add(node);stack.push(node);for(const next of graph.get(node)||[])if(graph.has(next))visit(next);stack.pop();visiting.delete(node);visited.add(node);}
for(const node of graph.keys())visit(node);
assert.deepEqual(cycles,[],`ESM import cycles detected: ${cycles.map(c=>c.join(' -> ')).join('; ')}`);
console.log(JSON.stringify({ok:true,files:graph.size,edges:edgeCount,externalImports,cycles:0,legacyImports:0},null,2));
