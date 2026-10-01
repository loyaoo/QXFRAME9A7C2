import { readCanonicalStyleSource } from './style-source.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const css=readCanonicalStyleSource({root});
const lines=css.split(/\r?\n/);

const dynamicOwners=new Map([
  ['--qxframe9a7c2-collapse-motion-height',{file:'src/components/collapse.js',set:/setProperty\(['"]--qxframe9a7c2-collapse-motion-height['"]/}],
  ['--qxframe9a7c2-menu-inline-motion-height',{file:'src/components/menu.js',set:/setProperty\(['"]--qxframe9a7c2-menu-inline-motion-height['"]/}],
  ['--qxframe9a7c2-gradient-stop-offset',{file:'src/components/color-picker.js',set:/setProperty\(['"]--qxframe9a7c2-gradient-stop-offset['"]/}],
  ['--qxframe9a7c2-step-percent',{file:'src/components/steps.js',set:/setProperty\(['"]--qxframe9a7c2-step-percent['"]/}]
]);

function varCalls(text){
  const out=[];
  for(let i=0;i<text.length;i++){
    if(!text.startsWith('var(',i)) continue;
    let depth=1,j=i+4,quote='';
    for(;j<text.length&&depth>0;j++){
      const ch=text[j];
      if(quote){if(ch===quote&&text[j-1]!=='\\')quote='';continue;}
      if(ch==='"'||ch==="'"){quote=ch;continue;}
      if(ch==='(')depth++;
      else if(ch===')')depth--;
    }
    if(depth!==0) continue;
    const body=text.slice(i+4,j-1);
    let nested=0,comma=-1,q='';
    for(let k=0;k<body.length;k++){
      const ch=body[k];
      if(q){if(ch===q&&body[k-1]!=='\\')q='';continue;}
      if(ch==='"'||ch==="'"){q=ch;continue;}
      if(ch==='(')nested++;
      else if(ch===')')nested--;
      else if(ch===','&&nested===0){comma=k;break;}
    }
    const name=(comma<0?body:body.slice(0,comma)).trim();
    if(/^--_?qxframe9a7c2-[a-z0-9-]+$/i.test(name)) out.push({name,hasFallback:comma>=0});
    i=j-1;
  }
  return out;
}

const definitions=new Map();
const declaration=/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;{}]*)(?:;|(?=}))/ig;
let match;
while((match=declaration.exec(css))){
  const name=match[1],value=match[2].trim();
  if(!definitions.has(name)) definitions.set(name,[]);
  definitions.get(name).push({value,index:match.index});
}

const unresolved=new Map();
for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
  for(const call of varCalls(lines[lineIndex])){
    if(definitions.has(call.name)) continue;
    let rec=unresolved.get(call.name);
    if(!rec){rec={name:call.name,total:0,withFallback:0,withoutFallback:0,lines:[]};unresolved.set(call.name,rec);}
    rec.total++;
    call.hasFallback?rec.withFallback++:rec.withoutFallback++;
    if(rec.lines.length<5)rec.lines.push(lineIndex+1);
  }
}
const noFallback=[...unresolved.values()].filter(x=>x.withoutFallback>0).sort((a,b)=>a.name.localeCompare(b.name));
assert.deepEqual(noFallback.map(x=>x.name),[...dynamicOwners.keys()].sort(),'Every unresolved no-fallback CSS variable must be one of the verified instance-dynamic projection channels.');
for(const [name,owner] of dynamicOwners){
  const source=read(owner.file);
  assert.match(source,owner.set,owner.file+' must project '+name+' before CSS consumes it.');
}

const graph=new Map();
for(const [name,decls] of definitions){
  if(!graph.has(name))graph.set(name,new Set());
  for(const decl of decls) for(const call of varCalls(decl.value)) if(definitions.has(call.name)) graph.get(name).add(call.name);
}
let cursor=0;
const stack=[],active=new Set(),indexes=new Map(),low=new Map(),components=[];
function visit(node){
  indexes.set(node,cursor);low.set(node,cursor);cursor++;stack.push(node);active.add(node);
  for(const next of graph.get(node)||[]){
    if(!indexes.has(next)){visit(next);low.set(node,Math.min(low.get(node),low.get(next)));}
    else if(active.has(next))low.set(node,Math.min(low.get(node),indexes.get(next)));
  }
  if(low.get(node)===indexes.get(node)){
    const component=[];let next;
    do{next=stack.pop();active.delete(next);component.push(next);}while(next!==node);
    components.push(component);
  }
}
for(const node of graph.keys())if(!indexes.has(node))visit(node);
const cycles=components.filter(group=>group.length>1||(graph.get(group[0])||new Set()).has(group[0]));
assert.deepEqual(cycles,[],'Canonical custom-property dependency graph must be acyclic.');

function flatRules(text){
  const out=[];
  const re=/([^{}]+)\{([^{}]*)\}/g;
  let m;
  while((m=re.exec(text)))out.push({selector:m[1].trim(),body:m[2],index:m.index});
  return out;
}
const rules=flatRules(css);
const variableNames=body=>new Set([...body.matchAll(/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:/ig)].map(m=>m[1]));
const lightCandidates=rules.filter(rule=>rule.selector.includes('[data-qxframe9a7c2-theme="light"]')&&rule.body.includes('--_qxframe9a7c2-mode-bg:'));
const darkCandidates=rules.filter(rule=>rule.selector.includes('[data-qxframe9a7c2-theme="dark"]')&&rule.body.includes('--_qxframe9a7c2-mode-bg:'));
assert.equal(lightCandidates.length,1,'Expected exactly one canonical Light mode recipe.');
assert.equal(darkCandidates.length,1,'Expected exactly one canonical Dark mode recipe.');
const lightVars=variableNames(lightCandidates[0].body),darkVars=variableNames(darkCandidates[0].body);
assert.deepEqual([...lightVars].sort(),[...darkVars].sort(),'Light and Dark mode recipes must define the same custom-property contract.');
assert.equal(lightVars.size,94,'Canonical Light/Dark mode recipe contract unexpectedly changed; audit additions/removals before updating this count.');

assert.doesNotMatch(lightCandidates[0].selector,/\[data-qxframe9a7c2-theme="light"\][\s\S]*\[data-qxframe9a7c2-theme="light"\]/,'Light selector must not contain duplicate members.');
assert.doesNotMatch(darkCandidates[0].selector,/\[data-qxframe9a7c2-theme="dark"\][\s\S]*\[data-qxframe9a7c2-theme="dark"\]/,'Dark selector must not contain duplicate members.');

for(const [name,value] of [
  ['--_qxframe9a7c2-standard-light-bg','rgb(var(--qxframe9a7c2-palette-white))'],
  ['--_qxframe9a7c2-standard-light-surface','rgb(var(--qxframe9a7c2-palette-white))'],
  ['--_qxframe9a7c2-standard-light-surface-raised','rgb(var(--qxframe9a7c2-palette-white))'],
  ['--_qxframe9a7c2-standard-dark-bg','var(--_qxframe9a7c2-neutral-1)'],
  ['--_qxframe9a7c2-standard-dark-surface','var(--_qxframe9a7c2-neutral-2)'],
  ['--_qxframe9a7c2-standard-dark-surface-raised','var(--_qxframe9a7c2-neutral-2)']
]){
  const values=(definitions.get(name)||[]).map(entry=>entry.value);
  assert.ok(values.includes(value),name+' must preserve the canonical standard Neutral baseline.');
}

// NEUTRAL-GREY-CSS-010: canonical Grey/Neutral contract.
const greyExpected=[
  '10, 10, 10','23, 23, 23','38, 38, 38','64, 64, 64','82, 82, 82','115, 115, 115','161, 161, 161',
  '212, 212, 212','220, 220, 220','229, 229, 229','237, 237, 237','245, 245, 245','250, 250, 250'
];
assert.doesNotMatch(css,/--qxframe9a7c2-palette-grey-0\b/,'Canonical Grey must not retain grey-0.');
assert.doesNotMatch(css,/--qxframe9a7c2-color-[a-z0-9-]+\s*:\s*var\(--qxframe9a7c2-(?:palette|theme-seed)-[a-z0-9-]+\)\s*;/i,
  'Physical/theme-seed forwarding color aliases must not exist; consume the canonical palette RGB source or semantic/theme owner directly.');
for(let i=1;i<=13;i+=1){
  const paletteName='--qxframe9a7c2-palette-grey-'+i;
  const paletteValues=(definitions.get(paletteName)||[]).map(entry=>entry.value);
  assert.deepEqual(paletteValues,[greyExpected[i-1]],paletteName+' must match the Tailwind-derived canonical RGB primitive.');
  const neutralName='--_qxframe9a7c2-neutral-'+i;
  const expected='var(--qxframe9a7c2-theme-neutral-'+i+', rgb(var(--qxframe9a7c2-palette-grey-'+i+')))';
  assert.ok((definitions.get(neutralName)||[]).some(entry=>entry.value===expected),neutralName+' must default directly to Grey while preserving the public override.');
  assert.ok(definitions.has('--_qxframe9a7c2-auxiliary-base-'+i),'MixedGray auxiliary base '+i+' must remain available.');
  assert.ok(definitions.has('--_qxframe9a7c2-auxiliary-'+i),'MixedGray auxiliary '+i+' must remain available.');
}
assert.ok(definitions.has('--_qxframe9a7c2-neutral-mix-ratio'),'MixedGray neutral mix ratio must remain available.');

// NEUTRAL-GREY-CSS-011: cold Gray may exist only as an explicit optional palette/theme seed.
// Standard Light/Dark utility output must remain on the chroma-zero canonical Grey axis.
for(const [name,value] of [
  ['--qxframe9a7c2-shadow-popup','0 0.75rem 2rem rgba(var(--qxframe9a7c2-palette-grey-3), .18)']
]){
  assert.ok((definitions.get(name)||[]).some(entry=>entry.value===value),name+' must preserve perceived darkness while using canonical Grey.');
}
for(const [name,values] of [
  ['--_qxframe9a7c2-token-scroll-track',[
    'rgba(var(--qxframe9a7c2-palette-grey-5), .14)',
    'rgba(var(--qxframe9a7c2-palette-grey-10), .14)'
  ]],
  ['--_qxframe9a7c2-token-scroll-thumb',[
    'rgba(var(--qxframe9a7c2-palette-grey-5), .46)',
    'rgba(var(--qxframe9a7c2-palette-grey-10), .46)'
  ]],
  ['--_qxframe9a7c2-token-scroll-thumb-hover',[
    'rgba(var(--qxframe9a7c2-palette-grey-5), .68)',
    'rgba(var(--qxframe9a7c2-palette-grey-10), .68)'
  ]],
  ['--_qxframe9a7c2-token-loading-mask',[
    'rgba(var(--qxframe9a7c2-palette-white), .74)',
    'rgba(var(--qxframe9a7c2-palette-grey-3), .74)'
  ]]
]){
  const actual=(definitions.get(name)||[]).map(entry=>entry.value);
  for(const value of values) assert.ok(actual.includes(value),name+' must include '+value+'.');
}
const coldGrayConsumerLines=[];
for(let i=0;i<lines.length;i+=1){
  const line=lines[i];
  if(!/var\(\s*--qxframe9a7c2-palette-gray-[0-9]+\)/i.test(line)) continue;
  if(/^\s*--qxframe9a7c2-color-gray-[0-9]+\s*:/i.test(line)) continue;
  if(/^\s*--qxframe9a7c2-theme-seed-gray\s*:/i.test(line)) continue;
  coldGrayConsumerLines.push(i+1);
}
assert.deepEqual(coldGrayConsumerLines,[],
  'Cold Gray is optional palette infrastructure only; standard/component CSS must consume canonical Grey instead.');
assert.match(css,/\.is-gray\{--_qxframe9a7c2-accent-seed:var\(--_qxframe9a7c2-seed-grey\);--_qxframe9a7c2-accent-on:var\(--_qxframe9a7c2-on-grey,/,
  '.is-gray must remain only as a spelling alias for the canonical Grey component accent.');
assert.doesNotMatch(css,/\.is-gray\{[^}]*var\(--_qxframe9a7c2-(?:seed|on)-gray\)/,
  'No component gray variant may consume the cold Gray accent seed.');
for(const [label,body,patterns] of [
  ['Light',lightCandidates[0].body,[
    /--_qxframe9a7c2-mode-surface-muted:\s*var\(--qxframe9a7c2-theme-light-surface-muted,\s*var\(--_qxframe9a7c2-neutral-12\)\)/,
    /--_qxframe9a7c2-mode-text:\s*var\(--qxframe9a7c2-theme-light-text,\s*var\(--_qxframe9a7c2-neutral-1\)\)/,
    /--_qxframe9a7c2-mode-text-secondary:\s*var\(--qxframe9a7c2-theme-light-text-secondary,\s*var\(--_qxframe9a7c2-neutral-2\)\)/,
    /--_qxframe9a7c2-mode-text-muted:\s*var\(--qxframe9a7c2-theme-light-text-muted,\s*var\(--_qxframe9a7c2-neutral-6\)\)/,
    /--_qxframe9a7c2-mode-text-placeholder:\s*var\(--qxframe9a7c2-theme-light-text-placeholder,\s*var\(--_qxframe9a7c2-neutral-6\)\)/,
    /--_qxframe9a7c2-mode-border:\s*var\(--qxframe9a7c2-theme-light-border,\s*var\(--_qxframe9a7c2-neutral-10\)\)/,
    /--_qxframe9a7c2-mode-border-subtle:\s*var\(--qxframe9a7c2-theme-light-border-subtle,\s*var\(--_qxframe9a7c2-neutral-12\)\)/,
    /--_qxframe9a7c2-mode-border-strong:\s*var\(--qxframe9a7c2-theme-light-border-strong,\s*var\(--_qxframe9a7c2-neutral-8\)\)/,
    /--_qxframe9a7c2-mode-input-border:\s*var\(--qxframe9a7c2-theme-light-input-border,\s*var\(--_qxframe9a7c2-neutral-10\)\)/
  ]],
  ['Dark',darkCandidates[0].body,[
    /--_qxframe9a7c2-mode-surface-muted:\s*var\(--qxframe9a7c2-theme-dark-surface-muted,\s*var\(--_qxframe9a7c2-neutral-3\)\)/,
    /--_qxframe9a7c2-mode-text:\s*var\(--qxframe9a7c2-theme-dark-text,\s*var\(--_qxframe9a7c2-neutral-13\)\)/,
    /--_qxframe9a7c2-mode-text-secondary:\s*var\(--qxframe9a7c2-theme-dark-text-secondary,\s*var\(--_qxframe9a7c2-neutral-13\)\)/,
    /--_qxframe9a7c2-mode-text-muted:\s*var\(--qxframe9a7c2-theme-dark-text-muted,\s*var\(--_qxframe9a7c2-neutral-7\)\)/,
    /--_qxframe9a7c2-mode-text-placeholder:\s*var\(--qxframe9a7c2-theme-dark-text-placeholder,\s*var\(--_qxframe9a7c2-neutral-7\)\)/,
    /--_qxframe9a7c2-mode-border:\s*var\(--qxframe9a7c2-theme-dark-border,\s*rgba\(var\(--qxframe9a7c2-palette-white\),\s*\.10\)\)/,
    /--_qxframe9a7c2-mode-border-subtle:\s*var\(--qxframe9a7c2-theme-dark-border-subtle,\s*rgba\(var\(--qxframe9a7c2-palette-white\),\s*\.08\)\)/,
    /--_qxframe9a7c2-mode-border-strong:\s*var\(--qxframe9a7c2-theme-dark-border-strong,\s*rgba\(var\(--qxframe9a7c2-palette-white\),\s*\.15\)\)/,
    /--_qxframe9a7c2-mode-input-border:\s*var\(--qxframe9a7c2-theme-dark-input-border,\s*rgba\(var\(--qxframe9a7c2-palette-white\),\s*\.15\)\)/
  ]]
]){
  for(const pattern of patterns) assert.match(body,pattern,label+' Neutral recipe mapping changed unexpectedly.');
}
assert.doesNotMatch(css,/--_qxframe9a7c2-semantic-(?:subtle|subtle-hover|subtle-active|text-disabled|bg-disabled|border-disabled):[^;]*color-mix\(/,
  'Ordinary Neutral subtle/disabled semantic states must resolve from the mode recipe instead of ad-hoc color-mix.');
assert.match(css,/--_qxframe9a7c2-control-border:\s*var\(--qxframe9a7c2-family-control-border,\s*var\(--_qxframe9a7c2-semantic-input-border\)\)/,
  'Control family must consume the semantic input-border role.');
assert.match(css,/--_qxframe9a7c2-card-divider:\s*var\(--qxframe9a7c2-card-divider-color,\s*var\(--_qxframe9a7c2-card-border\)\)/,
  'Card internal dividers must default to the same resolved border as the Card outer frame; divider-color remains an explicit override slot.');

assert.match(lightCandidates[0].body,/--_qxframe9a7c2-mode-focus-visible:\s*rgb\(var\(--qxframe9a7c2-palette-black\)\)/,'Light keyboard focus-visible must remain black.');
assert.match(darkCandidates[0].body,/--_qxframe9a7c2-mode-focus-visible:\s*rgb\(var\(--qxframe9a7c2-palette-white\)\)/,'Dark keyboard focus-visible must remain white.');

let withoutCompatDeclarations=css.replace(/--qxframe9a7c2-color-[a-z0-9-]+\s*:\s*[^;{}]*(?:;|(?=\}))/ig,'');
const compatConsumers=[...withoutCompatDeclarations.matchAll(/var\(\s*(--qxframe9a7c2-color-[a-z0-9-]+)/ig)].map(m=>m[1]);
assert.deepEqual(compatConsumers,[],'Public --qxframe9a7c2-color-* compatibility outputs must not be consumed by canonical CSS.');

for(const stale of ['--qxframe9a7c2-control-height-md','--qxframe9a7c2-font-family-base','--qxframe9a7c2-font-family']){
  assert.ok(!noFallback.some(entry=>entry.name===stale),'Static unresolved token remains: '+stale);
}
assert.doesNotMatch(css,/--_qxframe9a7c2-scroll-edge-shadow\s*:\s*var\(--qxframe9a7c2-scroll-edge-shadow\s*,\s*var\(--_qxframe9a7c2-scroll-edge-shadow\)\)/,'Scroll edge shadow must not self-reference.');

const physicalUses=[];
for(let i=0;i<lines.length;i++){
  if(i<1300)continue;
  if(/var\(\s*--qxframe9a7c2-palette-(?:grey|gray|cyan|teal|green|lime|yellow|orange|red|pink|purple|blue|azure|white|black)/i.test(lines[i])) physicalUses.push(i+1);
}
const hardColorUses=[];
for(let i=0;i<lines.length;i++){
  if(i<1300)continue;
  const scrub=lines[i].replace(/--_?qxframe9a7c2-[a-z0-9-]+\s*:[^;]+;/ig,'');
  if(/#[0-9a-f]{3,8}\b|rgba?\(\s*(?:\d|\.)/i.test(scrub)) hardColorUses.push(i+1);
}

console.log(JSON.stringify({
  ok:true,
  definitions:definitions.size,
  unresolved:unresolved.size,
  safeOverrideSlots:[...unresolved.values()].filter(x=>x.withoutFallback===0).length,
  dynamicNoFallback:[...dynamicOwners.keys()].sort(),
  cycles:cycles.length,
  modeRecipeVariables:lightVars.size,
  lightDarkSymmetric:true,
  compatibilityColorConsumers:0,
  physicalPaletteUseLinesAfterFoundation:physicalUses.length,
  hardColorUseLinesAfterFoundation:hardColorUses.length
}));
