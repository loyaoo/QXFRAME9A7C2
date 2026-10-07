import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalStyleSource} from './style-source.mjs';
import {verifySemanticRuleSource} from './theme-v2-contract.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const css=readCanonicalStyleSource({root});
const theme=read('src/styles/main/theme-visual-v2.css');

const dynamicOwners=new Map([
  ['--qxframe9a7c2-collapse-motion-height',{file:'src/components/collapse.js',set:/setProperty\(['"]--qxframe9a7c2-collapse-motion-height['"]/}],
  ['--qxframe9a7c2-menu-inline-motion-height',{file:'src/components/menu.js',set:/setProperty\(['"]--qxframe9a7c2-menu-inline-motion-height['"]/}],
  ['--qxframe9a7c2-gradient-stop-offset',{file:'src/components/color-picker.js',set:/setProperty\(['"]--qxframe9a7c2-gradient-stop-offset['"]/}],
  ['--qxframe9a7c2-step-percent',{file:'src/components/steps.js',set:/setProperty\(['"]--qxframe9a7c2-step-percent['"]/}]
]);

function varCalls(text){
  const out=[];
  for(let i=0;i<text.length;i++){
    if(!text.startsWith('var(',i))continue;
    let depth=1,j=i+4,quote='';
    for(;j<text.length&&depth>0;j++){
      const ch=text[j];
      if(quote){if(ch===quote&&text[j-1]!=='\\')quote='';continue;}
      if(ch==='"'||ch==="'"){quote=ch;continue;}
      if(ch==='(')depth++;else if(ch===')')depth--;
    }
    if(depth!==0)continue;
    const body=text.slice(i+4,j-1);let nested=0,comma=-1,q='';
    for(let k=0;k<body.length;k++){
      const ch=body[k];
      if(q){if(ch===q&&body[k-1]!=='\\')q='';continue;}
      if(ch==='"'||ch==="'"){q=ch;continue;}
      if(ch==='(')nested++;else if(ch===')')nested--;else if(ch===','&&nested===0){comma=k;break;}
    }
    const name=(comma<0?body:body.slice(0,comma)).trim();
    if(/^--_?qxframe9a7c2-[a-z0-9-]+$/i.test(name))out.push({name,hasFallback:comma>=0});
    i=j-1;
  }
  return out;
}

const definitions=new Map();
const declaration=/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;{}]*)(?:;|(?=}))/ig;
let match;
while((match=declaration.exec(css))){
  const name=match[1],value=match[2].trim();
  if(!definitions.has(name))definitions.set(name,[]);
  definitions.get(name).push({value,index:match.index});
}

const unresolved=new Map();
for(const call of varCalls(css)){
  if(definitions.has(call.name)||call.hasFallback)continue;
  unresolved.set(call.name,(unresolved.get(call.name)||0)+1);
}
assert.deepEqual([...unresolved.keys()].sort(),[...dynamicOwners.keys()].sort(),'Every unresolved no-fallback variable must be an approved instance-dynamic channel.');
for(const [name,owner] of dynamicOwners)assert.match(read(owner.file),owner.set,owner.file+' must project '+name+' before CSS consumes it.');

const graph=new Map();
for(const [name,decls] of definitions){
  const edges=new Set();
  for(const decl of decls)for(const call of varCalls(decl.value))if(definitions.has(call.name))edges.add(call.name);
  graph.set(name,edges);
}
let cursor=0;const stack=[],active=new Set(),indexes=new Map(),low=new Map(),components=[];
function visit(node){
  indexes.set(node,cursor);low.set(node,cursor);cursor++;stack.push(node);active.add(node);
  for(const next of graph.get(node)||[]){
    if(!indexes.has(next)){visit(next);low.set(node,Math.min(low.get(node),low.get(next)));}
    else if(active.has(next))low.set(node,Math.min(low.get(node),indexes.get(next)));
  }
  if(low.get(node)===indexes.get(node)){
    const group=[];let next;do{next=stack.pop();active.delete(next);group.push(next);}while(next!==node);components.push(group);
  }
}
for(const node of graph.keys())if(!indexes.has(node))visit(node);
const cycles=components.filter(group=>group.length>1||(graph.get(group[0])||new Set()).has(group[0]));
assert.deepEqual(cycles,[],'Canonical custom-property dependency graph must be acyclic.');

verifySemanticRuleSource(root);
assert.doesNotMatch(css,/--qxframe9a7c2-palette-/,'Retired public Palette graph must not return.');
// createApp v3 §5: only registered closed-list tokens may be declared; dark mode is the .dark class.
const {THEME_TOKEN_NAMES}=await import(new URL('../docs/create/tokens.js',import.meta.url).href);
const registeredTheme=new Set(THEME_TOKEN_NAMES);
const retiredThemeDecls=[...css.matchAll(/(--qxframe9a7c2-theme-[a-z0-9-]+)\s*:/gi)].map(m=>m[1]).filter(name=>!registeredTheme.has(name));
assert.deepEqual([...new Set(retiredThemeDecls)],[],'Retired public Theme graph must not return.');
assert.match(css,/(?:^|[},\s])\.dark\s*\{[^}]*color-scheme:\s*dark\s*;/,'Dark mode boundary must remain explicit.');
assert.match(css,/(?:^|[},\s]):root\s*\{[^}]*color-scheme:\s*light\s*;/,'Light mode boundary must remain explicit.');
for(const role of ['--_qxframe9a7c2-semantic-bg','--_qxframe9a7c2-semantic-surface','--_qxframe9a7c2-semantic-text','--_qxframe9a7c2-semantic-border','--_qxframe9a7c2-semantic-focus'])assert.ok(definitions.has(role),'Shared semantic graph role missing: '+role);

console.log(JSON.stringify({ok:true,definitions:definitions.size,edges:[...graph.values()].reduce((n,set)=>n+set.size,0),cycles:0,dynamicOwners:dynamicOwners.size,publicThemeSystem:'createapp-v3-closed-list',paletteLayer:false,modeAuthority:'color-scheme+light-dark'}));
