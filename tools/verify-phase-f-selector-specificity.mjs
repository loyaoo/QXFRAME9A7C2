import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/qxframe9a7c2.css'),'utf8');
const css=source.replace(/\/\*[\s\S]*?\*\//g,'');

function splitTop(input,isSeparator){
  const out=[];
  let start=0;
  let paren=0;
  let bracket=0;
  let quote=null;
  let escaped=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(ch==='\\'){escaped=true;continue;}
      if(ch===quote) quote=null;
      continue;
    }
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='('){paren++;continue;}
    if(ch===')'){paren=Math.max(0,paren-1);continue;}
    if(ch==='['){bracket++;continue;}
    if(ch===']'){bracket=Math.max(0,bracket-1);continue;}
    if(paren===0&&bracket===0&&isSeparator(ch)){
      if(i>start) out.push(input.slice(start,i).trim());
      start=i+1;
      while(start<input.length&&/\s/.test(input[start])) start++;
      i=start-1;
    }
  }
  if(start<input.length) out.push(input.slice(start).trim());
  return out.filter(Boolean);
}

const selectorMembers=[];
const block=/([^{}]+)\{/g;
let match;
while((match=block.exec(css))){
  const prelude=match[1].trim();
  if(!prelude||prelude.startsWith('@')||/^(?:from|to|\d+(?:\.\d+)?%)$/.test(prelude)) continue;
  selectorMembers.push(...splitTop(prelude,ch=>ch===','));
}

const stateAtom=/:not\([^)]*\)|:(?:hover|focus-visible|focus-within|focus|active|disabled|checked|read-only|read-write)\b|\.is-(?:hover|focus|keyboard-focus|active|selected|disabled|loading|readonly|error|warning|success|expanded|current)\b/g;
const repeated=[];
for(const selector of selectorMembers){
  const compounds=splitTop(selector,ch=>/\s/.test(ch)||ch==='>'||ch==='+'||ch==='~');
  for(const compound of compounds){
    const counts=new Map();
    for(const atom of compound.match(stateAtom)||[]) counts.set(atom,(counts.get(atom)||0)+1);
    const duplicateAtoms=[...counts.entries()].filter(([,count])=>count>1);
    if(duplicateAtoms.length) repeated.push({selector,compound,duplicateAtoms});
  }
}

assert.deepEqual(repeated,[],
  'A selector compound must not repeat the same state atom to manufacture specificity. Repeat states on separate relationship compounds remain valid.');

const required=[
  '.qxframe9a7c2-table .qxframe9a7c2-table-expand-trigger:hover:not(:disabled)',
  '.qxframe9a7c2-table .qxframe9a7c2-table-expand-trigger:focus-visible:not(:disabled)',
  '.qxframe9a7c2-table .qxframe9a7c2-table-expand-trigger.is-keyboard-focus:not(:disabled)',
  '.qxframe9a7c2-table .qxframe9a7c2-table-expand-trigger:disabled'
];
for(const selector of required) assert.ok(source.includes(selector),selector+' normalized state selector is missing.');

const forbidden=[
  ':hover:not(:disabled):hover:not(:disabled)',
  ':focus-visible:not(:disabled):focus-visible:not(:disabled)',
  '.is-keyboard-focus:not(:disabled).is-keyboard-focus:not(:disabled)',
  ':disabled:disabled'
];
for(const fragment of forbidden) assert.equal(source.includes(fragment),false,'Repeated specificity fragment remains: '+fragment);

assert.equal(source.includes('@layer'),false,'Phase F must not introduce @layer.');
assert.equal(source.includes(':is('),false,'Phase F must not introduce :is().');
assert.equal(source.includes(':where('),false,'Phase F must not introduce :where().');

console.log(JSON.stringify({
  ok:true,
  repeatedCompoundStateAtoms:repeated.length,
  tableExpandTriggerNormalized:true
}));
