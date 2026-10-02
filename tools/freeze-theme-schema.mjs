import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {readCanonicalStyleSource} from './style-source.mjs';
import {compileStyles} from './compile-styles.mjs';

// One-time build/audit tool. The generator reads the committed manifest only.
export const extraSlots={
  '--qxframe9a7c2-theme-font-family-heading':'inherit',
  '--qxframe9a7c2-theme-font-family-mono':'ui-monospace, SFMono-Regular, Menlo, monospace'
};
export function publicInterface(){
  const source=readCanonicalStyleSource().replace(/\/\*[\s\S]*?\*\//g,'');
  return [...new Set([...source.matchAll(/--qxframe9a7c2-(?:theme-[a-z0-9-]+|palette-[a-z0-9-]+)/g)].map(m=>m[0]).concat(Object.keys(extraSlots)))].sort();
}
function calls(text){
  const result=[];
  for(let i=0;i<text.length;i++)if(text.startsWith('var(',i)){
    let j=i+4,depth=1,comma=-1;
    for(;j<text.length&&depth;j++){if(text[j]==='(')depth++;if(text[j]===')')depth--;if(text[j]===','&&depth===1&&comma<0)comma=j;}
    result.push({start:i,end:j,name:text.slice(i+4,comma<0?j-1:comma).trim(),fallback:comma<0?null:text.slice(comma+1,j-1).trim()});
  }
  return result;
}
export function buildSnapshot(){
  const css=compileStyles().css.replace(/\/\*[\s\S]*?\*\//g,''), all=new Map(), fallback=new Map(),modeMaps={light:new Map(),dark:new Map()};
  for(const c of calls(css))if(c.fallback!==null&&!fallback.has(c.name))fallback.set(c.name,c.fallback);
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({selector:m[1].trim(),body:m[2]}));
  for(const rule of rules){
    const declarations=[...rule.body.matchAll(/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;{}]+)(?:;|$)/g)].map(m=>[m[1],m[2].trim()]);
    for(const [name,value]of declarations)all.set(name,value);
    const selectors=rule.selector.split(',').map(s=>s.replace(/\s+/g,''));
    for(const mode of ['light','dark'])if(selectors.some(s=>s===':root'||s==='[data-qxframe9a7c2-theme]'||s==='[data-qxframe9a7c2-theme="'+mode+'"]'))for(const [name,value]of declarations)modeMaps[mode].set(name,value);
  }
  const resolve=(value,map,seen=[])=>{
    const cs=calls(value);if(!cs.length)return value;
    let out='',last=0;
    for(const c of cs){
      if(c.start<last)continue;
      assert.ok(!seen.includes(c.name),'Cycle in default material '+c.name);
      const v=map.get(c.name)??c.fallback;
      if(v==null)throw Error('Unbound default '+c.name);
      out+=value.slice(last,c.start)+resolve(v,map,[...seen,c.name]);last=c.end;
    }
    return out+value.slice(last);
  };
  const tokens=[],unbound=[];
  for(const name of publicInterface()){
    const values={};
    for(const mode of ['light','dark']){
      let raw=extraSlots[name]??modeMaps[mode].get(name);
      if(name.startsWith('--qxframe9a7c2-theme-color-'))raw=all.get(name.replace('-theme-color-','-theme-'+mode+'-color-'))??raw;
      if(raw==null)raw=fallback.get(name);
      if(raw==null){unbound.push(name);break;}
      // Preserve public Preset -> Theme geometry links. Resolve only optional
      // defaults that still refer to a private execution channel.
      try{values[mode]=raw.includes('--_qxframe')?resolve(raw,modeMaps[mode]):raw;}
      catch(e){unbound.push(name+': '+e.message);break;}
      assert.ok(!values[mode].includes('--_qxframe'),'Private reference leaked into frozen public default: '+name);
    }
    if(values.light!=null&&values.dark!=null)tokens.push({name,layer:name.includes('-palette-')?'palette':'theme',defaults:values});
  }
  if(unbound.length)throw Error('Review '+new Set(unbound).size+' missing public defaults: '+JSON.stringify([...new Set(unbound)].slice(0,25)));
  const source=readCanonicalStyleSource().replace(/\/\*[\s\S]*?\*\//g,'');
  const optionalComponentOverrides=[...new Set([...source.matchAll(/var\((--qxframe9a7c2-[a-z0-9-]+)\s*,/g)].map(m=>m[1]).filter(n=>!n.includes('-theme-')&&!n.includes('-palette-')&&!/-motion-height$|-stop-offset$|-step-percent$/.test(n)))].sort();
  return {schema:1,state:'FROZEN',scope:'Versioned public visual interface; independent architecture/security signoff is separate.',authority:'QXFRAME9A7C2-Theme-Generator-Development-Guide-v1.md',colorRecipes:'theme-color-recipes-v1.json',interfaceHash:crypto.createHash('sha256').update(publicInterface().join('\n')).digest('hex'),tokens,optionalComponentOverrides,policy:{privateOutput:false,componentSelectors:false,runtimeDiscovery:false,mandatory:'Every Palette/Theme entry in tokens; Component overrides remain optional so default exports do not mask ancestor overrides.'}};
}
export function colorRecipes(){
  // Reviewed migration evidence supplies role meaning once, before freeze.
  // Abstract recipe symbols are build data, not CSS or a runtime token API.
  const baseline=JSON.parse(fs.readFileSync('tools/manifests/css-static-color-baseline.json','utf8'));
  const original=zlib.gunzipSync(Buffer.from(fs.readFileSync('tools/fixtures/css-schema-color/baseline.css.gz.base64','utf8').trim(),'base64')).toString().replace(/\/\*[\s\S]*?\*\//g,'');
  const abstract=text=>text.replace(/--_qxframe9a7c2-/g,'r.').replace(/--qxframe9a7c2-/g,'p.');
  const roles=baseline.entries.map((e,i)=>({id:e.id,target:e.themeToken,axisDependent:baseline.dynamicEntries.includes(i),expression:abstract(e.expression)}));
  const axes=baseline.rows.filter(r=>r.mode==='light').map(r=>r.variant),recipes={};
  const rules=[...original.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({selectors:m[1].trim().split(',').map(s=>s.replace(/\s+/g,'')),decls:[...m[2].matchAll(/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;{}]+)(?:;|$)/g)].map(d=>[abstract(d[1]),abstract(d[2].trim())])}));
  for(const mode of ['light','dark']){
    recipes[mode]={};
    for(const axis of axes){
      const map=new Map();
      for(const rule of rules)if(rule.selectors.some(s=>s===':root'||s==='[data-qxframe9a7c2-theme]'||s==='[data-qxframe9a7c2-theme="'+mode+'"]'||s==='.qxframe9a7c2-button'||(axis!=='bare'&&s==='.is-'+axis)))for(const [key,value]of rule.decls)map.set(key,value);
      const reachable=new Map();
      function visit(text){for(const c of calls(text)){if(reachable.has(c.name)||!map.has(c.name))continue;reachable.set(c.name,map.get(c.name));visit(map.get(c.name));}}
      roles.forEach(r=>visit(r.expression));
      recipes[mode][axis]=Object.fromEntries([...reachable].sort(([a],[b])=>a.localeCompare(b)));
    }
  }
  return {schema:1,sourceEvidence:baseline.sourceCommit,policy:'Pure design recipe data. No computed-style reads or emitted private tokens. Generator binds normalized palette/role inputs and emits public targets only.',axes,roles,recipes};
}
if(process.argv[1]?.endsWith('freeze-theme-schema.mjs')){
  assert.ok(process.argv.includes('--write'),'Snapshot updates are explicit, never automatic during generation.');
  const snapshot=buildSnapshot();fs.mkdirSync('docs/generated',{recursive:true});
  fs.writeFileSync('docs/generated/theme-public-schema-v1.json',JSON.stringify(snapshot,null,2)+'\n');
  fs.writeFileSync('docs/generated/theme-color-recipes-v1.json',JSON.stringify(colorRecipes())+'\n');
  console.log(JSON.stringify({schema:1,tokens:snapshot.tokens.length,optionalOverrides:snapshot.optionalComponentOverrides.length,interfaceHash:snapshot.interfaceHash}));
}
