// PRE-INVENTORY ONLY. This scanner never authorizes Token deletion.
// Run against the exact checked-out source tree, not a previous generated dist.
// node tools/qa/css-refactor/token-usage.mjs --out=artifacts/css-refactor-token-usage.json
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {getCanonicalStyleModulePaths} from '../../style-source.mjs';
import {THEME_TOKEN_NAMES} from '../../../docs/create/tokens.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const hash=t=>crypto.createHash('sha256').update(t).digest('hex');
const get=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const cssModules=getCanonicalStyleModulePaths({root});
assert.equal(new Set(cssModules).size,cssModules.length,'Duplicate CSS source module');
assert.equal(THEME_TOKEN_NAMES.length,220,'Frozen Theme API count changed');
assert.equal(new Set(THEME_TOKEN_NAMES).size,220,'Duplicated public Theme API');
const publicNames=new Set(THEME_TOKEN_NAMES.map(x=>x.startsWith('--')?x:'--qxframe9a7c2-theme-'+x));
function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,'');}
const decls=new Map(), reads=new Map(), modules=[];
for(const rel of cssModules){
 const raw=get(rel), css=stripComments(raw);
 modules.push({path:rel,sha256:hash(raw),bytes:Buffer.byteLength(raw),scopeOccurrences:(css.match(/@scope\s*\(/g)||[]).length});
 // This is a textual PRE-INVENTORY: not an AST-validated ownership map.
 for(const match of css.matchAll(/(--(?:_)?qxframe9a7c2-[\w-]+)\s*:/g)){
  const name=match[1];if(!decls.has(name))decls.set(name,[]);
  const line=css.slice(0,match.index).split('\n').length;
  decls.get(name).push({module:rel,line});
 }
 for(const match of css.matchAll(/var\(\s*(--(?:_)?qxframe9a7c2-[\w-]+)/g)){
  const name=match[1];if(!reads.has(name))reads.set(name,[]);
  const line=css.slice(0,match.index).split('\n').length;
  reads.get(name).push({module:rel,line});
 }
}
function walk(rel){
 const folder=path.join(root,rel);
 if(!fs.existsSync(folder))return[];
 const out=[];
 for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  const p=path.join(rel,e.name);
  if(e.isDirectory()){if(['node_modules','dist','fixtures','.git','qa/reports','artifacts'].includes(e.name))continue;out.push(...walk(p));}
  else if(/\.(?:js|mjs|html|ts|json)$/.test(e.name))out.push(p);
 }
 return out;
}
// JS string assembly, delegated components and third-party user CSS are not
// statically decidable; those remain 'dynamic-unknown', never 'safe-to-delete'.
const consumerFiles=[...new Set(['src','docs','tools'].flatMap(walk))].sort();
const referenced=new Map();
for(const rel of consumerFiles){
 const body=get(rel);
 for(const match of body.matchAll(/--(?:_)?qxframe9a7c2-[\w-]+/g)){
  const name=match[0];
  if(!referenced.has(name))referenced.set(name,new Set());
  referenced.get(name).add(rel);
 }
}
const rows=[...decls].sort(([a],[b])=>a.localeCompare(b)).map(([name,owners])=>{
 const cssReads=reads.get(name)||[], external=[...(referenced.get(name)||[])].sort();
 let classification='private-owned-and-read';
 if(publicNames.has(name)||name.startsWith('--qxframe9a7c2-theme-'))classification='public-theme-frozen';
 else if(!name.startsWith('--_'))classification='public-or-legacy-dynamic-hold';
 else if(!cssReads.length)classification=external.length?'private-no-css-reads-runtime-text-reference-hold':'private-no-css-reads-dynamic-unknown-hold';
 return {name,classification,definitions:owners,css_read_count:cssReads.length,
  css_read_modules:[...new Set(cssReads.map(x=>x.module))].sort(),
  runtime_text_reference_count:external.length,runtime_text_files:external,
  safe_to_delete:false};
});
const undefReads=[...reads].filter(([name])=>!decls.has(name)).sort(([a],[b])=>a.localeCompare(b)).map(([name,locations])=>({name,locations}));
const classes=rows.reduce((a,r)=>(a[r.classification]=(a[r.classification]||0)+1,a),{});
const report={status:'R1-source-text-preinventory-only-NO-deletion-approval',baseline:'62d9a8402c19460ced37265acc6d110ae2cfda76',
 modules,registeredThemeCount:THEME_TOKEN_NAMES.length,consumerFilesCount:consumerFiles.length,
 uniqueCustomPropertyDefinitions:rows.length,readCalls:[...reads.values()].reduce((s,a)=>s+a.length,0),
 classifications:classes,rows,undefinedOrInheritedReads:undefReads,
 warnings:['Text scanner, not CSS declaration/cascade AST. Statements may contain inert string literals.','No match in current JS or CSS does NOT prove absence of dynamic strings, public overrides, external user CSS, browser computed consumers or optional routes.','Every result safe_to_delete:false. R1-01 requires dynamic unknown closure before any R2 elimination.']};
const output=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(output){const p=path.resolve(output);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({ok:true,status:report.status,modules:modules.length,registeredThemeCount:report.registeredThemeCount,uniqueCustomPropertyDefinitions:rows.length,consumerFiles:consumerFiles.length,classes,output:output||null}));
